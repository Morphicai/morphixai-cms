/**
 * Optimus 平台 token 校验(introspect)的服务端封装。
 * 给"别的团队自己的后端"用:拿到请求里的平台 token,问平台这是谁、有什么权限。
 * JWT 密钥不出平台边界,这个 SDK 只是 POST /api/auth/introspect 的薄壳,
 * 零第三方依赖(Node 18+ 原生 fetch)。
 *
 * 刻意不做框架集成(Nest guard/express 中间件)——那是消费方三行代码的事,
 * 做了反而绑定框架版本。
 */
import { createHmac } from "node:crypto";

export type TokenType = "admin" | "client" | "service";

export interface ServiceIdentity {
    key: string;
    name: string;
}

export interface IntrospectResult {
    active: boolean;
    type?: TokenType;
    user?: Record<string, unknown>;
    /** 仅 admin token 有;超管为 ["*"] */
    perms?: string[];
    /** 仅 service token 有 */
    service?: ServiceIdentity;
}

export interface OptimusServerSdkOptions {
    /** 平台 API 地址,如 http://optimus-api:8084/api */
    baseUrl: string;
    /** 缓存 TTL(ms)。introspect 结果按 token 缓存,默认 60s;0 关缓存 */
    cacheTtlMs?: number;
    /** 请求超时(ms),默认 5s */
    timeoutMs?: number;
    /** 服务身份签发密钥。未传时读取 process.env.SERVICE_TOKEN_SECRET */
    serviceTokenSecret?: string;
    /** 服务身份令牌有效期，默认读取 SERVICE_TOKEN_EXPIRES_IN 或使用 5m */
    serviceTokenExpiresIn?: string | number;
}

interface CacheEntry {
    result: IntrospectResult;
    expiresAt: number;
}

export class OptimusServerSdk {
    private readonly baseUrl: string;
    private readonly cacheTtlMs: number;
    private readonly timeoutMs: number;
    private readonly serviceTokenSecret?: string;
    private readonly serviceTokenExpiresIn: string | number;
    private readonly cache = new Map<string, CacheEntry>();

    constructor(options: OptimusServerSdkOptions) {
        this.baseUrl = options.baseUrl.replace(/\/$/, "");
        this.cacheTtlMs = options.cacheTtlMs ?? 60_000;
        this.timeoutMs = options.timeoutMs ?? 5_000;
        this.serviceTokenSecret = options.serviceTokenSecret || process.env.SERVICE_TOKEN_SECRET;
        this.serviceTokenExpiresIn = options.serviceTokenExpiresIn || process.env.SERVICE_TOKEN_EXPIRES_IN || "5m";
    }

    /**
     * 校验 token。网络失败抛错(调用方决定降级策略);token 无效不抛,
     * 返回 { active: false }——"验证过了、是假的"和"没验证成"是两回事
     */
    async introspect(token: string, type: TokenType = "admin"): Promise<IntrospectResult> {
        const key = `${type}:${token}`;
        const now = Date.now();
        const hit = this.cache.get(key);
        if (hit && hit.expiresAt > now) return hit.result;

        const res = await fetch(`${this.baseUrl}/auth/introspect`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, type }),
            signal: AbortSignal.timeout(this.timeoutMs),
        });
        if (!res.ok) throw new Error(`introspect HTTP ${res.status}`);
        const body = (await res.json()) as { code: number; msg?: string; data?: IntrospectResult };
        if (body.code !== 200 || !body.data) throw new Error(body.msg || "introspect 响应异常");

        const result = body.data;
        if (this.cacheTtlMs > 0) {
            this.cache.set(key, { result, expiresAt: now + this.cacheTtlMs });
            // 顺手清过期项,别让 map 无界涨
            if (this.cache.size > 10_000) {
                for (const [k, v] of this.cache) if (v.expiresAt <= now) this.cache.delete(k);
            }
        }
        return result;
    }

    /** 便捷判断:active 且持有指定权限码(超管 "*" 通配) */
    async hasPerm(token: string, perm: string): Promise<boolean> {
        const r = await this.introspect(token, "admin");
        if (!r.active || !Array.isArray(r.perms)) return false;
        return r.perms.includes("*") || r.perms.includes(perm);
    }

    /**
     * 使用服务共享密钥本地签发短期 service token。
     * token 本身不带 Bearer 前缀，调用 HTTP 时再按协议放入 Authorization header。
     * 这是有意的本地签发：服务不需要为启动认证再依赖平台可用性；平台自省仍会
     * 反查服务目录的 enabled 状态，因此下线服务后旧 token 立即失效。
     */
    getServiceToken(serviceKey: string): string {
        if (!/^[a-z][a-z0-9-]{0,49}$/.test(serviceKey)) {
            throw new Error("serviceKey must be a lowercase slug up to 50 characters");
        }
        if (!this.serviceTokenSecret) {
            throw new Error("SERVICE_TOKEN_SECRET is required to issue a service token");
        }

        const issuedAt = Math.floor(Date.now() / 1000);
        const expiresAt = issuedAt + parseDurationSeconds(this.serviceTokenExpiresIn);
        const header = encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
        const payload = encodeBase64Url(JSON.stringify({ sub: serviceKey, type: "service", iat: issuedAt, exp: expiresAt }));
        const unsigned = `${header}.${payload}`;
        const signature = createHmac("sha256", this.serviceTokenSecret).update(unsigned).digest("base64url");
        return `${unsigned}.${signature}`;
    }

    /** 校验服务身份。网络失败抛错，token 无效则返回 active:false。 */
    async verifyServiceToken(token: string): Promise<IntrospectResult> {
        const result = await this.introspect(token, "service");
        if (!result.active || result.type !== "service" || !result.service) {
            return { active: false, type: "service" };
        }
        return result;
    }

    /** 测试/长驻进程用:清空缓存 */
    clearCache(): void {
        this.cache.clear();
    }
}

function encodeBase64Url(value: string): string {
    return Buffer.from(value, "utf8").toString("base64url");
}

function parseDurationSeconds(value: string | number): number {
    if (typeof value === "number") {
        if (!Number.isFinite(value) || value <= 0) throw new Error("serviceTokenExpiresIn must be positive");
        return Math.floor(value);
    }
    const match = /^(\d+)(s|m|h|d)$/.exec(value.trim());
    if (!match) throw new Error("serviceTokenExpiresIn must use a duration such as 5m, 1h, or 1d");
    const amount = Number(match[1]);
    const unitSeconds = { s: 1, m: 60, h: 3600, d: 86400 }[match[2] as "s" | "m" | "h" | "d"];
    return amount * unitSeconds;
}

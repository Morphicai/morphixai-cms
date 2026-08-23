/**
 * Optimus 平台 token 校验(introspect)的服务端封装。
 * 给"别的团队自己的后端"用:拿到请求里的平台 token,问平台这是谁、有什么权限。
 * JWT 密钥不出平台边界,这个 SDK 只是 POST /api/auth/introspect 的薄壳,
 * 零第三方依赖(Node 18+ 原生 fetch)。
 *
 * 刻意不做框架集成(Nest guard/express 中间件)——那是消费方三行代码的事,
 * 做了反而绑定框架版本。
 */

export type TokenType = "admin" | "client";

export interface IntrospectResult {
    active: boolean;
    type?: TokenType;
    user?: Record<string, unknown>;
    /** 仅 admin token 有;超管为 ["*"] */
    perms?: string[];
}

export interface OptimusServerSdkOptions {
    /** 平台 API 地址,如 http://optimus-api:8084/api */
    baseUrl: string;
    /** 缓存 TTL(ms)。introspect 结果按 token 缓存,默认 60s;0 关缓存 */
    cacheTtlMs?: number;
    /** 请求超时(ms),默认 5s */
    timeoutMs?: number;
}

interface CacheEntry {
    result: IntrospectResult;
    expiresAt: number;
}

export class OptimusServerSdk {
    private readonly baseUrl: string;
    private readonly cacheTtlMs: number;
    private readonly timeoutMs: number;
    private readonly cache = new Map<string, CacheEntry>();

    constructor(options: OptimusServerSdkOptions) {
        this.baseUrl = options.baseUrl.replace(/\/$/, "");
        this.cacheTtlMs = options.cacheTtlMs ?? 60_000;
        this.timeoutMs = options.timeoutMs ?? 5_000;
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

    /** 测试/长驻进程用:清空缓存 */
    clearCache(): void {
        this.cache.clear();
    }
}

import { BadRequestException, Injectable } from "@nestjs/common";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { hkdfSync } from "node:crypto";

export const SERVICE_TOKEN_TYPE = "service" as const;
export const DEFAULT_SERVICE_TOKEN_EXPIRES_IN = "5m";

/**
 * HKDF 参数。这三个值与 `@optimus/server-sdk` 里的同名常量必须逐字节一致——
 * 两个包各实现一份派生函数（server-sdk 刻意保持零依赖，供外部团队独立安装，
 * 不能反过来依赖平台包），靠双方测试里的共享测试向量锚定。
 * 改动其中任何一个值都会让所有已签发的 service token 立即失效，且必须两个包同步改。
 */
export const SERVICE_KEY_HKDF_SALT = "optimus-service-token-v1";
export const SERVICE_KEY_HKDF_LENGTH = 32;

const SERVICE_KEY_RE = /^[a-z][a-z0-9-]{0,49}$/;

/**
 * 服务身份 JWT 的平台侧工具。
 *
 * 每个服务用**从主密钥派生的专属密钥**签名，而不是所有服务共用一把。这样即使某个
 * 服务的派生密钥完全泄露，泄露方也只能冒充该服务自己：派生是单向的，拿到派生密钥
 * 既反推不出主密钥，也导不出别的服务的密钥。
 *
 * 平台侧不存储任何派生密钥——验签时按 token 自称的 `sub` 现算。因此服务目录表
 * （`op_sys_service_registry`）里没有任何可用于签发的秘密，那张表泄露不会导致
 * 服务身份沦陷。
 *
 * 这里不提供公开签发接口：一旦存在"能换取任意服务身份"的端点，密钥派生带来的
 * 隔离就被那个端点绕过去了。服务启动时由 server-sdk 用自己的派生密钥自签。
 */
@Injectable()
export class ServiceTokenService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
    ) {}

    issue(serviceKey: string): string {
        if (!SERVICE_KEY_RE.test(serviceKey)) {
            throw new BadRequestException("service key 需为小写 slug(≤50字)");
        }

        const options: JwtSignOptions = {
            secret: this.deriveSecret(serviceKey),
            expiresIn: this.config.get<string | number>("SERVICE_TOKEN_EXPIRES_IN", DEFAULT_SERVICE_TOKEN_EXPIRES_IN),
        };
        return this.jwtService.sign({ sub: serviceKey, type: SERVICE_TOKEN_TYPE }, options);
    }

    /**
     * 先解出 `sub` 再用该服务的派生密钥验签。
     * 不验签地读 `sub` 是安全的：它只用来决定"拿谁的密钥来验"，签名校验随后照做。
     * 篡改 `sub` 的后果是验签用的密钥跟着换成被冒充者的，攻击者手里的密钥对不上。
     */
    verify(token: string): ServiceTokenPayload | null {
        if (!token) return null;
        const raw = token.replace(/^Bearer\s+/i, "");

        const claimed = this.jwtService.decode(raw) as { sub?: unknown } | null;
        const serviceKey = String(claimed?.sub ?? "");
        if (!SERVICE_KEY_RE.test(serviceKey)) return null;

        try {
            const payload = this.jwtService.verify<ServiceTokenPayload>(raw, {
                secret: this.deriveSecret(serviceKey),
            });
            if (payload?.type !== SERVICE_TOKEN_TYPE || payload.sub !== serviceKey) {
                return null;
            }
            return payload;
        } catch {
            return null;
        }
    }

    /** HKDF-SHA256(主密钥, salt, info=serviceKey) → hex。与 server-sdk 的实现必须一致 */
    private deriveSecret(serviceKey: string): string {
        const derived = hkdfSync(
            "sha256",
            Buffer.from(this.masterSecret(), "utf8"),
            Buffer.from(SERVICE_KEY_HKDF_SALT, "utf8"),
            Buffer.from(serviceKey, "utf8"),
            SERVICE_KEY_HKDF_LENGTH,
        );
        return Buffer.from(derived).toString("hex");
    }

    private masterSecret(): string {
        const secret = this.config.get<string>("SERVICE_TOKEN_SECRET") || process.env.SERVICE_TOKEN_SECRET;
        if (!secret) {
            throw new Error("SERVICE_TOKEN_SECRET 未配置，服务身份令牌不可用");
        }
        return secret;
    }
}

export interface ServiceTokenPayload {
    sub: string;
    type: typeof SERVICE_TOKEN_TYPE;
    iat?: number;
    exp?: number;
}

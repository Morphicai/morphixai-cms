import { BadRequestException, Injectable } from "@nestjs/common";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

export const SERVICE_TOKEN_TYPE = "service" as const;
export const DEFAULT_SERVICE_TOKEN_EXPIRES_IN = "5m";

export interface ServiceTokenPayload {
    sub: string;
    type: typeof SERVICE_TOKEN_TYPE;
    iat?: number;
    exp?: number;
}

const SERVICE_KEY_RE = /^[a-z][a-z0-9-]{0,49}$/;

/**
 * 服务身份 JWT 的平台侧工具。
 *
 * 这里不提供公开签发接口。服务启动时由 server-sdk 使用同一份环境变量自签，
 * 平台只负责用同样的密钥验签并结合服务目录确认身份仍然有效。保留这个工具类
 * 是为了让 optimus-api 内部需要代表某个已登记服务生成测试/运维令牌时，
 * 不再自己拼 payload；密钥永远不进数据库和仓库。
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
            secret: this.secret(),
            expiresIn: this.config.get<string | number>("SERVICE_TOKEN_EXPIRES_IN", DEFAULT_SERVICE_TOKEN_EXPIRES_IN),
        };
        return this.jwtService.sign({ sub: serviceKey, type: SERVICE_TOKEN_TYPE }, options);
    }

    verify(token: string): ServiceTokenPayload | null {
        if (!token) return null;
        try {
            const payload = this.jwtService.verify<ServiceTokenPayload>(token.replace(/^Bearer\s+/i, ""), {
                secret: this.secret(),
            });
            if (payload?.type !== SERVICE_TOKEN_TYPE || !SERVICE_KEY_RE.test(String(payload.sub ?? ""))) {
                return null;
            }
            return payload;
        } catch {
            return null;
        }
    }

    private secret(): string {
        const secret = this.config.get<string>("SERVICE_TOKEN_SECRET") || process.env.SERVICE_TOKEN_SECRET;
        if (!secret) {
            throw new Error("SERVICE_TOKEN_SECRET 未配置，服务身份令牌不可用");
        }
        return secret;
    }
}

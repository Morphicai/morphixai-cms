import { Body, Controller, HttpException, HttpStatus, Post, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AnonymousAuth } from "../../shared/decorators/auth-mode.decorator";
import { ResultData } from "../../shared/utils/result";
import { AuthService } from "./auth.service";
import { UserService } from "../user/user.service";
import { ClientUserService } from "../../business/client-user/client-user.service";
import { ServiceRegistryService } from "../service-ops/service-registry.service";
import { DEFAULT_TRUST_LEVEL } from "../service-ops/service-trust.constants";
import { ServiceTokenService } from "./service-token.service";

/**
 * Token 自省（RFC 7662 的极简子集）。
 * 给"别的团队自己的后端"用：他们拿到用户请求里的 token,想知道这是谁、有什么权限,
 * 又不能把 JWT 密钥发出去——密钥出了边界就等于交出签发权。所以密钥留在这,
 * 翻译服务开在这。
 *
 * 匿名可调是想清楚的:token 本身就是秘密,能递 token 进来的人本来就能直接冒充
 * 该用户调业务接口,introspect 不放大任何权限。service token 仍然只返回已登记
 * 服务的最小身份,不返回平台内部配置。防滥用靠 IP 限频。
 */
const INTROSPECT_LIMIT_PER_MINUTE = 60;
const buckets = new Map<string, { windowStart: number; count: number }>();
function checkRate(ip: string): boolean {
    const now = Date.now();
    const b = buckets.get(ip);
    if (!b || now - b.windowStart >= 60000) {
        buckets.set(ip, { windowStart: now, count: 1 });
        return true;
    }
    b.count += 1;
    return b.count <= INTROSPECT_LIMIT_PER_MINUTE;
}

@ApiTags("认证")
@AnonymousAuth()
@Controller("auth")
export class AuthIntrospectController {
    constructor(
        private readonly authService: AuthService,
        private readonly userService: UserService,
        private readonly clientUserService: ClientUserService,
        private readonly serviceTokenService: ServiceTokenService,
        private readonly serviceRegistry: ServiceRegistryService,
    ) {}

    @Post("introspect")
    @ApiOperation({ summary: "Token 自省：验证 token 并返回用户与权限" })
    async introspect(
        @Body() body: { token?: string; type?: string },
        @Req() req: Request,
    ): Promise<ResultData> {
        const ip = req.ip || "unknown";
        if (!checkRate(ip)) {
            throw new HttpException("操作太频繁，请稍后再试", HttpStatus.TOO_MANY_REQUESTS);
        }

        const token = String(body?.token ?? "").trim();
        const type = body?.type === "service" ? "service" : body?.type === "client" ? "client" : "admin";
        // 无效 token 一律 { active: false },HTTP 200。不区分过期/篡改/格式错——
        // 那些区分只对探测者有用,对合法调用方没用
        const inactive = ResultData.ok({ active: false });
        if (!token || token.length > 2048) return inactive;

        if (type === "service") {
            const payload = this.serviceTokenService.verify(token);
            if (!payload) return inactive;
            const service = await this.serviceRegistry.getByKey(payload.sub);
            if (!service || service.enabled === false) return inactive;
            // grants 每次自省都从目录现读,不写进 token:调整授权后立即生效,
            // 不必等旧 token 过期,也不需要服务重启
            return ResultData.ok({
                active: true,
                type: "service",
                service: {
                    key: service.key,
                    name: service.name,
                    trustLevel: service.trustLevel ?? DEFAULT_TRUST_LEVEL,
                    grants: Array.isArray(service.grants) ? service.grants : [],
                },
            });
        }

        if (type === "client") {
            const user = await this.clientUserService.verifyToken(token);
            if (!user) return inactive;
            return ResultData.ok({
                active: true,
                type: "client",
                user: {
                    id: user.userId,
                    username: user.username,
                    nickname: user.nickname,
                    email: user.email,
                },
            });
        }

        // admin 分支。verifyToken 名不副实:它返回的是整个 jwt payload,不是 id
        const payload = this.userService.verifyToken(token) as unknown as { id?: string } | null;
        if (!payload?.id) return inactive;
        try {
            const user = await this.authService.validateUser({ id: String(payload.id) });
            if (!user) return inactive;
            return ResultData.ok({
                active: true,
                type: "admin",
                user: {
                    id: user.id,
                    account: user.account,
                    fullName: user.fullName,
                    email: user.email,
                    type: user.type,
                },
                perms: Array.isArray(user.perms) ? user.perms : [],
            });
        } catch {
            // 用户已删/已禁,对外同样只是 inactive
            return inactive;
        }
    }
}

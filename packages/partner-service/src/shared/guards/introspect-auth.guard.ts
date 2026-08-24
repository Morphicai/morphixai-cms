import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import {
    ALLOW_ANONYMOUS_KEY,
    ALLOW_NO_PERM_KEY,
    CLIENT_USER_AUTH_KEY,
    PERM_CODE_KEY,
    SUPER_ADMIN_KEY,
} from "../decorators/auth.decorators";

// 与 optimus-api 的 UserType.SUPER_ADMIN 取值对齐(introspect 透传的就是这个数字)
const SUPER_ADMIN_TYPE = 0;

interface IntrospectResult {
    active: boolean;
    user?: { id?: string; username?: string; nickname?: string; email?: string; account?: string; fullName?: string; type?: number };
    perms?: string[];
}

/**
 * partner-service 的全局鉴权守卫。UnifiedAuthGuard 依赖 optimus-api 本地的
 * UserService/AuthService/ClientUserService(直接查库拿 JWT payload、查 perms)——
 * 这些依赖搬不出来,搬了等于把整个用户体系也复制一份,数据双写风险巨大。
 * 这里换成一次 HTTP 调用:token 换身份的活交给 optimus-api 的 /auth/introspect,
 * fail-closed 的判定逻辑(没声明权限语义就拒绝)在本地复刻,和主服务保持同一套心智模型。
 */
@Injectable()
export class IntrospectAuthGuard implements CanActivate {
    private readonly logger = new Logger(IntrospectAuthGuard.name);
    private readonly apiBase: string;

    constructor(private readonly reflector: Reflector, private readonly configService: ConfigService) {
        this.apiBase = (this.configService.get<string>("OPTIMUS_API_URL") || "http://localhost:8084/api").replace(/\/$/, "");
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();

        if (this.reflector.getAllAndOverride<boolean>(ALLOW_ANONYMOUS_KEY, [context.getHandler(), context.getClass()])) {
            return true;
        }

        const isClientMode = this.reflector.getAllAndOverride<boolean>(CLIENT_USER_AUTH_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        return isClientMode ? this.handleClientMode(request) : this.handleAdminMode(request, context);
    }

    private extractBearerToken(request: Request): string | null {
        const authorization = request.headers.authorization;
        if (authorization && authorization.startsWith("Bearer ")) {
            return authorization.substring(7);
        }
        return null;
    }

    private async introspect(token: string, type: "admin" | "client"): Promise<IntrospectResult> {
        try {
            const res = await fetch(`${this.apiBase}/auth/introspect`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, type }),
                signal: AbortSignal.timeout(5000),
            });
            const json: any = await res.json();
            return json?.data ?? { active: false };
        } catch (error) {
            // 主服务不可达时按未认证处理,不能让鉴权失败悄悄放行
            this.logger.warn(`introspect 调用失败: ${(error as Error).message}`);
            return { active: false };
        }
    }

    private async handleClientMode(request: Request): Promise<boolean> {
        const token = this.extractBearerToken(request) || (request as any).cookies?.clientAccessToken;
        if (!token) {
            throw new UnauthorizedException("Client user token not found");
        }
        const result = await this.introspect(token, "client");
        if (!result.active) {
            throw new UnauthorizedException("Invalid client user token");
        }
        // 字段名对齐 optimus-api 的 req.clientUser.userId,搬过来的控制器代码不用改
        (request as any).clientUser = {
            userId: result.user?.id,
            username: result.user?.username,
            user: result.user,
        };
        return true;
    }

    private async handleAdminMode(request: Request, context: ExecutionContext): Promise<boolean> {
        const token = this.extractBearerToken(request);
        if (!token) {
            throw new UnauthorizedException("Missing or invalid authorization header");
        }
        const result = await this.introspect(token, "admin");
        if (!result.active) {
            throw new UnauthorizedException("Invalid or expired token");
        }
        const user = { ...result.user, perms: Array.isArray(result.perms) ? result.perms : [] };
        (request as any).user = user;

        const requireSuperAdmin = this.reflector.getAllAndOverride<boolean>(SUPER_ADMIN_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        const isSuperAdmin = user.type === SUPER_ADMIN_TYPE;

        if (requireSuperAdmin && !isSuperAdmin) {
            throw new ForbiddenException("Super admin access required");
        }
        if (isSuperAdmin) {
            return true;
        }

        const allowNoPerm = this.reflector.getAllAndOverride<boolean>(ALLOW_NO_PERM_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (allowNoPerm) {
            return true;
        }

        // fail-closed:和主服务 2026-08-24 收紧的语义一致——没声明权限码的接口一律拒绝,
        // 不能让"忘记声明"的后果是放行
        const requiredPerm = this.reflector.getAllAndOverride<string>(PERM_CODE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredPerm) {
            this.logger.warn(`接口未声明权限语义(缺 @Perm/@AllowNoPerm/@RequireSuperAdmin): route=${request.method} ${request.url}`);
            throw new ForbiddenException("接口未声明权限语义，拒绝访问");
        }
        if (!user.perms.includes(requiredPerm)) {
            this.logger.warn(`权限拒绝: route=${request.method} ${request.url} 需要=${requiredPerm}`);
            throw new ForbiddenException("无权访问该接口");
        }
        return true;
    }
}

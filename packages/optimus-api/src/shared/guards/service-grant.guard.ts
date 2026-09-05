import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { REQUIRED_GRANT_KEY } from "../decorators/require-grant.decorator";
import { ServiceRegistryService } from "../../system/service-ops/service-registry.service";
import { ServiceTokenService } from "../../system/auth/service-token.service";

/**
 * 服务能力授权守卫。只管挂了 @RequireGrant 的接口,其余一律放行给别的守卫处理。
 *
 * 校验发生在**被调用方**,不在网关:绕过网关的直连调用(embed 服务浏览器直连、
 * 服务间内网直调)同样要过这一关,否则就出现授权真空。
 *
 * grants 每次都从服务目录现读,不信 token 里可能夹带的任何授权声明——
 * token 只证明"我是谁",能做什么由平台侧的目录说了算。这样调整授权后立即生效,
 * 不必等旧 token 过期。
 */
@Injectable()
export class ServiceGrantGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly serviceTokenService: ServiceTokenService,
        private readonly serviceRegistry: ServiceRegistryService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredGrant = this.reflector.getAllAndOverride<string>(REQUIRED_GRANT_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredGrant) return true;

        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractToken(request);
        if (!token) {
            throw new ForbiddenException("此接口需要服务身份调用");
        }

        const payload = this.serviceTokenService.verify(token);
        if (!payload) {
            throw new ForbiddenException("服务身份无效");
        }

        const service = await this.serviceRegistry.getByKey(payload.sub);
        if (!service || service.enabled === false) {
            throw new ForbiddenException("服务未登记或已下线");
        }

        const grants = Array.isArray(service.grants) ? service.grants : [];
        if (!grants.includes(requiredGrant)) {
            // 不回显该服务实际持有哪些 grant——那是在给探测者画地图
            throw new ForbiddenException(`服务未被授予能力：${requiredGrant}`);
        }

        (request as Request & { service?: unknown }).service = {
            key: service.key,
            name: service.name,
            trustLevel: service.trustLevel,
            grants,
        };
        return true;
    }

    private extractToken(request: Request): string | null {
        const authorization = request.headers.authorization;
        if (!authorization) return null;
        const [scheme, value] = authorization.split(" ");
        if (!value || scheme.toLowerCase() !== "bearer") return null;
        return value.trim() || null;
    }
}

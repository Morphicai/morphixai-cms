import { ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ServiceGrantGuard } from "../service-grant.guard";

const mkContext = (authorization?: string) => {
    const request: any = { headers: authorization ? { authorization } : {} };
    return {
        request,
        ctx: {
            switchToHttp: () => ({ getRequest: () => request }),
            getHandler: () => () => undefined,
            getClass: () => class {},
        } as any,
    };
};

const mkGuard = (opts: {
    requiredGrant?: string;
    verify?: jest.Mock;
    getByKey?: jest.Mock;
}) => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(opts.requiredGrant) } as unknown as Reflector;
    const tokenService = { verify: opts.verify ?? jest.fn() } as any;
    const registry = { getByKey: opts.getByKey ?? jest.fn() } as any;
    return new ServiceGrantGuard(reflector, tokenService, registry);
};

const validToken = jest.fn().mockReturnValue({ sub: "partner-service", type: "service" });

describe("ServiceGrantGuard", () => {
    it("未声明 @RequireGrant 的接口直接放行", async () => {
        const { ctx } = mkContext();
        await expect(mkGuard({ requiredGrant: undefined }).canActivate(ctx)).resolves.toBe(true);
    });

    it("持有该 grant 时放行，并把服务身份挂到 request 上", async () => {
        const { ctx, request } = mkContext("Bearer st");
        const guard = mkGuard({
            requiredGrant: "points:grant",
            verify: validToken,
            getByKey: jest.fn().mockResolvedValue({
                key: "partner-service",
                name: "合伙人服务",
                enabled: true,
                trustLevel: "first-party",
                grants: ["points:grant", "oss:upload"],
            }),
        });

        await expect(guard.canActivate(ctx)).resolves.toBe(true);
        expect(request.service).toMatchObject({ key: "partner-service", trustLevel: "first-party" });
    });

    it("未被授予该 grant 时拒绝", async () => {
        const { ctx } = mkContext("Bearer st");
        const guard = mkGuard({
            requiredGrant: "user-profile:read-full",
            verify: validToken,
            getByKey: jest.fn().mockResolvedValue({
                key: "partner-service",
                name: "合伙人服务",
                enabled: true,
                grants: ["points:grant"],
            }),
        });

        await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });

    it("三方服务默认空 grants：什么都调不了", async () => {
        const { ctx } = mkContext("Bearer st");
        const guard = mkGuard({
            requiredGrant: "points:grant",
            verify: jest.fn().mockReturnValue({ sub: "vendor-service", type: "service" }),
            getByKey: jest.fn().mockResolvedValue({
                key: "vendor-service",
                name: "外包服务",
                enabled: true,
                trustLevel: "third-party",
                grants: [],
            }),
        });

        await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });

    it("拒绝信息不回显该服务实际持有哪些 grant", async () => {
        const { ctx } = mkContext("Bearer st");
        const guard = mkGuard({
            requiredGrant: "user-profile:read-full",
            verify: validToken,
            getByKey: jest.fn().mockResolvedValue({
                key: "partner-service",
                name: "合伙人服务",
                enabled: true,
                grants: ["points:grant", "oss:upload"],
            }),
        });

        await expect(guard.canActivate(ctx)).rejects.toThrow(/user-profile:read-full/);
        await expect(guard.canActivate(ctx)).rejects.not.toThrow(/oss:upload/);
    });

    it("服务已下线时拒绝，即使 token 本身有效", async () => {
        const { ctx } = mkContext("Bearer st");
        const guard = mkGuard({
            requiredGrant: "points:grant",
            verify: validToken,
            getByKey: jest.fn().mockResolvedValue({
                key: "partner-service",
                name: "合伙人服务",
                enabled: false,
                grants: ["points:grant"],
            }),
        });

        await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });

    it("未登记的服务拒绝", async () => {
        const { ctx } = mkContext("Bearer st");
        const guard = mkGuard({
            requiredGrant: "points:grant",
            verify: validToken,
            getByKey: jest.fn().mockResolvedValue(null),
        });

        await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });

    it("无 token、非 Bearer、token 无效都拒绝", async () => {
        const noToken = mkContext();
        await expect(
            mkGuard({ requiredGrant: "points:grant" }).canActivate(noToken.ctx),
        ).rejects.toThrow(ForbiddenException);

        const wrongScheme = mkContext("Basic st");
        await expect(
            mkGuard({ requiredGrant: "points:grant" }).canActivate(wrongScheme.ctx),
        ).rejects.toThrow(ForbiddenException);

        const badToken = mkContext("Bearer st");
        await expect(
            mkGuard({ requiredGrant: "points:grant", verify: jest.fn().mockReturnValue(null) }).canActivate(badToken.ctx),
        ).rejects.toThrow(ForbiddenException);
    });

    it("用户 token 不能替服务提权：它过不了 service token 验签这一关", async () => {
        // grants 是服务的授权,与用户权限码体系独立。转发一个超管 token 到这里,
        // verify 认不出它是 service token,直接拒绝——不会因为"这个人权限很大"而放行
        const { ctx } = mkContext("Bearer admin-token-of-a-super-admin");
        const guard = mkGuard({
            requiredGrant: "points:grant",
            verify: jest.fn().mockReturnValue(null),
            getByKey: jest.fn(),
        });

        await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });
});

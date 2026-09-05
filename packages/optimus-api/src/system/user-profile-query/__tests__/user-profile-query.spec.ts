import { ForbiddenException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthMode } from "../../../shared/enums/auth-mode.enum";
import { REQUIRED_GRANT_KEY } from "../../../shared/decorators/require-grant.decorator";
import { AUTH_MODE_KEY } from "../../../shared/decorators/auth-mode.decorator";
import { UnifiedAuthGuard } from "../../../shared/guards/unified-auth.guard";
import { PUBLIC_PROFILE_FIELDS } from "../../../business/client-user/client-user.service";
import { UserProfileQueryController } from "../user-profile-query.controller";

/** entity 上确实存在但**不该**跨服务外泄的字段 */
const FORBIDDEN_FIELDS = [
    "passwordHash",
    "phone",
    "registerIp",
    "lastLoginIp",
    "lastLoginAt",
    "registerSource",
    "extraData",
    "updatedAt",
];

describe("跨服务用户资料查询 · 字段白名单", () => {
    it("basic 只含用户名/昵称/头像与 uid", () => {
        expect([...PUBLIC_PROFILE_FIELDS.basic]).toEqual(["userId", "username", "nickname", "avatar"]);
    });

    it("full 在 basic 之上只多出邮箱、状态、注册时间", () => {
        const extra = PUBLIC_PROFILE_FIELDS.full.filter((f) => !PUBLIC_PROFILE_FIELDS.basic.includes(f));
        expect(extra).toEqual(["email", "status", "createdAt"]);
    });

    it("basic 是 full 的真子集——不能出现只在 basic 里的字段", () => {
        for (const field of PUBLIC_PROFILE_FIELDS.basic) {
            expect(PUBLIC_PROFILE_FIELDS.full).toContain(field);
        }
    });

    // 这条是白名单的意义所在：entity 新增敏感字段时，这里会立刻红
    it.each(FORBIDDEN_FIELDS)("两档都不含敏感字段 %s", (field) => {
        expect(PUBLIC_PROFILE_FIELDS.basic).not.toContain(field);
        expect(PUBLIC_PROFILE_FIELDS.full).not.toContain(field);
    });

    it("phone 两档都不给——它是登录标识与短信落点，敏感度高于邮箱", () => {
        expect(PUBLIC_PROFILE_FIELDS.full).not.toContain("phone");
    });
});

describe("跨服务用户资料查询 · controller", () => {
    const mkController = (profile: unknown) =>
        new UserProfileQueryController({
            findPublicProfileById: jest.fn().mockResolvedValue(profile),
        } as any);

    it("查到用户时按档位返回资料", async () => {
        const data = { userId: "42", username: "u", nickname: "n", avatar: null };
        const res = await mkController(data).getBasic("42");
        expect(res.code).toBe(200);
        expect(res.data).toEqual(data);
    });

    it("full 路由走 full 档位", async () => {
        const service = { findPublicProfileById: jest.fn().mockResolvedValue({ userId: "42" }) };
        await new UserProfileQueryController(service as any).getFull("42");
        expect(service.findPublicProfileById).toHaveBeenCalledWith("42", "full");
    });

    it("basic 路由走 basic 档位", async () => {
        const service = { findPublicProfileById: jest.fn().mockResolvedValue({ userId: "42" }) };
        await new UserProfileQueryController(service as any).getBasic("42");
        expect(service.findPublicProfileById).toHaveBeenCalledWith("42", "basic");
    });

    // 返回 {} 会被调用方当成"查到了但资料是空的",然后渲染出空昵称
    it("用户不存在抛 404，而不是返回空对象", async () => {
        await expect(mkController(null).getBasic("nope")).rejects.toThrow(NotFoundException);
    });
});

describe("UnifiedAuthGuard · SERVICE 模式", () => {
    const mkGuard = (opts: {
        authMode?: AuthMode;
        requiredGrant?: string;
        verify?: jest.Mock;
    }) => {
        const reflector = {
            getAllAndOverride: jest.fn((key: string) => {
                if (key === AUTH_MODE_KEY) return opts.authMode;
                if (key === REQUIRED_GRANT_KEY) return opts.requiredGrant;
                return undefined;
            }),
        } as unknown as Reflector;
        const serviceTokenService = { verify: opts.verify ?? jest.fn() } as any;
        return new UnifiedAuthGuard(
            reflector,
            {} as any,
            {} as any,
            {} as any,
            {} as any,
            {} as any,
            {} as any,
            serviceTokenService,
        );
    };

    const mkContext = (authorization?: string) => {
        const request: any = {
            headers: authorization ? { authorization } : {},
            method: "GET",
            originalUrl: "/api/service/user-profile/basic/42",
        };
        return {
            request,
            ctx: {
                switchToHttp: () => ({ getRequest: () => request }),
                getHandler: () => () => undefined,
                getClass: () => class {},
            } as any,
        };
    };

    it("有效 service token 放行，并把服务身份挂到 request 上", async () => {
        const { ctx, request } = mkContext("Bearer st");
        const guard = mkGuard({
            authMode: AuthMode.SERVICE,
            requiredGrant: "user-profile:read-basic",
            verify: jest.fn().mockReturnValue({ sub: "partner-service", type: "service" }),
        });
        await expect(guard.canActivate(ctx)).resolves.toBe(true);
        expect(request.serviceIdentity).toEqual({ key: "partner-service" });
    });

    it("未携带 token 报 401（问题是'你是谁'没答上来，不是'你不能做'）", async () => {
        const { ctx } = mkContext();
        const guard = mkGuard({ authMode: AuthMode.SERVICE, requiredGrant: "user-profile:read-basic" });
        await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    it("用户 token 验不过 service token 校验，报 401", async () => {
        const { ctx } = mkContext("Bearer a-valid-admin-jwt");
        const guard = mkGuard({
            authMode: AuthMode.SERVICE,
            requiredGrant: "user-profile:read-basic",
            // ServiceTokenService.verify 对非 service token 返回 null
            verify: jest.fn().mockReturnValue(null),
        });
        await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    // 只挂 @ServiceAuth() 等于"任何登记过的服务都能调",而漏挂从外部看不出来
    it("服务接口漏挂 @RequireGrant 时拒绝，且在验 token 之前就拒", async () => {
        const { ctx } = mkContext("Bearer st");
        const verify = jest.fn().mockReturnValue({ sub: "partner-service", type: "service" });
        const guard = mkGuard({ authMode: AuthMode.SERVICE, requiredGrant: undefined, verify });
        await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
        expect(verify).not.toHaveBeenCalled();
    });

    it("SERVICE 模式不会走管理员那条链——不需要 userService/authService", async () => {
        const { ctx } = mkContext("Bearer st");
        const guard = mkGuard({
            authMode: AuthMode.SERVICE,
            requiredGrant: "user-profile:read-full",
            verify: jest.fn().mockReturnValue({ sub: "s", type: "service" }),
        });
        // 上面构造 guard 时 userService/authService 传的是空对象，
        // 若走了 admin 链会因调用 undefined 方法而抛 TypeError
        await expect(guard.canActivate(ctx)).resolves.toBe(true);
    });
});

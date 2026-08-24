/**
 * IntrospectAuthGuard 单测:钉住 spec.md 里"管理端接口经 introspect 鉴权,fail-closed"
 * 和"C 端接口经 introspect 鉴权"这两条 Requirement 下的四个场景。
 * fetch 直接 mock 掉,不打真实网络请求。
 */
import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { IntrospectAuthGuard } from "../introspect-auth.guard";
import { ALLOW_NO_PERM_KEY, PERM_CODE_KEY, SUPER_ADMIN_KEY, CLIENT_USER_AUTH_KEY, ALLOW_ANONYMOUS_KEY } from "../../decorators/auth.decorators";

function mkReflector(meta: Record<string, any> = {}) {
    return { getAllAndOverride: jest.fn((key: string) => meta[key]) } as any;
}

function mkConfig() {
    return { get: jest.fn().mockReturnValue("http://localhost:8084/api") } as any;
}

function mkContext(req: any) {
    return {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({ getRequest: () => req }),
    } as any;
}

function mockFetchOnce(json: any) {
    (global as any).fetch = jest.fn().mockResolvedValue({ json: async () => json });
}

describe("IntrospectAuthGuard 管理端(admin)模式", () => {
    it("有效超管 token 放行任意声明接口(即使 perms 不含所需权限码)", async () => {
        mockFetchOnce({ code: 200, data: { active: true, type: "admin", user: { id: "1", type: 0 }, perms: [] } });
        const guard = new IntrospectAuthGuard(mkReflector({ [PERM_CODE_KEY]: "SomePerm" }), mkConfig());
        const req: any = { headers: { authorization: "Bearer t" } };
        await expect(guard.canActivate(mkContext(req))).resolves.toBe(true);
        expect(req.user.type).toBe(0);
    });

    it("无权限码账号被拒绝(perms 不含所需权限码,普通管理员)", async () => {
        mockFetchOnce({ code: 200, data: { active: true, type: "admin", user: { id: "2", type: 1 }, perms: ["OtherPerm"] } });
        const guard = new IntrospectAuthGuard(mkReflector({ [PERM_CODE_KEY]: "NeedPerm" }), mkConfig());
        const req: any = { headers: { authorization: "Bearer t" } };
        await expect(guard.canActivate(mkContext(req))).rejects.toThrow(ForbiddenException);
    });

    it("未声明权限语义的接口默认拒绝(fail-closed)", async () => {
        mockFetchOnce({ code: 200, data: { active: true, type: "admin", user: { id: "2", type: 1 }, perms: ["AnyPerm"] } });
        // 没有任何 PERM_CODE_KEY/ALLOW_NO_PERM_KEY/SUPER_ADMIN_KEY 元数据
        const guard = new IntrospectAuthGuard(mkReflector({}), mkConfig());
        const req: any = { headers: { authorization: "Bearer t" } };
        await expect(guard.canActivate(mkContext(req))).rejects.toThrow(ForbiddenException);
    });

    it("@AllowNoPerm 放行,不比对权限码", async () => {
        mockFetchOnce({ code: 200, data: { active: true, type: "admin", user: { id: "2", type: 1 }, perms: [] } });
        const guard = new IntrospectAuthGuard(mkReflector({ [ALLOW_NO_PERM_KEY]: true }), mkConfig());
        const req: any = { headers: { authorization: "Bearer t" } };
        await expect(guard.canActivate(mkContext(req))).resolves.toBe(true);
    });

    it("@RequireSuperAdmin 时非超管即使有权限码也被拒绝", async () => {
        mockFetchOnce({ code: 200, data: { active: true, type: "admin", user: { id: "2", type: 1 }, perms: ["NeedPerm"] } });
        const guard = new IntrospectAuthGuard(mkReflector({ [SUPER_ADMIN_KEY]: true, [PERM_CODE_KEY]: "NeedPerm" }), mkConfig());
        const req: any = { headers: { authorization: "Bearer t" } };
        await expect(guard.canActivate(mkContext(req))).rejects.toThrow(ForbiddenException);
    });

    it("token 缺失直接 401", async () => {
        const guard = new IntrospectAuthGuard(mkReflector({ [PERM_CODE_KEY]: "P" }), mkConfig());
        const req: any = { headers: {} };
        await expect(guard.canActivate(mkContext(req))).rejects.toThrow(UnauthorizedException);
    });

    it("introspect 返回 active:false 时 401", async () => {
        mockFetchOnce({ code: 200, data: { active: false } });
        const guard = new IntrospectAuthGuard(mkReflector({ [PERM_CODE_KEY]: "P" }), mkConfig());
        const req: any = { headers: { authorization: "Bearer bad" } };
        await expect(guard.canActivate(mkContext(req))).rejects.toThrow(UnauthorizedException);
    });

    it("introspect 网络调用失败时按未认证处理,不悄悄放行", async () => {
        (global as any).fetch = jest.fn().mockRejectedValue(new Error("network down"));
        const guard = new IntrospectAuthGuard(mkReflector({ [PERM_CODE_KEY]: "P" }), mkConfig());
        const req: any = { headers: { authorization: "Bearer t" } };
        await expect(guard.canActivate(mkContext(req))).rejects.toThrow(UnauthorizedException);
    });
});

describe("IntrospectAuthGuard C 端(client)模式", () => {
    it("合伙人查询自己的积分:有效 clientAccessToken 放行,设置 req.clientUser", async () => {
        mockFetchOnce({ code: 200, data: { active: true, type: "client", user: { id: "8", username: "u1" } } });
        const guard = new IntrospectAuthGuard(mkReflector({ [CLIENT_USER_AUTH_KEY]: true }), mkConfig());
        const req: any = { headers: {}, cookies: { clientAccessToken: "ct" } };
        await expect(guard.canActivate(mkContext(req))).resolves.toBe(true);
        expect(req.clientUser.userId).toBe("8");
    });

    it("未登录访问被拒绝:无 token 401", async () => {
        const guard = new IntrospectAuthGuard(mkReflector({ [CLIENT_USER_AUTH_KEY]: true }), mkConfig());
        const req: any = { headers: {}, cookies: {} };
        await expect(guard.canActivate(mkContext(req))).rejects.toThrow(UnauthorizedException);
    });

    it("未登录访问被拒绝:token 未通过 introspect 校验", async () => {
        mockFetchOnce({ code: 200, data: { active: false } });
        const guard = new IntrospectAuthGuard(mkReflector({ [CLIENT_USER_AUTH_KEY]: true }), mkConfig());
        const req: any = { headers: {}, cookies: { clientAccessToken: "bad" } };
        await expect(guard.canActivate(mkContext(req))).rejects.toThrow(UnauthorizedException);
    });
});

describe("IntrospectAuthGuard @AllowAnonymous", () => {
    it("完全放行,不调用 introspect", async () => {
        const fetchSpy = jest.fn();
        (global as any).fetch = fetchSpy;
        const guard = new IntrospectAuthGuard(mkReflector({ [ALLOW_ANONYMOUS_KEY]: true }), mkConfig());
        const req: any = { headers: {} };
        await expect(guard.canActivate(mkContext(req))).resolves.toBe(true);
        expect(fetchSpy).not.toHaveBeenCalled();
    });
});

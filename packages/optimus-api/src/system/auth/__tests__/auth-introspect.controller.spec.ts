/**
 * introspect controller 单测:mock 三个依赖服务,钉住对外契约——
 * 无效 token 一律 { active: false } 且不区分原因,有效 token 返回用户与权限。
 */
import { HttpException } from "@nestjs/common";
import { AuthIntrospectController } from "../auth-introspect.controller";

const mkController = (
    overrides: Partial<Record<"verifyToken" | "validateUser" | "verifyClient" | "verifyService" | "getService", any>> = {},
) => {
    const userService = { verifyToken: overrides.verifyToken ?? jest.fn().mockReturnValue(null) } as any;
    const authService = { validateUser: overrides.validateUser ?? jest.fn() } as any;
    const clientUserService = { verifyToken: overrides.verifyClient ?? jest.fn().mockResolvedValue(null) } as any;
    const serviceTokenService = { verify: overrides.verifyService ?? jest.fn().mockReturnValue(null) } as any;
    const serviceRegistry = { getByKey: overrides.getService ?? jest.fn().mockResolvedValue(null) } as any;
    return new AuthIntrospectController(authService, userService, clientUserService, serviceTokenService, serviceRegistry);
};

// 每个用例换一个 IP,避免撞进共享限频桶
let ipSeq = 0;
const mkReq = () => ({ ip: `10.0.0.${++ipSeq}` }) as any;

describe("AuthIntrospectController", () => {
    it("空 token 返回 inactive", async () => {
        const c = mkController();
        const res = await c.introspect({ token: "", type: "admin" }, mkReq());
        expect(res.data).toEqual({ active: false });
    });

    it("超长 token 返回 inactive(不进验证逻辑)", async () => {
        const verifyToken = jest.fn();
        const c = mkController({ verifyToken });
        const res = await c.introspect({ token: "x".repeat(3000), type: "admin" }, mkReq());
        expect(res.data).toEqual({ active: false });
        expect(verifyToken).not.toHaveBeenCalled();
    });

    it("admin token 验签失败返回 inactive", async () => {
        const c = mkController({ verifyToken: jest.fn().mockReturnValue(null) });
        const res = await c.introspect({ token: "bad", type: "admin" }, mkReq());
        expect(res.data).toEqual({ active: false });
    });

    it("admin token 有效返回用户与权限码", async () => {
        const c = mkController({
            verifyToken: jest.fn().mockReturnValue({ id: "1" }),
            validateUser: jest.fn().mockResolvedValue({
                id: "1", account: "admin", fullName: "系统管理员", email: "", type: 0, perms: ["*"],
            }),
        });
        const res = await c.introspect({ token: "good", type: "admin" }, mkReq());
        expect(res.data).toMatchObject({
            active: true,
            type: "admin",
            user: { account: "admin" },
            perms: ["*"],
        });
    });

    it("用户查询抛错(已删/已禁)对外同样只是 inactive", async () => {
        const c = mkController({
            verifyToken: jest.fn().mockReturnValue({ id: "9" }),
            validateUser: jest.fn().mockRejectedValue(new Error("user not found")),
        });
        const res = await c.introspect({ token: "orphan", type: "admin" }, mkReq());
        expect(res.data).toEqual({ active: false });
    });

    it("client token 有效返回 client 用户,无 perms 字段", async () => {
        const c = mkController({
            verifyClient: jest.fn().mockResolvedValue({
                userId: "7", username: "demo_user", nickname: null, email: "demo@example.com",
            }),
        });
        const res = await c.introspect({ token: "ct", type: "client" }, mkReq());
        expect(res.data).toMatchObject({ active: true, type: "client", user: { id: "7" } });
        expect((res.data as any).perms).toBeUndefined();
    });

    it("service token 有效返回服务身份", async () => {
        const c = mkController({
            verifyService: jest.fn().mockReturnValue({ sub: "partner-service", type: "service" }),
            getService: jest.fn().mockResolvedValue({ key: "partner-service", name: "合伙人服务", enabled: true }),
        });
        const res = await c.introspect({ token: "st", type: "service" }, mkReq());
        expect(res.data).toEqual({
            active: true,
            type: "service",
            service: { key: "partner-service", name: "合伙人服务" },
        });
    });

    it("service 对应服务已下线时返回 inactive", async () => {
        const c = mkController({
            verifyService: jest.fn().mockReturnValue({ sub: "partner-service", type: "service" }),
            getService: jest.fn().mockResolvedValue({ key: "partner-service", name: "合伙人服务", enabled: false }),
        });
        const res = await c.introspect({ token: "st", type: "service" }, mkReq());
        expect(res.data).toEqual({ active: false });
    });

    it("过期或篡改的 service token 返回 inactive", async () => {
        const verifyService = jest.fn().mockReturnValue(null);
        const c = mkController({ verifyService });
        const res = await c.introspect({ token: "expired-or-tampered", type: "service" }, mkReq());
        expect(res.data).toEqual({ active: false });
        expect(verifyService).toHaveBeenCalledWith("expired-or-tampered");
    });

    it("未知 type 按 admin 处理", async () => {
        const verifyToken = jest.fn().mockReturnValue(null);
        const c = mkController({ verifyToken });
        await c.introspect({ token: "t", type: "whatever" }, mkReq());
        expect(verifyToken).toHaveBeenCalled();
    });

    it("单 IP 超限被 429 拒绝", async () => {
        const c = mkController();
        const req = { ip: "10.9.9.9" } as any;
        for (let i = 0; i < 60; i++) {
            await c.introspect({ token: "", type: "admin" }, req);
        }
        await expect(c.introspect({ token: "", type: "admin" }, req)).rejects.toThrow(HttpException);
    });
});

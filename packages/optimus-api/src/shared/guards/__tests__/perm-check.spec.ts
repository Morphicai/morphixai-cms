/**
 * 路由级权限码校验的四个核心情形。
 * 只测 validateRolePermissions 这一段逻辑，guard 的其余依赖全部打桩——
 * 这里守的是"打了标的接口真的会拒人"，不是整条认证链。
 */
import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UnifiedAuthGuard } from "../unified-auth.guard";
import { PERM_CODE_KEY } from "../../decorators/perm.decorator";
import { UserType } from "../../enums/user.enum";

describe("UnifiedAuthGuard 路由级权限码校验", () => {
    let guard: UnifiedAuthGuard;
    let reflector: Reflector;

    const makeContext = () =>
        ({
            getHandler: () => ({}),
            getClass: () => ({}),
        } as unknown as ExecutionContext);

    const makeRequest = (user: any) =>
        ({ user, method: "GET", url: "/api/test", route: { path: "/api/test" } } as any);

    beforeEach(() => {
        reflector = new Reflector();
        // 其余依赖在本方法路径上用不到，给空桩即可
        guard = new UnifiedAuthGuard(
            reflector,
            {} as any, {} as any, {} as any, {} as any, {} as any, {} as any,
        );
        // 白名单检查走配置，这里直接短路掉
        jest.spyOn(guard as any, "checkWhitelist").mockResolvedValue(false);
    });

    const run = (user: any, requiredPerm?: string) => {
        jest.spyOn(reflector, "getAllAndOverride").mockImplementation((key: any) => {
            if (key === PERM_CODE_KEY) return requiredPerm;
            return undefined; // ALLOW_NO_PERM / SUPER_ADMIN_KEY 均未设置
        });
        return (guard as any).validateRolePermissions(makeRequest(user), makeContext());
    };

    it("无所需权限码的用户被拒绝(403)", async () => {
        const user = { id: "2", account: "t", type: UserType.ORDINARY_USER, perms: ["Dashboard"] };
        await expect(run(user, "ContentManagement")).rejects.toThrow(ForbiddenException);
    });

    it("持有权限码的用户放行", async () => {
        const user = { id: "2", account: "t", type: UserType.ORDINARY_USER, perms: ["ContentManagement"] };
        await expect(run(user, "ContentManagement")).resolves.toBeUndefined();
    });

    it("超级管理员对任意标注接口放行", async () => {
        const user = { id: "1", account: "a", type: UserType.SUPER_ADMIN, perms: ["*"] };
        await expect(run(user, "ContentManagement")).resolves.toBeUndefined();
    });

    it("未标注 @Perm 的接口维持原行为(放行)", async () => {
        const user = { id: "2", account: "t", type: UserType.ORDINARY_USER, perms: [] };
        await expect(run(user, undefined)).resolves.toBeUndefined();
    });
});

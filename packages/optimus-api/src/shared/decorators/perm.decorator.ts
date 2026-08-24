import { SetMetadata } from "@nestjs/common";

/**
 * 接口 允许 无权限访问
 */
export const ALLOW_NO_PERM = "allowNoPerm";

export const AllowNoPerm = () => SetMetadata(ALLOW_NO_PERM, true);

/**
 * 声明接口所需的权限码（与前端菜单显隐共用同一套 op_sys_role_menu.permission_code）。
 *
 * 用法：@Perm("ContentManagement")，类级和方法级都可以挂，方法级优先。
 * ADMIN 模式接口现在默认拒绝（fail-closed，见 unified-auth.guard.ts）——
 * 没挂 @Perm、也没挂 @AllowNoPerm/@RequireSuperAdmin 的接口一律 403。
 * 新写的管理接口必须显式声明三选一。
 */
export const PERM_CODE_KEY = "permCode";

export const Perm = (code: string) => SetMetadata(PERM_CODE_KEY, code);

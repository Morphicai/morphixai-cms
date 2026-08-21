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
 * 没挂这个装饰器的接口维持原行为（认证后放行）——先让打了标的真实生效，
 * "默认拒绝"的全面收紧放到把长尾接口梳理完之后，一步到位只会把没排查过的
 * 接口全打死。
 */
export const PERM_CODE_KEY = "permCode";

export const Perm = (code: string) => SetMetadata(PERM_CODE_KEY, code);

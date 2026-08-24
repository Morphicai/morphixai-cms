import { SetMetadata } from "@nestjs/common";

/**
 * partner-service 本地鉴权装饰器集合——照抄 optimus-api 对应装饰器的最小语义,
 * 不引入包依赖(两边各自演进,不该被一个共享包锁死)。语义对照:
 *   optimus-api                          partner-service
 *   @AllowAnonymous()                 →  @AllowAnonymous()   全放行,不经 introspect
 *   @ClientUserAuth()                 →  @ClientUserAuth()   走 introspect type=client
 *   (默认 ADMIN 模式) + @Perm(code)   →  @Perm(code)         走 introspect type=admin,校验 perms
 *   (默认 ADMIN 模式) + @AllowNoPerm  →  @AllowNoPerm()      走 introspect type=admin,不比对权限码
 *   @RequireSuperAdmin()              →  @RequireSuperAdmin() 走 introspect type=admin,要求超管
 */

export const ALLOW_ANONYMOUS_KEY = "partner_service:allow_anonymous";
export const CLIENT_USER_AUTH_KEY = "partner_service:client_user_auth";
export const PERM_CODE_KEY = "partner_service:perm_code";
export const ALLOW_NO_PERM_KEY = "partner_service:allow_no_perm";
export const SUPER_ADMIN_KEY = "partner_service:require_super_admin";

/** 完全放行,IntrospectAuthGuard 不做任何身份校验 */
export const AllowAnonymous = () => SetMetadata(ALLOW_ANONYMOUS_KEY, true);

/** C 端接口:走 introspect(type=client),只要求 active:true,不比对权限码 */
export const ClientUserAuth = () => SetMetadata(CLIENT_USER_AUTH_KEY, true);

/** 管理端接口:走 introspect(type=admin),要求 perms 数组包含指定权限码 */
export const Perm = (code: string) => SetMetadata(PERM_CODE_KEY, code);

/** 管理端接口:走 introspect(type=admin),已登录即可,不做权限码比对 */
export const AllowNoPerm = () => SetMetadata(ALLOW_NO_PERM_KEY, true);

/** 管理端接口:走 introspect(type=admin),必须是超级管理员 */
export const RequireSuperAdmin = () => SetMetadata(SUPER_ADMIN_KEY, true);

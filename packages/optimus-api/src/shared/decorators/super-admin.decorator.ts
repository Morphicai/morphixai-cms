import { SetMetadata } from "@nestjs/common";

/**
 * 标记需要超级管理员权限的路由
 */
export const SUPER_ADMIN_KEY = "superAdmin";
export const RequireSuperAdmin = () => SetMetadata(SUPER_ADMIN_KEY, true);

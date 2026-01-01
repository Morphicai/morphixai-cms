import { SetMetadata } from '@nestjs/common';
import { AuthMode } from '../enums/auth-mode.enum';

export const AUTH_MODE_KEY = 'auth_mode';

/**
 * 设置认证模式装饰器
 * @param mode 认证模式
 */
export const UseAuthMode = (mode: AuthMode) => SetMetadata(AUTH_MODE_KEY, mode);

/**
 * 管理员模式 - 需要JWT + 角色 + 细粒度权限（默认模式）
 */
export const AdminAuth = () => UseAuthMode(AuthMode.ADMIN);

/**
 * 客户端用户模式 - 需要签名认证
 */
export const ClientUserAuth = () => UseAuthMode(AuthMode.CLIENT_USER);

/**
 * 匿名模式 - 任何用户可访问
 */
export const AnonymousAuth = () => UseAuthMode(AuthMode.ANONYMOUS);
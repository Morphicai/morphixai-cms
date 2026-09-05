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
 * 客户端用户模式 - clientAccessToken cookie（或同 token 走 Bearer）验 JWT，不是签名认证
 */
export const ClientUserAuth = () => UseAuthMode(AuthMode.CLIENT_USER);

/**
 * 匿名模式 - 任何用户可访问
 */
export const AnonymousAuth = () => UseAuthMode(AuthMode.ANONYMOUS);

/**
 * 服务身份模式 - 只认 service token，用户 token 一律拒绝。
 *
 * 单用它只回答"你是哪个服务"，**不授予任何能力**——必须再挂
 * `@RequireGrant("...")` 并把 `ServiceGrantGuard` 加到该控制器的
 * `@UseGuards` 上，否则就是"任何登记过的服务都能调"。
 */
export const ServiceAuth = () => UseAuthMode(AuthMode.SERVICE);
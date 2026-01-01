/**
 * 认证模式枚举
 */
export enum AuthMode {
  /** 管理员模式 - 需要JWT + 角色 + 细粒度权限 */
  ADMIN = 'admin',
  
  /** 客户端用户模式 - 需要签名认证 */
  CLIENT_USER = 'client_user',
  
  /** 匿名模式 - 任何用户可访问 */
  ANONYMOUS = 'anonymous'
}
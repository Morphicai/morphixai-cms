/**
 * 认证模式枚举
 */
export enum AuthMode {
  /** 管理员模式 - 需要JWT + 角色 + 细粒度权限 */
  ADMIN = 'admin',
  
  /** 客户端用户模式 - clientAccessToken cookie 验 JWT，不是签名认证 */
  CLIENT_USER = 'client_user',
  
  /** 匿名模式 - 任何用户可访问 */
  ANONYMOUS = 'anonymous',

  /**
   * 服务身份模式 - 只认 service token，不接受任何用户 token。
   *
   * 与 ADMIN/CLIENT_USER 是**平行的主体**，不是权限高低：
   * 这类接口的语义是"服务查平台"，混进用户 token 就会退化成
   * "谁拿到一个高权限用户的 token 就能替任意服务发起调用"。
   *
   * 本模式只负责"你是哪个服务"（认不出就 401）。**能做什么由
   * @RequireGrant + ServiceGrantGuard 决定**，两步都要过。
   */
  SERVICE = 'service'
}
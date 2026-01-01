import { TokenService } from './TokenService';

/**
 * HTTP 拦截器
 * 负责请求和响应的拦截处理，包括自动添加 Token 和处理 401 错误
 */
export class HttpInterceptor {
  private static isRefreshing = false;
  private static refreshPromise: Promise<boolean> | null = null;

  /**
   * 请求拦截器 - 自动添加 Token
   */
  static async interceptRequest(config: RequestInit): Promise<RequestInit> {
    // 检查是否需要刷新 token
    if (TokenService.shouldRefreshToken() && !this.isRefreshing) {
      await this.refreshTokenIfNeeded();
    }

    const token = TokenService.getAccessToken();
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    return config;
  }

  /**
   * 响应拦截器 - 处理 401 错误
   */
  static async interceptResponse(
    response: Response, 
    originalRequest: () => Promise<Response>
  ): Promise<Response> {
    if (response.status === 401) {
      // Token 可能过期，尝试刷新
      const refreshed = await this.refreshTokenIfNeeded();
      
      if (refreshed) {
        // 重新发起请求
        return originalRequest();
      } else {
        // 刷新失败，跳转到登录页
        this.handleAuthError();
        return response;
      }
    }

    return response;
  }

  /**
   * 刷新 Token
   */
  private static async refreshTokenIfNeeded(): Promise<boolean> {
    if (this.isRefreshing) {
      // 如果正在刷新，等待刷新完成
      return this.refreshPromise || Promise.resolve(false);
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private static async performTokenRefresh(): Promise<boolean> {
    try {
      const response = await fetch('/api/client-user/refresh', {
        method: 'POST',
        credentials: 'include', // 包含 cookie
      });

      if (response.ok) {
        const data = await response.json();
        if (data.code === 200) {
          // Cookie 已由服务器设置，无需手动处理
          console.log('Token refreshed successfully');
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  private static handleAuthError() {
    TokenService.clearTokens();
    
    // 跳转到登录页
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      // 避免在登录页重复跳转
      if (currentPath !== '/login' && currentPath !== '/register') {
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      }
    }
  }
}

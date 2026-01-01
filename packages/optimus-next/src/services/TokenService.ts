/**
 * Token 管理服务
 * 负责客户端用户 JWT Token 的存储、获取和管理
 */
export class TokenService {
  private static readonly ACCESS_TOKEN_KEY = 'clientAccessToken';
  private static readonly REFRESH_TOKEN_KEY = 'clientRefreshToken';
  
  /**
   * 从 Cookie 获取 Access Token
   */
  static getAccessToken(): string | null {
    if (typeof document === 'undefined') return null;
    return this.getCookie(this.ACCESS_TOKEN_KEY);
  }

  /**
   * 从 Cookie 获取 Refresh Token
   */
  static getRefreshToken(): string | null {
    if (typeof document === 'undefined') return null;
    return this.getCookie(this.REFRESH_TOKEN_KEY);
  }

  /**
   * 设置 Token 到 Cookie（作为备用方案）
   * 主要由服务器端设置，这里提供客户端设置能力
   */
  static setTokens(accessToken: string, refreshToken: string, expiresIn: number) {
    if (typeof document === 'undefined') return;
    
    const accessExpires = new Date(Date.now() + expiresIn * 1000);
    const refreshExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7天

    this.setCookie(this.ACCESS_TOKEN_KEY, accessToken, accessExpires);
    this.setCookie(this.REFRESH_TOKEN_KEY, refreshToken, refreshExpires);
  }

  /**
   * 清除所有 Token
   */
  static clearTokens() {
    if (typeof document === 'undefined') return;
    
    this.deleteCookie(this.ACCESS_TOKEN_KEY);
    this.deleteCookie(this.REFRESH_TOKEN_KEY);
  }

  /**
   * 检查 Token 是否即将过期（提前5分钟刷新）
   */
  static shouldRefreshToken(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresAt = payload.exp * 1000;
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      
      return expiresAt - now < fiveMinutes;
    } catch {
      return true; // 解析失败，需要刷新
    }
  }

  /**
   * 检查是否已登录
   */
  static isLoggedIn(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresAt = payload.exp * 1000;
      const now = Date.now();
      
      return expiresAt > now;
    } catch {
      return false;
    }
  }

  /**
   * 获取当前用户信息（从 Token 中解析）
   */
  static getCurrentUser(): { sub: string; username: string; type: string } | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        sub: payload.sub,
        username: payload.username,
        type: payload.type
      };
    } catch {
      return null;
    }
  }

  private static getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  }

  private static setCookie(name: string, value: string, expires: Date) {
    document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  }

  private static deleteCookie(name: string) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
  }
}
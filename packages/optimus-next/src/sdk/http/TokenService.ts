/**
 * TokenService - Token 管理服务
 * 负责管理客户端 JWT tokens（access token 和 refresh token）
 */

interface TokenData {
  sub: string;
  username: string;
  type: string;
  iat?: number;
  exp?: number;
}

export class TokenService {
  private static readonly ACCESS_TOKEN_KEY = 'clientAccessToken';
  private static readonly REFRESH_TOKEN_KEY = 'clientRefreshToken';
  private static readonly TOKEN_EXPIRY_KEY = 'clientTokenExpiry';

  /**
   * 获取 Access Token
   */
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return this.getCookie(TokenService.ACCESS_TOKEN_KEY);
  }

  /**
   * 获取 Refresh Token
   */
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return this.getCookie(TokenService.REFRESH_TOKEN_KEY);
  }

  /**
   * 设置 tokens
   * @param accessToken Access token
   * @param refreshToken Refresh token
   * @param expiresIn Token 过期时间（秒）
   */
  setTokens(accessToken: string, refreshToken: string, expiresIn: number) {
    if (typeof window === 'undefined') return;

    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + expiresIn);

    // 存储 tokens
    this.setCookie(TokenService.ACCESS_TOKEN_KEY, accessToken, expiryDate);
    this.setCookie(TokenService.REFRESH_TOKEN_KEY, refreshToken, expiryDate);
    this.setCookie(TokenService.TOKEN_EXPIRY_KEY, expiryDate.getTime().toString(), expiryDate);
  }

  /**
   * 清除所有 tokens
   */
  clearTokens() {
    if (typeof window === 'undefined') return;

    this.deleteCookie(TokenService.ACCESS_TOKEN_KEY);
    this.deleteCookie(TokenService.REFRESH_TOKEN_KEY);
    this.deleteCookie(TokenService.TOKEN_EXPIRY_KEY);
  }

  /**
   * 检查是否需要刷新 token
   * 在 token 过期前 5 分钟刷新
   */
  shouldRefreshToken(): boolean {
    if (typeof window === 'undefined') return false;

    const expiryStr = this.getCookie(TokenService.TOKEN_EXPIRY_KEY);
    if (!expiryStr) return false;

    const expiry = parseInt(expiryStr, 10);
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    return expiry - now < fiveMinutes;
  }

  /**
   * 检查用户是否已登录
   */
  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * 解析 JWT token 获取用户信息
   */
  getCurrentUser(): TokenData | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded;
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  /**
   * 获取 Cookie
   */
  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;

    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    
    return null;
  }

  /**
   * 设置 Cookie
   */
  private setCookie(name: string, value: string, expires: Date) {
    if (typeof document === 'undefined') return;

    const secure = window.location.protocol === 'https:';
    const sameSite = 'Lax';

    document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; ${secure ? 'secure;' : ''} SameSite=${sameSite}`;
  }

  /**
   * 删除 Cookie
   */
  private deleteCookie(name: string) {
    if (typeof document === 'undefined') return;

    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
}


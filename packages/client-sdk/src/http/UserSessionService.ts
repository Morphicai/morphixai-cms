/**
 * UserSessionService - 用户会话信息缓存
 *
 * token 住在 httpOnly cookie 里，前端读不到（这是刻意的），所以"当前用户是谁"
 * 不能再从解析 JWT 得来。这里只缓存登录响应里的用户信息用于刷新后的首屏，
 * 真实登录态以 /client-user/me 的应答为准——缓存可以骗 UI 一瞬间，骗不了接口。
 */

export interface ClientUserInfo {
  id?: number;
  userId?: number;
  username: string;
  email?: string;
  nickname?: string;
  avatar?: string;
  createdAt?: string;
  [key: string]: unknown;
}

const USER_INFO_KEY = 'clientUserInfo';

export class UserSessionService {
  /** 缓存用户信息（不含任何 token） */
  setUser(user: ClientUserInfo) {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
    } catch {
      // localStorage 不可用（隐私模式等）时静默降级为无缓存
    }
  }

  /** 读缓存的用户信息；可能过期，仅用于首屏乐观展示 */
  getUser(): ClientUserInfo | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(USER_INFO_KEY);
      return raw ? (JSON.parse(raw) as ClientUserInfo) : null;
    } catch {
      return null;
    }
  }

  clearUser() {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(USER_INFO_KEY);
    } catch {
      // 同上
    }
  }
}

export const userSessionService = new UserSessionService();

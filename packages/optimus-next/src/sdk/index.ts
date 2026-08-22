/**
 * Optimus Client SDK - 主入口
 * 提供所有 SDK 功能的统一访问点
 */

import { BaseHttpService, httpService, userSessionService } from './http';
import type { ClientUserInfo } from './http';
import { StorageService, localStorage, sessionStorage } from './storage';
import { DynamicContentSDK, dynamicContentSDK } from './business/DynamicContentSDK';
import { ArticleSDK, articleSDK } from './business/ArticleSDK';

export class OptimusClientSDK {
  // HTTP 服务
  public readonly http: BaseHttpService;

  // 存储服务
  public readonly localStorage: StorageService;
  public readonly sessionStorage: StorageService;

  // 业务 SDK
  public readonly dynamicContent: DynamicContentSDK;
  public readonly article: ArticleSDK;

  constructor() {
    this.http = httpService;

    this.localStorage = localStorage;
    this.sessionStorage = sessionStorage;

    this.dynamicContent = dynamicContentSDK;
    this.article = articleSDK;
  }

  /**
   * 创建自定义 HTTP 服务
   */
  createHttpService(config?: any) {
    return new BaseHttpService(config);
  }

  /**
   * 创建自定义存储服务
   */
  createStorage(options?: any) {
    return new StorageService(options);
  }

  /**
   * 读缓存的当前用户（乐观值，权威判定用 fetchCurrentUser）
   */
  getCurrentUser(): ClientUserInfo | null {
    return userSessionService.getUser();
  }

  /**
   * 向后台确认登录态并刷新本地缓存。
   * token 在 httpOnly cookie 里前端读不到，所以"是否登录"只能问接口。
   */
  async fetchCurrentUser(): Promise<ClientUserInfo | null> {
    try {
      const response = await this.http.get<{ code: number; data: ClientUserInfo }>(
        '/client-user/me',
        { skipDedup: true }
      );
      if (response?.code === 200 && response.data) {
        userSessionService.setUser(response.data);
        return response.data;
      }
    } catch {
      // 401 且续期失败会走到这里：确实没登录
    }
    userSessionService.clearUser();
    return null;
  }

  /**
   * 登出：后台清 httpOnly cookie，本地清用户缓存
   */
  async logout() {
    try {
      await this.http.post('/client-user/logout');
    } catch {
      // 即使接口失败（如 token 已过期）也继续清本地态
    }
    userSessionService.clearUser();
    if (typeof window !== 'undefined') {
      window.location.href = '/auth';
    }
  }
}

// 导出默认单例实例
export const optimusSDK = new OptimusClientSDK();

// 导出各个模块，支持单独引入
export * from './http';
export * from './storage';
export * from './business';

// 默认导出
export default optimusSDK;

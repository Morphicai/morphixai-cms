/**
 * Optimus Client SDK - 主入口
 * 提供所有 SDK 功能的统一访问点
 */

import { BaseHttpService, TokenService, httpService } from './http';
import { StorageService, localStorage, sessionStorage } from './storage';
import { DynamicContentSDK, dynamicContentSDK } from './business/DynamicContentSDK';
import { ArticleSDK, articleSDK } from './business/ArticleSDK';

export class OptimusClientSDK {
  // HTTP 服务
  public readonly http: BaseHttpService;
  public readonly token: TokenService;

  // 存储服务
  public readonly localStorage: StorageService;
  public readonly sessionStorage: StorageService;

  // 业务 SDK
  public readonly dynamicContent: DynamicContentSDK;
  public readonly article: ArticleSDK;

  constructor() {
    // 初始化 HTTP 服务
    this.http = httpService;
    this.token = httpService.getTokenService();

    // 初始化存储服务
    this.localStorage = localStorage;
    this.sessionStorage = sessionStorage;

    // 初始化业务 SDK
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
   * 获取当前登录用户
   */
  getCurrentUser() {
    return this.token.getCurrentUser();
  }

  /**
   * 检查是否已登录
   */
  isLoggedIn() {
    return this.token.isLoggedIn();
  }

  /**
   * 登出
   */
  logout() {
    this.token.clearTokens();
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
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


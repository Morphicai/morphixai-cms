/**
 * 通用 API 调用工具（调试版本）
 * 自动识别服务端/客户端环境，选择合适的调用方式
 */

import { TokenService } from '../services/TokenService';

import { CryptoUtil, encryptPasswordFields } from '@optimus/common';

// 环境检测
const isServer = typeof window === 'undefined';
const OPTIMUS_API_URL = process.env.OPTIMUS_API_URL || 'http://localhost:8084/api';

// 调试计数器
let requestCounter = 0;
const activeRequests = new Map<string, number>();

interface UniversalRequestOptions extends RequestInit {
  timeout?: number;
  useAuth?: boolean;
  token?: string;
}

/**
 * 生成请求唯一ID
 */
function generateRequestId(): string {
  return `req_${++requestCounter}_${Date.now()}`;
}

/**
 * 检查是否有重复请求
 */
function checkDuplicateRequest(endpoint: string, method: string): boolean {
  const key = `${method}:${endpoint}`;
  const count = activeRequests.get(key) || 0;
  
  if (count > 0) {
    console.warn(`🚨 [DUPLICATE] ${key} - 已有 ${count} 个相同请求正在进行`);
    return true;
  }
  
  return false;
}

/**
 * 记录活跃请求
 */
function trackRequest(endpoint: string, method: string): () => void {
  const key = `${method}:${endpoint}`;
  const count = activeRequests.get(key) || 0;
  activeRequests.set(key, count + 1);
  
  return () => {
    const currentCount = activeRequests.get(key) || 0;
    if (currentCount <= 1) {
      activeRequests.delete(key);
    } else {
      activeRequests.set(key, currentCount - 1);
    }
  };
}

/**
 * 通用请求函数
 * 自动根据环境选择调用方式
 */
async function universalRequest(
  endpoint: string,
  options: UniversalRequestOptions = {}
): Promise<any> {
  const requestId = generateRequestId();
  const { timeout = 10000, useAuth = false, token, ...fetchOptions } = options;
  const method = fetchOptions.method || 'GET';

  // 检查重复请求
  if (checkDuplicateRequest(endpoint, method)) {
    console.error(`❌ [${requestId}] 阻止重复请求: ${method} ${endpoint}`);
    throw new Error(`Duplicate request blocked: ${method} ${endpoint}`);
  }

  // 跟踪请求
  const untrack = trackRequest(endpoint, method);

  let url: string;
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers as Record<string, string>,
  };

  console.log(`🔍 [${requestId}] 环境检测: ${isServer ? '🖥️ 服务端' : '🌐 客户端'}`);

  if (isServer) {
    // 服务端：直接调用 optimus-api
    url = `${OPTIMUS_API_URL}${endpoint}`;
    console.log(`🖥️ [${requestId}] 服务端直调: ${method} ${url}`);
    
    // 服务端认证：使用传入的 token
    if (useAuth && token) {
      headers.Authorization = `Bearer ${token}`;
      console.log(`🔑 [${requestId}] 服务端认证: 使用传入 token`);
    } else if (useAuth) {
      console.warn(`⚠️ [${requestId}] 服务端需要认证但未提供 token`);
    }
  } else {
    // 客户端：通过 Next.js 代理
    url = `/api${endpoint}`;
    console.log(`🌐 [${requestId}] 客户端代理: ${method} ${url}`);
    
    // 客户端认证：自动从 TokenService 获取
    if (useAuth) {
      const clientToken = TokenService.getAccessToken();
      if (clientToken) {
        headers.Authorization = `Bearer ${clientToken}`;
        console.log(`🔑 [${requestId}] 客户端认证: 从 Cookie 获取 token`);
      } else {
        console.warn(`⚠️ [${requestId}] 客户端需要认证但未找到 token`);
      }
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error(`⏰ [${requestId}] 请求超时: ${method} ${url}`);
    controller.abort();
  }, timeout);

  try {
    console.log(`🚀 [${requestId}] 发起请求: ${method} ${url}`);
    console.log(`📋 [${requestId}] 请求头:`, headers);
    
    // 记录到调试面板
    if (typeof window !== 'undefined' && (window as any).__DEBUG_ADD_REQUEST__) {
      (window as any).__DEBUG_ADD_REQUEST__({
        id: requestId,
        timestamp: Date.now(),
        method,
        url,
      });
    }
    
    const startTime = Date.now();
    
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
      // 客户端需要包含 credentials，服务端不需要
      ...(isServer ? {} : { credentials: 'include' as RequestCredentials }),
    });

    const duration = Date.now() - startTime;
    clearTimeout(timeoutId);
    untrack();

    console.log(`✅ [${requestId}] 请求完成: ${response.status} (${duration}ms)`);

    // 更新调试面板
    if (typeof window !== 'undefined' && (window as any).__DEBUG_ADD_REQUEST__) {
      (window as any).__DEBUG_ADD_REQUEST__({
        id: `${requestId}-complete`,
        timestamp: Date.now(),
        method,
        url,
        status: response.status,
        duration,
      });
    }

    if (!response.ok) {
      console.error(`❌ [${requestId}] HTTP 错误: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`📦 [${requestId}] 响应数据:`, data);
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    untrack();
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error(`💥 [${requestId}] 请求失败:`, error);
    console.error(`📍 [${requestId}] 失败详情: ${method} ${url}`);
    
    // 记录错误到调试面板
    if (typeof window !== 'undefined' && (window as any).__DEBUG_ADD_REQUEST__) {
      (window as any).__DEBUG_ADD_REQUEST__({
        id: `${requestId}-error`,
        timestamp: Date.now(),
        method,
        url,
        error: errorMessage,
      });
    }
    
    // 打印调用栈
    console.error(`📚 [${requestId}] 调用栈:`, new Error().stack);
    
    throw error;
  }
}

/**
 * GET 请求
 */
export async function universalGet<T = any>(
  endpoint: string,
  options: Omit<UniversalRequestOptions, 'method'> = {}
): Promise<T> {
  return universalRequest(endpoint, {
    method: 'GET',
    ...options,
  });
}

/**
 * POST 请求
 */
export async function universalPost<T = any>(
  endpoint: string,
  data?: any,
  options: Omit<UniversalRequestOptions, 'method' | 'body'> = {}
): Promise<T> {
  return universalRequest(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });
}

/**
 * PUT 请求
 */
export async function universalPut<T = any>(
  endpoint: string,
  data?: any,
  options: Omit<UniversalRequestOptions, 'method' | 'body'> = {}
): Promise<T> {
  return universalRequest(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });
}

/**
 * DELETE 请求
 */
export async function universalDelete<T = any>(
  endpoint: string,
  options: Omit<UniversalRequestOptions, 'method'> = {}
): Promise<T> {
  return universalRequest(endpoint, {
    method: 'DELETE',
    ...options,
  });
}

/**
 * 通用客户端用户服务
 * 可在服务端和客户端使用
 */
export class UniversalClientUserService {
  /**
   * 用户注册
   */
  static async register(data: {
    username: string;
    email: string;
    password: string;
    nickname?: string;
  }) {
    // 加密密码字段
    const encryptedData = encryptPasswordFields(data);
    return universalPost('/client-user/register', encryptedData);
  }

  /**
   * 用户登录
   */
  static async login(data: {
    username: string;
    password: string;
  }) {
    // 加密密码字段
    const encryptedData = encryptPasswordFields(data);
    return universalPost('/client-user/login', encryptedData);
  }

  /**
   * 获取用户信息
   */
  static async getProfile(token?: string) {
    return universalGet('/client-user/profile', {
      useAuth: true,
      token,
    });
  }

  /**
   * 获取当前登录用户基本信息（从JWT解析）
   */
  static async getCurrentUser(token?: string) {
    return universalGet('/client-user/me', {
      useAuth: true,
      token,
    });
  }

  /**
   * 获取外部账号
   */
  static async getExternalAccounts(token?: string) {
    return universalGet('/client-user/external-accounts', {
      useAuth: true,
      token,
    });
  }

  /**
   * 刷新 Token
   */
  static async refreshToken() {
    return universalPost('/client-user/refresh');
  }

  /**
   * 退出登录
   */
  static async logout() {
    return universalPost('/client-user/logout', undefined, {
      useAuth: true,
    });
  }
}

/**
 * 通用合伙人服务
 */
export class UniversalPartnerService {
  /**
   * 加入合伙人
   */
  static async join(data: {
    inviterCode?: string;
    channelCode?: string;
    userRegisterTime: number;
    teamName?: string;
    username: string;
  }, token?: string) {
    return universalPost('/biz/partner/join', data, {
      useAuth: true,
      token,
    });
  }

  /**
   * 获取合伙人信息
   */
  static async getProfile(token?: string) {
    return universalGet('/biz/partner/profile', {
      useAuth: true,
      token,
    });
  }

  /**
   * 获取团队信息
   */
  static async getTeam(params: {
    depth?: number;
    page?: number;
    pageSize?: number;
  } = {}, token?: string) {
    const query = new URLSearchParams(params as any).toString();
    return universalGet(`/biz/partner/team?${query}`, {
      useAuth: true,
      token,
    });
  }
}

/**
 * 通用文章服务
 */
export class UniversalArticleService {
  /**
   * 获取公开文章列表
   */
  static async getPublicArticles(params: {
    page?: number;
    pageSize?: number;
    categoryCode?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    keyword?: string;
  } = {}) {
    const query = new URLSearchParams(params as any).toString();
    return universalGet(`/public/articles?${query}`);
  }

  /**
   * 通过 slug 获取文章
   */
  static async getArticleBySlug(slug: string) {
    return universalGet(`/public/articles/slug/${slug}`);
  }

  /**
   * 通过 ID 获取文章
   */
  static async getArticleById(id: string) {
    return universalGet(`/public/articles/${id}`);
  }
}

/**
 * 通用积分服务
 */
export class UniversalPointsService {
  /**
   * 获取我的积分
   */
  static async getMyPoints(includeDetail: boolean = false, token?: string) {
    const query = includeDetail ? '?includeDetail=true' : '';
    return universalGet(`/biz/points/me${query}`, {
      useAuth: true,
      token,
    });
  }

  /**
   * 通知任务完成
   */
  static async notifyTaskCompletion(data: {
    taskCode: string;
    businessParams?: Record<string, any>;
    eventTime?: number;
  }, token?: string) {
    return universalPost('/biz/points/notify', data, {
      useAuth: true,
      token,
    });
  }
}

// 导出环境检测工具
export const Environment = {
  isServer,
  isClient: !isServer,
  getBaseUrl: () => isServer ? OPTIMUS_API_URL : '/api',
};
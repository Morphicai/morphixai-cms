/**
 * 服务端 API 调用工具
 * 用于 Next.js 服务端组件和 API 路由中直接调用 optimus-api
 */

const OPTIMUS_API_URL = process.env.OPTIMUS_API_URL || 'http://localhost:8084/api';

interface ServerApiOptions extends RequestInit {
  timeout?: number;
}

/**
 * 服务端 API 请求基础函数
 */
async function serverRequest(
  endpoint: string, 
  options: ServerApiOptions = {}
): Promise<any> {
  const { timeout = 10000, ...fetchOptions } = options;
  
  const url = `${OPTIMUS_API_URL}${endpoint}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * 服务端 GET 请求
 */
export async function serverGet<T = any>(
  endpoint: string, 
  options: ServerApiOptions = {}
): Promise<T> {
  return serverRequest(endpoint, {
    method: 'GET',
    ...options,
  });
}

/**
 * 服务端 POST 请求
 */
export async function serverPost<T = any>(
  endpoint: string, 
  data?: any, 
  options: ServerApiOptions = {}
): Promise<T> {
  return serverRequest(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });
}

/**
 * 服务端 PUT 请求
 */
export async function serverPut<T = any>(
  endpoint: string, 
  data?: any, 
  options: ServerApiOptions = {}
): Promise<T> {
  return serverRequest(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });
}

/**
 * 服务端 DELETE 请求
 */
export async function serverDelete<T = any>(
  endpoint: string, 
  options: ServerApiOptions = {}
): Promise<T> {
  return serverRequest(endpoint, {
    method: 'DELETE',
    ...options,
  });
}

/**
 * 带认证的服务端请求（用于需要 JWT 的接口）
 */
export async function serverAuthRequest<T = any>(
  endpoint: string,
  token: string,
  options: ServerApiOptions = {}
): Promise<T> {
  return serverRequest(endpoint, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

/**
 * 服务端客户端用户服务
 */
export class ServerClientUserService {
  /**
   * 验证客户端用户 token
   */
  static async verifyToken(token: string) {
    try {
      return await serverAuthRequest('/client-user/profile', token);
    } catch (error) {
      return null;
    }
  }
  
  /**
   * 获取用户信息
   */
  static async getProfile(token: string) {
    return serverAuthRequest('/client-user/profile', token);
  }

  /**
   * 获取当前登录用户基本信息（从JWT解析）
   */
  static async getCurrentUser(token: string) {
    return serverAuthRequest('/client-user/me', token);
  }
  
  /**
   * 获取用户外部账号
   */
  static async getExternalAccounts(token: string) {
    return serverAuthRequest('/client-user/external-accounts', token);
  }
}

/**
 * 服务端文章服务
 */
export class ServerArticleService {
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
    return serverGet(`/public/articles?${query}`);
  }
  
  /**
   * 通过 slug 获取文章
   */
  static async getArticleBySlug(slug: string) {
    return serverGet(`/public/articles/slug/${slug}`);
  }
  
  /**
   * 通过 ID 获取文章
   */
  static async getArticleById(id: string) {
    return serverGet(`/public/articles/${id}`);
  }
}

/**
 * 服务端合伙人服务
 */
export class ServerPartnerService {
  /**
   * 获取合伙人信息
   */
  static async getProfile(token: string) {
    return serverAuthRequest('/biz/partner/profile', token);
  }
  
  /**
   * 获取团队信息
   */
  static async getTeam(token: string, params: {
    depth?: number;
    page?: number;
    pageSize?: number;
  } = {}) {
    const query = new URLSearchParams(params as any).toString();
    return serverAuthRequest(`/biz/partner/team?${query}`, token);
  }
}
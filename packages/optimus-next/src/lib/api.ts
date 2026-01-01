import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { TokenService } from '../services/TokenService'
import { requestDeduplication } from './request-deduplication'
import { requestMonitor } from './request-monitor'

/**
 * API 客户端配置
 * 客户端请求通过 Next.js 代理到 optimus-api
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: '/api', // 使用 Next.js 代理路径
  timeout: 10000,
  withCredentials: true, // 支持 cookie
  headers: {
    'Content-Type': 'application/json',
  },
})

// 刷新 token 的状态管理
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * 刷新 Token
 */
async function refreshToken(): Promise<boolean> {
  if (isRefreshing) {
    return refreshPromise || Promise.resolve(false);
  }

  isRefreshing = true;
  refreshPromise = performTokenRefresh();

  try {
    const result = await refreshPromise;
    return result;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
}

async function performTokenRefresh(): Promise<boolean> {
  try {
    const response = await axios.post('/api/client-user/refresh', {}, { 
      withCredentials: true 
    });

    if (response.data?.code === 200) {
      console.log('Token refreshed successfully');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
}

/**
 * 处理认证错误
 */
function handleAuthError() {
  TokenService.clearTokens();
  
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    if (currentPath !== '/login' && currentPath !== '/register') {
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
    }
  }
}

/**
 * 请求拦截器
 */
apiClient.interceptors.request.use(
  async (config) => {
    // 检查是否需要刷新 token
    if (TokenService.shouldRefreshToken() && !isRefreshing) {
      await refreshToken();
    }

    // 自动添加 JWT token
    const token = TokenService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
)

/**
 * 响应拦截器
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 处理 401 错误（token 过期）
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // 尝试刷新 token
      const refreshed = await refreshToken();
      
      if (refreshed) {
        // 重新添加新的 token 并重试请求
        const newToken = TokenService.getAccessToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return apiClient(originalRequest);
      } else {
        // 刷新失败，跳转到登录页
        handleAuthError();
        return Promise.reject(error);
      }
    }

    // 统一错误处理
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('Network Error:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    
    return Promise.reject(error);
  }
)

/**
 * GET 请求
 */
export async function get<T = any>(url: string, config?: AxiosRequestConfig) {
  return requestDeduplication.deduplicate(
    url,
    'GET',
    async () => {
      const response = await apiClient.get<T>(url, config);
      return response.data;
    }
  );
}

/**
 * POST 请求
 */
export async function post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
  return requestDeduplication.deduplicate(
    url,
    'POST',
    async () => {
      const response = await apiClient.post<T>(url, data, config);
      return response.data;
    },
    data
  );
}

/**
 * PUT 请求
 */
export async function put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
  return requestDeduplication.deduplicate(
    url,
    'PUT',
    async () => {
      const response = await apiClient.put<T>(url, data, config);
      return response.data;
    },
    data
  );
}

/**
 * DELETE 请求
 */
export async function del<T = any>(url: string, config?: AxiosRequestConfig) {
  return requestDeduplication.deduplicate(
    url,
    'DELETE',
    async () => {
      const response = await apiClient.delete<T>(url, config);
      return response.data;
    }
  );
}

/**
 * PATCH 请求
 */
export async function patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
  const response = await apiClient.patch<T>(url, data, config)
  return response.data
}

export default apiClient


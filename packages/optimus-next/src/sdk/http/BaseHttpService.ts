/**
 * BaseHttpService - 基础 HTTP 服务
 * 提供通用的 HTTP 请求能力，支持拦截器、token 管理、请求去重
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { TokenService } from './TokenService';
import { RequestDeduplication } from './RequestDeduplication';

export interface HttpConfig {
  baseURL?: string;
  timeout?: number;
  withCredentials?: boolean;
  headers?: Record<string, string>;
}

export interface RequestOptions extends AxiosRequestConfig {
  skipAuth?: boolean;
  skipDedup?: boolean;
  retryOnAuthError?: boolean;
}

/**
 * 基础 HTTP 服务类
 * 封装 axios，提供通用的请求能力
 */
export class BaseHttpService {
  private client: AxiosInstance;
  private tokenService: TokenService;
  private deduplication: RequestDeduplication;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(config: HttpConfig = {}) {
    const defaultConfig: HttpConfig = {
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      timeout: 30000,
      withCredentials: true,
      ...config,
    };

    this.client = axios.create(defaultConfig);
    this.tokenService = new TokenService();
    this.deduplication = new RequestDeduplication();

    this.setupInterceptors();
  }

  /**
   * 设置请求和响应拦截器
   */
  private setupInterceptors() {
    // 请求拦截器
    this.client.interceptors.request.use(
      async (config) => {
        // 添加认证 token
        const token = this.tokenService.getAccessToken();
        if (token && !config.headers['Authorization']) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }

        // 检查是否需要刷新 token
        if (this.tokenService.shouldRefreshToken()) {
          await this.refreshTokenIfNeeded();
          const newToken = this.tokenService.getAccessToken();
          if (newToken) {
            config.headers['Authorization'] = `Bearer ${newToken}`;
          }
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // 处理 401 未授权错误
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshed = await this.refreshTokenIfNeeded();
            if (refreshed && originalRequest.headers) {
              const newToken = this.tokenService.getAccessToken();
              if (newToken) {
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                return this.client.request(originalRequest);
              }
            }
          } catch (refreshError) {
            this.handleAuthError();
            return Promise.reject(refreshError);
          }
        }

        // 处理其他错误
        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  /**
   * 刷新 token（如果需要）
   */
  private async refreshTokenIfNeeded(): Promise<boolean> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
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

  /**
   * 执行 token 刷新
   */
  private async performTokenRefresh(): Promise<boolean> {
    try {
      const refreshToken = this.tokenService.getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      const response = await axios.post(
        `${this.client.defaults.baseURL}/client-user/refresh`,
        { refreshToken },
        { withCredentials: true }
      );

      if (response.data?.data) {
        const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data.data;
        this.tokenService.setTokens(accessToken, newRefreshToken, expiresIn);
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
  private handleAuthError() {
    this.tokenService.clearTokens();
    
    // 在客户端环境下跳转到登录页
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (currentPath !== '/auth/login') {
        window.location.href = `/auth/login?redirect=${encodeURIComponent(currentPath)}`;
      }
    }
  }

  /**
   * 标准化错误对象
   */
  private normalizeError(error: AxiosError): Error {
    const responseData = error.response?.data as any;
    const message = responseData?.message || error.message || 'Request failed';
    const normalizedError = new Error(message);
    (normalizedError as any).status = error.response?.status;
    (normalizedError as any).data = error.response?.data;
    return normalizedError;
  }

  /**
   * GET 请求
   */
  async get<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
    const { skipDedup = false, ...axiosConfig } = options;

    if (skipDedup) {
      const response = await this.client.get<T>(url, axiosConfig);
      return response.data;
    }

    return this.deduplication.dedupe(
      `GET:${url}`,
      async () => {
        const response = await this.client.get<T>(url, axiosConfig);
        return response.data;
      }
    );
  }

  /**
   * POST 请求
   */
  async post<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const response = await this.client.post<T>(url, data, options);
    return response.data;
  }

  /**
   * PUT 请求
   */
  async put<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const response = await this.client.put<T>(url, data, options);
    return response.data;
  }

  /**
   * DELETE 请求
   */
  async delete<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
    const response = await this.client.delete<T>(url, options);
    return response.data;
  }

  /**
   * PATCH 请求
   */
  async patch<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const response = await this.client.patch<T>(url, data, options);
    return response.data;
  }

  /**
   * 获取原始 axios 实例（用于高级用法）
   */
  getClient(): AxiosInstance {
    return this.client;
  }

  /**
   * 获取 TokenService 实例
   */
  getTokenService(): TokenService {
    return this.tokenService;
  }
}

// 导出默认实例
export const httpService = new BaseHttpService();


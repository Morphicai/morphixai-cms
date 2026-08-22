/**
 * BaseHttpService - 基础 HTTP 服务
 * 封装 axios：同源 /api 代理、请求去重、401 自动续期重放
 *
 * 认证不在这里做：token 全程住在 httpOnly cookie 里（后台签发/续期/清除），
 * 前端读不到也不需要读——请求带上 cookie 就是带上了身份。
 * 这个类早前自己管 token（document.cookie 读写 + 主动刷新），和 httpOnly
 * 方案互斥，还把 baseURL 默认指到一个不存在的 3001 端口，等于登录从没通过。
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { RequestDeduplication } from './RequestDeduplication';

export interface HttpConfig {
  baseURL?: string;
  timeout?: number;
  withCredentials?: boolean;
  headers?: Record<string, string>;
}

export interface RequestOptions extends AxiosRequestConfig {
  skipDedup?: boolean;
}

export class BaseHttpService {
  private client: AxiosInstance;
  private deduplication: RequestDeduplication;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(config: HttpConfig = {}) {
    const defaultConfig: HttpConfig = {
      // 同源相对路径，经 Next 代理转发到后台；部署无需注入前端环境变量
      baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
      timeout: 30000,
      withCredentials: true,
      ...config,
    };

    this.client = axios.create(defaultConfig);
    this.deduplication = new RequestDeduplication();

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // 401 → 凭 refresh cookie 续期一次 → 重放原请求
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;
          const refreshed = await this.refreshTokenIfNeeded();
          if (refreshed) {
            return this.client.request(originalRequest);
          }
        }

        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  private async refreshTokenIfNeeded(): Promise<boolean> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      return await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<boolean> {
    try {
      // refreshToken 在 httpOnly cookie 里，后台自己读，body 为空即可。
      // 注意用裸 axios 而不是 this.client，避免 401 拦截器递归触发刷新
      const response = await axios.post(
        `${this.client.defaults.baseURL}/client-user/refresh`,
        {},
        { withCredentials: true }
      );
      return response.data?.code === 200;
    } catch {
      return false;
    }
  }

  private normalizeError(error: AxiosError): Error {
    const responseData = error.response?.data as
      | { message?: string | string[]; msg?: string | string[] }
      | undefined;
    // 后端校验错误的 msg 是数组（class-validator 逐条），取第一条给用户看
    const rawMessage = responseData?.message || responseData?.msg;
    const message =
      (Array.isArray(rawMessage) ? rawMessage[0] : rawMessage) ||
      error.message ||
      'Request failed';
    const normalizedError = new Error(message);
    (normalizedError as Error & { status?: number; data?: unknown }).status = error.response?.status;
    (normalizedError as Error & { status?: number; data?: unknown }).data = error.response?.data;
    return normalizedError;
  }

  async get<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
    const { skipDedup = false, ...axiosConfig } = options;

    if (skipDedup) {
      const response = await this.client.get<T>(url, axiosConfig);
      return response.data;
    }

    return this.deduplication.dedupe(`GET:${url}`, async () => {
      const response = await this.client.get<T>(url, axiosConfig);
      return response.data;
    });
  }

  async post<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const response = await this.client.post<T>(url, data, options);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const response = await this.client.put<T>(url, data, options);
    return response.data;
  }

  async delete<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
    const response = await this.client.delete<T>(url, options);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const response = await this.client.patch<T>(url, data, options);
    return response.data;
  }

  getClient(): AxiosInstance {
    return this.client;
  }
}

// 导出默认实例
export const httpService = new BaseHttpService();

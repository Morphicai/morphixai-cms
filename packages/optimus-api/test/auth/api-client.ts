import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import * as http from "http";
import * as https from "https";

export interface ApiResponse {
    code: number | string;
    message: string;
    data: any;
    msg?: string; // 添加可选的msg字段
}

export interface RequestOptions {
    headers?: Record<string, string>;
    timeout?: number;
    params?: Record<string, any>;
}

/**
 * API客户端 - 封装HTTP请求，支持认证和通用工具
 */
export class ApiClient {
    private axiosInstance: AxiosInstance;
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
        this.axiosInstance = axios.create({
            baseURL: baseUrl,
            timeout: 30000, // 30秒超时
            headers: {
                "Content-Type": "application/json",
            },
            // 添加连接池配置，确保连接可以正确关闭
            httpAgent: new http.Agent({ keepAlive: false }),
            httpsAgent: new https.Agent({ keepAlive: false }),
        });

        // 设置响应拦截器
        this.setupResponseInterceptor();
    }

    /**
     * GET请求
     */
    async get(endpoint: string, options?: RequestOptions): Promise<ApiResponse> {
        try {
            const config: AxiosRequestConfig = {
                params: options?.params,
                headers: options?.headers,
                timeout: options?.timeout,
            };

            const response = await this.axiosInstance.get(endpoint, config);
            return this.normalizeResponse(response);
        } catch (error) {
            throw this.handleError(error, "GET", endpoint);
        }
    }

    /**
     * POST请求
     */
    async post(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse> {
        try {
            const config: AxiosRequestConfig = {
                headers: options?.headers,
                timeout: options?.timeout,
                params: options?.params,
            };

            const response = await this.axiosInstance.post(endpoint, data, config);
            return this.normalizeResponse(response);
        } catch (error) {
            throw this.handleError(error, "POST", endpoint);
        }
    }

    /**
     * PUT请求
     */
    async put(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse> {
        try {
            const config: AxiosRequestConfig = {
                headers: options?.headers,
                timeout: options?.timeout,
                params: options?.params,
            };

            const response = await this.axiosInstance.put(endpoint, data, config);
            return this.normalizeResponse(response);
        } catch (error) {
            throw this.handleError(error, "PUT", endpoint);
        }
    }

    /**
     * DELETE请求
     */
    async delete(endpoint: string, options?: RequestOptions): Promise<ApiResponse> {
        try {
            const config: AxiosRequestConfig = {
                headers: options?.headers,
                timeout: options?.timeout,
                params: options?.params,
            };

            const response = await this.axiosInstance.delete(endpoint, config);
            return this.normalizeResponse(response);
        } catch (error) {
            throw this.handleError(error, "DELETE", endpoint);
        }
    }

    /**
     * 设置默认认证头
     */
    setAuthToken(token: string): void {
        this.axiosInstance.defaults.headers.common["Authorization"] = token;
    }

    /**
     * 清除认证头
     */
    clearAuthToken(): void {
        delete this.axiosInstance.defaults.headers.common["Authorization"];
    }

    /**
     * 设置响应拦截器
     */
    private setupResponseInterceptor(): void {
        this.axiosInstance.interceptors.response.use(
            (response) => response,
            (error) => {
                // 记录请求错误详情
                if (error.response) {
                    console.error(`API请求失败 [${error.response.status}]:`, {
                        url: error.config?.url,
                        method: error.config?.method?.toUpperCase(),
                        status: error.response.status,
                        statusText: error.response.statusText,
                        data: error.response.data,
                    });
                } else if (error.request) {
                    console.error("网络请求失败:", {
                        url: error.config?.url,
                        method: error.config?.method?.toUpperCase(),
                        message: error.message,
                    });
                }

                return Promise.reject(error);
            },
        );
    }

    /**
     * 标准化响应格式
     */
    private normalizeResponse(response: AxiosResponse): ApiResponse {
        // 假设后端返回的格式是 { code, msg, data } 或 { code, message, data }
        if (response.data && typeof response.data === "object") {
            const responseData = response.data as any;
            return {
                code: responseData.code || response.status,
                message: responseData.message || responseData.msg || "Success",
                data: responseData.data !== undefined ? responseData.data : responseData,
            };
        }

        // 如果响应格式不标准，创建标准格式
        return {
            code: response.status,
            message: "Success",
            data: response.data,
        };
    }

    /**
     * 错误处理
     */
    private handleError(error: any, method: string, endpoint: string): Error {
        let errorMessage = `${method} ${endpoint} 请求失败`;

        if (error.response) {
            // 服务器响应了错误状态码
            const { status, data } = error.response;
            errorMessage += ` [${status}]`;

            if (data && data.message) {
                errorMessage += `: ${data.message}`;
            } else if (data && typeof data === "string") {
                errorMessage += `: ${data}`;
            }
        } else if (error.request) {
            // 请求发出但没有收到响应
            errorMessage += ": 网络连接失败";
        } else {
            // 其他错误
            errorMessage += `: ${error.message}`;
        }

        return new Error(errorMessage);
    }

    /**
     * 获取基础URL
     */
    getBaseUrl(): string {
        return this.baseUrl;
    }

    /**
     * 更新基础URL
     */
    updateBaseUrl(newBaseUrl: string): void {
        this.baseUrl = newBaseUrl;
        this.axiosInstance.defaults.baseURL = newBaseUrl;
    }

    /**
     * 获取当前配置
     */
    getConfig(): {
        baseURL: string;
        timeout: number;
        headers: Record<string, any>;
    } {
        return {
            baseURL: this.axiosInstance.defaults.baseURL || "",
            timeout: this.axiosInstance.defaults.timeout || 0,
            headers: this.axiosInstance.defaults.headers || {},
        };
    }

    /**
     * 销毁客户端，清理资源
     */
    destroy(): void {
        // 对于 axios，主要的清理工作由 keepAlive: false 配置处理
        // 这里我们只是标记客户端已被销毁
        try {
            // 可以在这里添加任何需要的清理逻辑
            console.debug("ApiClient destroyed");
        } catch (error) {
            // 忽略清理错误
            console.warn("ApiClient cleanup warning:", error.message);
        }
    }
}

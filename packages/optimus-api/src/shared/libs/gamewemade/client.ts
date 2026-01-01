import axios, { AxiosInstance } from "axios";
import FormData from "form-data";
import { SDKConfig, ApiResponse, UserInfo, CheckTokenParams } from "./types";
import { generateSign } from "./utils/sign";

/**
 * GameWemade SDK 客户端
 *
 * 用于与 GameWemade SDK 开放平台进行交互
 *
 * @example
 * ```typescript
 * import { GameWemadeSDK } from './gamewemade';
 *
 * const sdk = new GameWemadeSDK({
 *   openId: 'your-open-id',
 *   openKey: 'your-open-key',
 *   productCode: 'your-product-code',
 *   baseUrl: 'http://custom-sdkapi.gamewemade.com',
 *   channelCode: 'website'
 * });
 *
 * // 通用请求
 * const result = await sdk.request('/webOpen/userLogin', {
 *   username: 'testuser',
 *   password: 'md5-encoded-password'
 * });
 *
 * // 检查 Token
 * const tokenResult = await sdk.checkToken({
 *   authToken: 'your-auth-token',
 *   uid: 'user-id' // 可选
 * });
 * ```
 */
export class GameWemadeSDK {
    private config: Required<SDKConfig>;
    private axiosInstance: AxiosInstance;
    private isServer: boolean;

    constructor(config: SDKConfig) {
        // 检测运行环境
        this.isServer = typeof window === "undefined";

        // 设置默认值
        this.config = {
            baseUrl: config.baseUrl || "http://custom-sdkapi.gamewemade.com",
            channelCode: config.channelCode || "website",
            ...config,
        };

        // 验证必需参数
        if (!this.config.openId) {
            throw new Error("openId is required");
        }
        if (!this.config.openKey) {
            throw new Error("openKey is required");
        }
        if (!this.config.productCode) {
            throw new Error("productCode is required");
        }

        // 创建 axios 实例
        this.axiosInstance = axios.create({
            baseURL: this.config.baseUrl,
            timeout: 30000,
        });
    }

    /**
     * 构建 FormData（兼容浏览器和 Node.js 环境）
     */
    private createFormData(params: Record<string, any>): FormData | URLSearchParams {
        if (this.isServer) {
            // Node.js 环境：使用 form-data 包
            const formData = new FormData();
            Object.keys(params).forEach((key) => {
                const value = params[key];
                if (value !== undefined && value !== null) {
                    formData.append(key, String(value));
                }
            });
            return formData;
        } else {
            // 浏览器环境：使用 URLSearchParams（更简单且兼容性好）
            const formData = new URLSearchParams();
            Object.keys(params).forEach((key) => {
                const value = params[key];
                if (value !== undefined && value !== null) {
                    formData.append(key, String(value));
                }
            });
            return formData;
        }
    }

    /**
     * 获取请求头
     */
    private getHeaders(formData: FormData | URLSearchParams): Record<string, string> {
        if (this.isServer && formData instanceof FormData) {
            // Node.js 环境的 form-data
            return formData.getHeaders();
        } else {
            // 浏览器环境的 URLSearchParams
            return {
                "Content-Type": "application/x-www-form-urlencoded",
            };
        }
    }

    /**
     * 通用请求方法
     * 自动处理签名，使用 form-data 格式发送请求
     *
     * @param endpoint API 端点路径（如：/webOpen/userRegister）
     * @param params 请求参数（不包含 sign，会自动计算）
     * @returns Promise<ApiResponse<T>>
     */
    async request<T = any>(endpoint: string, params: Record<string, any> = {}): Promise<ApiResponse<T>> {
        // 构建基础参数
        const requestParams: Record<string, any> = {
            openId: this.config.openId,
            productCode: this.config.productCode,
            channelCode: this.config.channelCode,
            ...params,
        };

        // 计算签名
        const sign = generateSign(requestParams, this.config.openKey);
        requestParams.sign = sign;

        // 构建 FormData
        const formData = this.createFormData(requestParams);
        const headers = this.getHeaders(formData);

        // 发送 POST 请求
        try {
            const response = await this.axiosInstance.post<ApiResponse<T>>(endpoint, formData, { headers });
            return response.data;
        } catch (error: any) {
            // 错误处理
            if (error.response) {
                // 服务器返回了错误响应
                throw new Error(
                    error.response.data?.message || `请求失败: ${error.response.status} ${error.response.statusText}`,
                );
            } else if (error.request) {
                // 请求已发送但没有收到响应
                throw new Error("网络错误，请检查网络连接");
            } else {
                // 请求配置错误
                throw new Error(`请求配置错误: ${error.message}`);
            }
        }
    }

    /**
     * 检查 Token
     *
     * 验证 authToken 是否有效，并获取用户信息
     *
     * @param params Token检查参数
     * @returns Promise<ApiResponse<UserInfo>>
     */
    async checkToken(params: CheckTokenParams): Promise<ApiResponse<UserInfo>> {
        const requestParams: Record<string, any> = {
            authToken: params.authToken,
        };

        if (params.uid) {
            requestParams.uid = params.uid;
        }

        return this.request<UserInfo>("/webOpen/checkToken", requestParams);
    }

    /**
     * 获取配置信息
     */
    getConfig(): Readonly<SDKConfig> {
        return { ...this.config };
    }
}

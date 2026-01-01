import { ApiClient, ApiResponse, RequestOptions } from "./api-client";
import { AuthenticationManager } from "./authentication-manager";

/**
 * 带认证的API客户端 - 自动处理令牌管理和认证
 */
export class AuthenticatedApiClient {
    private apiClient: ApiClient;
    private authManager: AuthenticationManager;
    private autoLoginEnabled = true;
    private defaultCredentials: { account?: string; password?: string } = {};

    constructor(baseUrl: string) {
        this.apiClient = new ApiClient(baseUrl);
        this.authManager = new AuthenticationManager(baseUrl);

        // 从环境变量获取默认登录凭据
        this.defaultCredentials = {
            account: process.env.TEST_USER_ACCOUNT || process.env.TEST_ADMIN_ACCOUNT || "admin",
            password: process.env.TEST_USER_PASSWORD || process.env.TEST_ADMIN_PASSWORD || "admin",
        };
    }

    /**
     * 初始化认证（预热）
     */
    async initialize(): Promise<void> {
        await this.authManager.warmupAuthentication();
    }

    /**
     * GET请求（自动添加认证）
     */
    async get(endpoint: string, options?: RequestOptions): Promise<ApiResponse> {
        await this.ensureAuthenticated();
        const token = await this.authManager.getValidToken();
        const requestOptions = this.addAuthHeader(options, token);
        return this.apiClient.get(endpoint, requestOptions);
    }

    /**
     * POST请求（自动添加认证）
     */
    async post(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse> {
        await this.ensureAuthenticated();
        const token = await this.authManager.getValidToken();
        const requestOptions = this.addAuthHeader(options, token);
        return this.apiClient.post(endpoint, data, requestOptions);
    }

    /**
     * PUT请求（自动添加认证）
     */
    async put(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse> {
        await this.ensureAuthenticated();
        const token = await this.authManager.getValidToken();
        const requestOptions = this.addAuthHeader(options, token);
        return this.apiClient.put(endpoint, data, requestOptions);
    }

    /**
     * DELETE请求（自动添加认证）
     */
    async delete(endpoint: string, options?: RequestOptions): Promise<ApiResponse> {
        await this.ensureAuthenticated();
        const token = await this.authManager.getValidToken();
        const requestOptions = this.addAuthHeader(options, token);
        return this.apiClient.delete(endpoint, requestOptions);
    }

    /**
     * 执行不需要认证的请求
     */
    async requestWithoutAuth(
        method: "GET" | "POST" | "PUT" | "DELETE",
        endpoint: string,
        data?: any,
        options?: RequestOptions,
    ): Promise<ApiResponse> {
        switch (method) {
            case "GET":
                return this.apiClient.get(endpoint, options);
            case "POST":
                return this.apiClient.post(endpoint, data, options);
            case "PUT":
                return this.apiClient.put(endpoint, data, options);
            case "DELETE":
                return this.apiClient.delete(endpoint, options);
            default:
                throw new Error(`不支持的HTTP方法: ${method}`);
        }
    }

    /**
     * 手动登录
     */
    async login(account?: string, password?: string): Promise<void> {
        const credentials = account && password ? { account, password } : undefined;
        await this.authManager.login(credentials);

        // 更新默认凭据（用于自动登录）
        if (account && password) {
            this.defaultCredentials = { account, password };
        }
    }

    /**
     * 登出
     */
    async logout(): Promise<void> {
        await this.authManager.logout();
    }

    /**
     * 检查是否已认证
     */
    isAuthenticated(): boolean {
        return this.authManager.isAuthenticated();
    }

    /**
     * 获取认证状态
     */
    getAuthStatus(): {
        isAuthenticated: boolean;
        tokenStatus: any;
    } {
        return {
            isAuthenticated: this.authManager.isAuthenticated(),
            tokenStatus: this.authManager.getTokenStatus(),
        };
    }

    /**
     * 强制刷新令牌
     */
    async refreshToken(): Promise<void> {
        await this.authManager.forceRefreshToken();
    }

    /**
     * 获取基础API客户端（用于特殊情况）
     */
    getBaseClient(): ApiClient {
        return this.apiClient;
    }

    /**
     * 获取认证管理器（用于特殊情况）
     */
    getAuthManager(): AuthenticationManager {
        return this.authManager;
    }

    /**
     * 添加认证头到请求选项
     */
    private addAuthHeader(options: RequestOptions = {}, token: string): RequestOptions {
        return {
            ...options,
            headers: {
                ...options.headers,
                Authorization: token,
            },
        };
    }

    /**
     * 执行带重试的认证请求
     */
    async requestWithRetry<T>(requestFn: () => Promise<T>, maxRetries = 1): Promise<T> {
        let lastError: Error;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await requestFn();
            } catch (error) {
                lastError = error as Error;

                // 如果是认证错误且还有重试次数，尝试刷新令牌
                if (attempt < maxRetries && this.isAuthError(error)) {
                    console.warn(`认证错误，尝试刷新令牌 (尝试 ${attempt + 1}/${maxRetries + 1})`);
                    try {
                        await this.authManager.forceRefreshToken();
                    } catch (refreshError) {
                        console.warn("令牌刷新失败:", refreshError);
                    }
                }
            }
        }

        throw lastError || new Error("Request failed after all retries");
    }

    /**
     * 确保已认证 - 在每个请求前自动检查并登录
     */
    private async ensureAuthenticated(): Promise<void> {
        if (!this.autoLoginEnabled) {
            return;
        }

        // 检查是否已认证
        if (this.authManager.isAuthenticated()) {
            return;
        }

        // 如果未认证，尝试自动登录
        try {
            console.log("🔐 检测到未登录状态，正在自动登录...");

            if (!this.defaultCredentials.account || !this.defaultCredentials.password) {
                throw new Error("自动登录失败：缺少默认登录凭据");
            }

            await this.authManager.login({
                account: this.defaultCredentials.account,
                password: this.defaultCredentials.password,
            });

            console.log("✅ 自动登录成功");
        } catch (error) {
            console.error("❌ 自动登录失败:", error.message);
            throw new Error(`自动登录失败: ${error.message}`);
        }
    }

    /**
     * 设置默认登录凭据（用于自动登录）
     */
    setDefaultCredentials(account: string, password: string): void {
        this.defaultCredentials = { account, password };
    }

    /**
     * 获取当前默认凭据
     */
    getDefaultCredentials(): { account?: string; password?: string } {
        return { ...this.defaultCredentials };
    }

    /**
     * 启用或禁用自动登录
     */
    setAutoLoginEnabled(enabled: boolean): void {
        this.autoLoginEnabled = enabled;
    }

    /**
     * 检查是否启用了自动登录
     */
    isAutoLoginEnabled(): boolean {
        return this.autoLoginEnabled;
    }

    /**
     * 判断是否为认证错误
     */
    private isAuthError(error: any): boolean {
        if (error && error.message) {
            const message = error.message.toLowerCase();
            return (
                message.includes("401") ||
                message.includes("unauthorized") ||
                message.includes("token") ||
                message.includes("认证")
            );
        }
        return false;
    }

    /**
     * 销毁客户端，清理所有资源
     */
    destroy(): void {
        if (this.authManager && typeof this.authManager.destroy === "function") {
            this.authManager.destroy();
        }
        if (this.apiClient && typeof this.apiClient.destroy === "function") {
            this.apiClient.destroy();
        }
    }
}

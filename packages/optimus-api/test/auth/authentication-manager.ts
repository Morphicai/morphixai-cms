import { Injectable } from "@nestjs/common";
import { TestModeDetector } from "../../src/shared/utils/test-mode.detector";
import { TokenManager } from "./token-manager";
import { ApiClient } from "./api-client";
import { CaptchaHandler } from "./captcha-handler";

export interface LoginCredentials {
    account: string;
    password: string;
    captchaId?: string;
    verifyCode?: string;
}

export interface AuthResult {
    accessToken: string;
    user: any;
    expiresAt: Date;
}

export interface IAuthenticationManager {
    login(credentials?: LoginCredentials): Promise<AuthResult>;
    refreshToken(): Promise<string>;
    getValidToken(): Promise<string>;
    logout(): Promise<void>;
}

/**
 * 认证管理器 - 处理API测试的所有认证相关操作
 * 支持自动登录、令牌管理和测试模式下的验证码绕过
 */
@Injectable()
export class AuthenticationManager implements IAuthenticationManager {
    private tokenManager: TokenManager;
    private apiClient: ApiClient;
    private captchaHandler: CaptchaHandler;
    private defaultCredentials: LoginCredentials;

    constructor(baseUrl: string) {
        this.tokenManager = new TokenManager();
        this.apiClient = new ApiClient(baseUrl);
        this.captchaHandler = new CaptchaHandler(this.apiClient);

        // 从环境变量获取默认测试账号
        this.defaultCredentials = {
            account: process.env.TEST_USER_ACCOUNT || process.env.TEST_ADMIN_ACCOUNT || "admin",
            password: process.env.TEST_USER_PASSWORD || process.env.TEST_ADMIN_PASSWORD || "admin",
        };
    }

    /**
     * 登录并获取认证令牌
     * 在测试模式下自动绕过验证码验证
     */
    async login(credentials?: LoginCredentials): Promise<AuthResult> {
        const loginData = credentials || this.defaultCredentials;

        try {
            // 使用CaptchaHandler准备验证码数据
            if (!loginData.captchaId || !loginData.verifyCode) {
                const captchaData = await this.captchaHandler.prepareCaptchaForLogin();
                loginData.captchaId = captchaData.captchaId;
                loginData.verifyCode = captchaData.verifyCode;
            }

            const response = await this.apiClient.post("/api/login", loginData);

            // 调试：打印登录响应状态
            console.log("🔍 [DEBUG] 登录响应状态:", {
                code: response.code,
                hasData: !!response.data,
                hasToken: !!(response.data && response.data.accessToken),
            });

            // 检查响应是否成功
            const isSuccess =
                response.code === 200 ||
                response.code === "200" ||
                response.code === "Success" ||
                (response.data && response.data.accessToken);

            if (!isSuccess) {
                const errorMsg = response.message || (response as any).msg || JSON.stringify(response);
                console.log("🔍 [DEBUG] 登录失败详情:", {
                    code: response.code,
                    message: response.message,
                    data: response.data,
                    isSuccess,
                });
                throw new Error(`登录失败: ${errorMsg}`);
            }

            const { accessToken, user } = response.data;

            // 计算令牌过期时间（默认24小时）
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);

            const authResult: AuthResult = {
                accessToken,
                user,
                expiresAt,
            };

            // 存储令牌信息
            this.tokenManager.storeToken(accessToken, expiresAt);

            return authResult;
        } catch (error) {
            throw new Error(`认证失败: ${error.message}`);
        }
    }

    /**
     * 刷新访问令牌
     */
    async refreshToken(): Promise<string> {
        try {
            const currentToken = this.tokenManager.getCurrentToken();
            if (!currentToken) {
                throw new Error("没有可用的令牌进行刷新");
            }

            // 使用当前令牌调用刷新端点
            const response = await this.apiClient.post(
                "/api/update/token",
                {},
                {
                    headers: {
                        Authorization: currentToken,
                    },
                },
            );

            if (response.code !== 200) {
                throw new Error(`令牌刷新失败: ${response.message}`);
            }

            const { accessToken } = response.data;

            // 计算新令牌过期时间
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);

            // 更新存储的令牌
            this.tokenManager.storeToken(accessToken, expiresAt);

            return accessToken;
        } catch (error) {
            // 刷新失败时清除令牌，强制重新认证
            this.tokenManager.clearToken();
            throw new Error(`令牌刷新失败: ${error.message}`);
        }
    }

    /**
     * 获取有效的访问令牌
     * 自动处理令牌过期和刷新
     */
    async getValidToken(): Promise<string> {
        // 检查是否有有效令牌
        const cachedToken = this.tokenManager.getValidToken();

        if (cachedToken) {
            // 检查令牌是否即将过期，如果是则主动刷新
            if (this.tokenManager.isTokenNearExpiry()) {
                try {
                    console.log("🔄 令牌即将过期，主动刷新...");
                    return await this.refreshToken();
                } catch (error) {
                    console.warn("主动刷新失败，使用当前令牌:", error.message);
                    return cachedToken;
                }
            }

            return cachedToken;
        }

        // 令牌不存在或已过期，尝试刷新
        if (this.tokenManager.hasToken()) {
            try {
                console.log("🔄 令牌已过期，尝试刷新...");
                return await this.refreshToken();
            } catch (error) {
                // 刷新失败，执行重新认证
                console.warn("令牌刷新失败，执行重新认证:", error.message);
            }
        }

        // 执行重新认证
        console.log("🔐 执行重新认证...");
        const authResult = await this.login();
        return authResult.accessToken;
    }

    /**
     * 登出并清除令牌
     */
    async logout(): Promise<void> {
        this.tokenManager.clearToken();
    }

    /**
     * 检查当前是否已认证
     */
    isAuthenticated(): boolean {
        return this.tokenManager.hasValidToken();
    }

    /**
     * 获取当前用户信息（如果已认证）
     */
    getCurrentUser(): any | null {
        // 这里可以从令牌中解析用户信息，或者缓存登录时的用户信息
        // 暂时返回null，后续可以扩展
        return null;
    }

    /**
     * 获取令牌状态信息（用于调试和监控）
     */
    getTokenStatus(): {
        hasToken: boolean;
        isValid: boolean;
        isExpired: boolean;
        isNearExpiry: boolean;
        remainingTime: number;
        expiresAt: Date | null;
    } {
        return this.tokenManager.getTokenStatus();
    }

    /**
     * 强制刷新令牌（即使当前令牌仍然有效）
     */
    async forceRefreshToken(): Promise<string> {
        try {
            const newToken = await this.refreshToken();
            console.log("✅ 强制刷新令牌成功");
            return newToken;
        } catch (error) {
            console.warn("强制刷新失败，执行重新认证:", error.message);
            const authResult = await this.login();
            return authResult.accessToken;
        }
    }

    /**
     * 预热认证（确保有有效令牌）
     */
    async warmupAuthentication(): Promise<void> {
        try {
            await this.getValidToken();
            console.log("✅ 认证预热完成");
        } catch (error) {
            throw new Error(`认证预热失败: ${error.message}`);
        }
    }

    /**
     * 销毁认证管理器，清理所有资源
     */
    destroy(): void {
        this.tokenManager.clearToken();
        if (this.apiClient && typeof this.apiClient.destroy === "function") {
            this.apiClient.destroy();
        }
    }
}

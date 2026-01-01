/**
 * 令牌管理器 - 处理JWT令牌的存储、缓存和过期检测
 */
export class TokenManager {
    private currentToken: string | null = null;
    private tokenExpiresAt: Date | null = null;
    private readonly TOKEN_BUFFER_TIME = 5 * 60 * 1000; // 5分钟缓冲时间

    /**
     * 存储令牌和过期时间
     */
    storeToken(token: string, expiresAt: Date): void {
        this.currentToken = token;
        this.tokenExpiresAt = expiresAt;
    }

    /**
     * 获取当前存储的令牌（不检查过期）
     */
    getCurrentToken(): string | null {
        return this.currentToken;
    }

    /**
     * 检查令牌是否存在
     */
    hasToken(): boolean {
        return this.currentToken !== null;
    }

    /**
     * 检查令牌是否有效（存在且未过期）
     */
    hasValidToken(): boolean {
        if (!this.currentToken || !this.tokenExpiresAt) {
            return false;
        }

        return !this.isTokenExpired();
    }

    /**
     * 获取有效的令牌，如果过期则返回null
     */
    getValidToken(): string | null {
        if (!this.hasValidToken()) {
            return null;
        }

        return this.currentToken;
    }

    /**
     * 检查令牌是否即将过期（在缓冲时间内）
     */
    isTokenNearExpiry(): boolean {
        if (!this.tokenExpiresAt) {
            return true;
        }

        const now = new Date();
        const timeUntilExpiry = this.tokenExpiresAt.getTime() - now.getTime();

        return timeUntilExpiry <= this.TOKEN_BUFFER_TIME;
    }

    /**
     * 检查令牌是否已过期
     */
    isTokenExpired(): boolean {
        if (!this.tokenExpiresAt) {
            return true;
        }

        const now = new Date();
        return now >= this.tokenExpiresAt;
    }

    /**
     * 清除存储的令牌
     */
    clearToken(): void {
        this.currentToken = null;
        this.tokenExpiresAt = null;
    }

    /**
     * 获取令牌剩余有效时间（毫秒）
     */
    getTokenRemainingTime(): number {
        if (!this.tokenExpiresAt) {
            return 0;
        }

        const now = new Date();
        const remaining = this.tokenExpiresAt.getTime() - now.getTime();

        return Math.max(0, remaining);
    }

    /**
     * 获取令牌状态信息
     */
    getTokenStatus(): {
        hasToken: boolean;
        isValid: boolean;
        isExpired: boolean;
        isNearExpiry: boolean;
        remainingTime: number;
        expiresAt: Date | null;
    } {
        return {
            hasToken: this.hasToken(),
            isValid: this.hasValidToken(),
            isExpired: this.isTokenExpired(),
            isNearExpiry: this.isTokenNearExpiry(),
            remainingTime: this.getTokenRemainingTime(),
            expiresAt: this.tokenExpiresAt,
        };
    }

    /**
     * 从JWT令牌中解析过期时间
     * 注意：这是一个简单的实现，实际项目中可能需要使用jwt库
     */
    private parseTokenExpiry(token: string): Date | null {
        try {
            // 移除 "Bearer " 前缀
            const cleanToken = token.replace("Bearer ", "");

            // 简单的JWT解析（仅用于获取过期时间）
            const parts = cleanToken.split(".");
            if (parts.length !== 3) {
                return null;
            }

            const payload = JSON.parse(atob(parts[1]));

            if (payload.exp) {
                return new Date(payload.exp * 1000);
            }

            return null;
        } catch (error) {
            console.warn("解析令牌过期时间失败:", error.message);
            return null;
        }
    }

    /**
     * 自动从令牌中解析并设置过期时间
     */
    storeTokenWithAutoParsing(token: string): void {
        const expiresAt = this.parseTokenExpiry(token);

        if (expiresAt) {
            this.storeToken(token, expiresAt);
        } else {
            // 如果无法解析过期时间，使用默认的24小时
            const defaultExpiry = new Date();
            defaultExpiry.setHours(defaultExpiry.getHours() + 24);
            this.storeToken(token, defaultExpiry);
        }
    }
}

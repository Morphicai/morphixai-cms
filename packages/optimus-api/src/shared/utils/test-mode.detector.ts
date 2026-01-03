/**
 * 测试模式检测工具
 * 提供静态方法来检测和管理测试模式状态
 */
export class TestModeDetector {
    private static _isTestMode: boolean | null = null;
    private static _testModeConfig: any = null;

    /**
     * 检测是否为测试模式
     */
    static isTestMode(): boolean {
        if (this._isTestMode === null) {
            this._isTestMode = process.env.NODE_ENV === "e2e" || process.env.TEST_MODE === "true";
        }
        return this._isTestMode;
    }

    /**
     * 强制设置测试模式（主要用于测试）
     */
    static setTestMode(enabled: boolean): void {
        this._isTestMode = enabled;
        if (enabled) {
            process.env.NODE_ENV = "e2e";
            process.env.TEST_MODE = "true";
        }
    }

    /**
     * 检测是否应该绕过验证码
     */
    static shouldBypassCaptcha(): boolean {
        return this.isTestMode() && process.env.BYPASS_CAPTCHA === "true";
    }

    /**
     * 检测是否为开发环境
     */
    static isDevelopment(): boolean {
        return process.env.NODE_ENV === "development";
    }

    /**
     * 检测是否为生产环境
     */
    static isProduction(): boolean {
        return process.env.NODE_ENV === "production";
    }

    /**
     * 获取当前环境名称
     */
    static getEnvironment(): string {
        return process.env.NODE_ENV || "development";
    }

    /**
     * 初始化测试模式配置
     */
    static initializeTestMode(): void {
        if (this.isTestMode()) {
            // 设置测试模式特定的环境变量
            if (!process.env.BYPASS_CAPTCHA) {
                process.env.BYPASS_CAPTCHA = "true";
            }

            // 确保使用测试数据库
            if (
                process.env.DB_DATABASE &&
                !process.env.DB_DATABASE.includes("test") &&
                !process.env.DB_DATABASE.includes("e2e")
            ) {
                console.warn("⚠️  Warning: Not using a test database in e2e mode");
            }

            // 设置测试模式标识
            process.env.TEST_MODE = "true";

            console.log("🧪 E2E test mode initialized");
        }
    }

    /**
     * 重置测试模式状态（主要用于测试清理）
     */
    static reset(): void {
        this._isTestMode = null;
        this._testModeConfig = null;
    }

    /**
     * 获取测试模式配置摘要
     */
    static getTestModeInfo(): {
        isTestMode: boolean;
        environment: string;
        bypassCaptcha: boolean;
        testDatabase: string | undefined;
    } {
        return {
            isTestMode: this.isTestMode(),
            environment: this.getEnvironment(),
            bypassCaptcha: this.shouldBypassCaptcha(),
            testDatabase: process.env.DB_DATABASE,
        };
    }

    /**
     * 验证测试环境设置
     */
    static validateTestEnvironment(): { valid: boolean; warnings: string[] } {
        const warnings: string[] = [];

        if (!this.isTestMode()) {
            return { valid: true, warnings: [] };
        }

        // 检查端口配置
        if (process.env.APP_PORT === "8084") {
            warnings.push("Using production port in e2e mode, consider using a different port");
        }

        // 检查JWT密钥（检查是否使用了默认值或生产环境密钥）
        const jwtSecret = process.env.JWT_SECRET;
        if (
            jwtSecret &&
            (jwtSecret.includes("production") ||
                jwtSecret.length < 32 ||
                jwtSecret === "your_jwt_secret_key_change_in_production")
        ) {
            warnings.push("JWT secret may not be properly configured for e2e mode");
        }

        return {
            valid: warnings.length === 0,
            warnings,
        };
    }
}

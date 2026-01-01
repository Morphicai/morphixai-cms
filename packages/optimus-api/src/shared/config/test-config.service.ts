import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface TestModeConfig {
    enabled: boolean;
    bypassCaptcha: boolean;
    useTestDatabase: boolean;
    testUser: {
        account: string;
        password: string;
    };
    testAdmin: {
        account: string;
        password: string;
    };
    apiTest: {
        timeout: number;
        retries: number;
        baseUrl: string;
    };
}

@Injectable()
export class TestConfigService {
    constructor(private configService: ConfigService) {}

    /**
     * 检测是否为测试模式
     */
    isTestMode(): boolean {
        return process.env.NODE_ENV === "e2e" || process.env.TEST_MODE === "true";
    }

    /**
     * 检测是否应该绕过验证码
     */
    shouldBypassCaptcha(): boolean {
        if (!this.isTestMode()) {
            return false;
        }
        return process.env.BYPASS_CAPTCHA === "true";
    }

    /**
     * 获取测试模式配置
     */
    getTestModeConfig(): TestModeConfig {
        return {
            enabled: this.isTestMode(),
            bypassCaptcha: this.shouldBypassCaptcha(),
            useTestDatabase: this.isTestMode(),
            testUser: {
                account: process.env.TEST_USER_ACCOUNT || "user",
                password: process.env.TEST_USER_PASSWORD || "admin",
            },
            testAdmin: {
                account: process.env.TEST_ADMIN_ACCOUNT || "admin",
                password: process.env.TEST_ADMIN_PASSWORD || "admin",
            },
            apiTest: {
                timeout: parseInt(process.env.API_TEST_TIMEOUT || "30000", 10),
                retries: parseInt(process.env.API_TEST_RETRIES || "3", 10),
                baseUrl: process.env.API_TEST_BASE_URL || "http://localhost:8082",
            },
        };
    }

    /**
     * 获取存储配置
     */
    getStorageConfig(): {
        provider: string;
        useMemoryStorage: boolean;
    } {
        return {
            provider: process.env.STORAGE_PROVIDER || "memory",
            useMemoryStorage: this.isTestMode() && process.env.STORAGE_PROVIDER === "memory",
        };
    }

    /**
     * 获取测试用户凭据
     */
    getTestUserCredentials(): { account: string; password: string } {
        const config = this.getTestModeConfig();
        return config.testUser;
    }

    /**
     * 获取测试管理员凭据
     */
    getTestAdminCredentials(): { account: string; password: string } {
        const config = this.getTestModeConfig();
        return config.testAdmin;
    }

    /**
     * 获取API测试配置
     */
    getApiTestConfig(): { timeout: number; retries: number; baseUrl: string } {
        const config = this.getTestModeConfig();
        return config.apiTest;
    }

    /**
     * 检查是否使用测试数据库
     */
    shouldUseTestDatabase(): boolean {
        return this.isTestMode();
    }

    /**
     * 获取测试数据库配置
     */
    getTestDatabaseConfig() {
        if (!this.isTestMode()) {
            return null;
        }

        return {
            host: process.env.DB_HOST || "localhost",
            port: parseInt(process.env.DB_PORT || "3306", 10),
            username: process.env.DB_USERNAME || "root",
            password: process.env.DB_PASSWORD || "123456",
            database: process.env.DB_DATABASE || "kapok_e2e",
            charset: process.env.DB_CHARSET || "utf8mb4",
            logging: process.env.DB_LOGGING === "true",
            synchronize: process.env.DB_SYNCHRONIZE === "true",
        };
    }

    /**
     * 验证测试环境配置
     */
    validateTestEnvironment(): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!this.isTestMode()) {
            return { valid: true, errors: [] };
        }

        // 检查必需的环境变量
        const requiredEnvVars = [
            "DB_HOST",
            "DB_USERNAME",
            "DB_PASSWORD",
            "DB_DATABASE",
            "TEST_USER_ACCOUNT",
            "TEST_USER_PASSWORD",
        ];

        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                errors.push(`Missing required environment variable: ${envVar}`);
            }
        }

        // 记录数据库配置信息
        const dbConfig = this.getTestDatabaseConfig();
        if (dbConfig) {
            console.log(`E2E database: ${dbConfig.database}`);
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    /**
     * 记录测试模式状态
     */
    logTestModeStatus(): void {
        if (this.isTestMode()) {
            console.log("🧪 E2E test mode enabled");
            console.log(`📋 Bypass captcha: ${this.shouldBypassCaptcha()}`);
            console.log(`🗄️  Test database: ${this.getTestDatabaseConfig()?.database}`);

            const validation = this.validateTestEnvironment();
            if (!validation.valid) {
                console.warn("⚠️  E2E test environment validation failed:");
                validation.errors.forEach((error) => console.warn(`   - ${error}`));
            } else {
                console.log("✅ E2E test environment validation passed");
            }
        }
    }
}

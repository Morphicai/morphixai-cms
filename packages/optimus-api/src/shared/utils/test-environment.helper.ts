import { TestModeDetector } from "./test-mode.detector";

export interface TestEnvironmentInfo {
    isTestMode: boolean;
    environment: string;
    databaseConfig: {
        type: string;
        database: string;
        inMemory: boolean;
    };
    storageConfig: {
        provider: string;
        useMemoryStorage: boolean;
    };
    apiConfig: {
        baseUrl: string;
        port: number;
        timeout: number;
    };
    authConfig: {
        bypassCaptcha: boolean;
        testUser: string;
        testAdmin: string;
    };
}

export class TestEnvironmentHelper {
    /**
     * 获取完整的测试环境信息
     */
    static getEnvironmentInfo(): TestEnvironmentInfo {
        return {
            isTestMode: TestModeDetector.isTestMode(),
            environment: TestModeDetector.getEnvironment(),
            databaseConfig: {
                type: process.env.DB_TYPE || "mysql",
                database: process.env.DB_DATABASE || "kapok_e2e",
                inMemory: false,
            },
            storageConfig: {
                provider: process.env.STORAGE_PROVIDER || "memory",
                useMemoryStorage: process.env.STORAGE_PROVIDER === "memory",
            },
            apiConfig: {
                baseUrl: process.env.API_TEST_BASE_URL || "http://localhost:8082",
                port: parseInt(process.env.APP_PORT || "8084", 10),
                timeout: parseInt(process.env.API_TEST_TIMEOUT || "30000", 10),
            },
            authConfig: {
                bypassCaptcha: TestModeDetector.shouldBypassCaptcha(),
                testUser: process.env.TEST_USER_ACCOUNT || "testuser",
                testAdmin: process.env.TEST_ADMIN_ACCOUNT || "testadmin",
            },
        };
    }

    /**
     * 验证测试环境是否正确配置
     */
    static validateEnvironment(): { valid: boolean; errors: string[]; warnings: string[] } {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!TestModeDetector.isTestMode()) {
            return { valid: true, errors: [], warnings: [] };
        }

        const info = this.getEnvironmentInfo();

        // 记录数据库配置信息
        if (info.databaseConfig.type === "mysql") {
            console.log(`E2E database configuration: ${info.databaseConfig.database}`);
        }

        // 检查存储配置
        if (!info.storageConfig.useMemoryStorage && info.isTestMode) {
            warnings.push("Not using memory storage in e2e mode, external dependencies required");
        }

        // 检查端口配置
        if (info.apiConfig.port === 8084) {
            warnings.push("Using production port (8084) in e2e mode");
        }

        // 检查必需的环境变量
        const requiredVars = ["TEST_USER_ACCOUNT", "TEST_USER_PASSWORD", "DB_HOST", "DB_USERNAME", "DB_PASSWORD"];

        for (const varName of requiredVars) {
            if (!process.env[varName]) {
                errors.push(`Missing required environment variable: ${varName}`);
            }
        }

        // 检查验证码绕过配置
        if (!info.authConfig.bypassCaptcha) {
            warnings.push("Captcha bypass is not enabled in e2e mode");
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }

    /**
     * 打印环境信息到控制台
     */
    static printEnvironmentInfo(): void {
        const info = this.getEnvironmentInfo();
        const validation = this.validateEnvironment();

        console.log("\n🧪 E2E Test Environment Configuration:");
        console.log(`   Mode: ${info.environment}`);
        console.log(`   Test Mode: ${info.isTestMode ? "✅" : "❌"}`);
        console.log(`   Database: ${info.databaseConfig.type} (${info.databaseConfig.database})`);
        console.log(`   In-Memory DB: ${info.databaseConfig.inMemory ? "✅" : "❌"}`);
        console.log(`   Storage: ${info.storageConfig.provider}`);
        console.log(`   Memory Storage: ${info.storageConfig.useMemoryStorage ? "✅" : "❌"}`);
        console.log(`   API URL: ${info.apiConfig.baseUrl}`);
        console.log(`   Bypass Captcha: ${info.authConfig.bypassCaptcha ? "✅" : "❌"}`);
        console.log(`   Test User: ${info.authConfig.testUser}`);

        if (validation.errors.length > 0) {
            console.log("\n❌ Configuration Errors:");
            validation.errors.forEach((error) => console.log(`   - ${error}`));
        }

        if (validation.warnings.length > 0) {
            console.log("\n⚠️  Configuration Warnings:");
            validation.warnings.forEach((warning) => console.log(`   - ${warning}`));
        }

        if (validation.valid && validation.warnings.length === 0) {
            console.log("\n✅ E2E test environment is properly configured");
        }
    }

    /**
     * 等待服务启动
     */
    static async waitForService(url: string, maxAttempts = 30, interval = 1000): Promise<boolean> {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    return true;
                }
            } catch (error) {
                // Service not ready yet
            }

            await new Promise((resolve) => setTimeout(resolve, interval));
        }

        return false;
    }

    /**
     * 设置测试环境变量
     */
    static setupTestEnvironment(): void {
        if (!TestModeDetector.isTestMode()) {
            return;
        }

        // 确保关键的测试环境变量被设置
        const defaultTestVars = {
            NODE_ENV: "e2e",
            TEST_MODE: "true",
            BYPASS_CAPTCHA: "true",
            DB_LOGGING: "false",
            DB_SYNCHRONIZE: "true",
        };

        for (const [key, value] of Object.entries(defaultTestVars)) {
            if (!process.env[key]) {
                process.env[key] = value;
            }
        }

        console.log("🔧 E2E test environment variables configured");
    }
}

import { TestModeDetector } from "../src/shared/utils/test-mode.detector";
import { StorageTestHelper } from "../src/system/oss/test-helpers/storage-test.helper";
import { ServerProcessHelper } from "./utils/server-process.helper";
import { DatabaseTestHelper } from "./utils/database-test.helper";
import { cleanupAllClients } from "./auth";
import { CleanupHelper, setupGlobalCleanup } from "./utils/cleanup.helper";
import { HttpClientHelper } from "./utils/http-client.helper";
import * as dotenv from "dotenv";
import { join } from "path";

// Load test environment variables
// .env.e2e is located at the project root
// Try multiple possible paths to find .env.e2e
const possiblePaths = [
    join(__dirname, "../../.env.e2e"), // From test/ to root
    join(__dirname, "../../../.env.e2e"), // Alternative path
    join(process.cwd(), ".env.e2e"), // From current working directory
    join(process.cwd(), "../.env.e2e"), // From packages/optimus-api to root
    join(process.cwd(), "../../.env.e2e"), // Alternative
];

let testEnvPath: string | null = null;
for (const path of possiblePaths) {
    try {
        const fs = require("fs");
        if (fs.existsSync(path)) {
            testEnvPath = path;
            break;
        }
    } catch (e) {
        // Continue to next path
    }
}

if (!testEnvPath) {
    console.error(`❌ Error: .env.e2e file not found. Tried paths:`, possiblePaths);
    throw new Error("Failed to locate .env.e2e file. Please ensure it exists at the project root.");
}

const result = dotenv.config({ path: testEnvPath });
if (result.error) {
    console.error(`❌ Error: Failed to load .env.e2e from ${testEnvPath}:`, result.error.message);
    throw result.error;
} else if (result.parsed) {
    console.log(`✅ Loaded ${Object.keys(result.parsed).length} environment variables from .env.e2e (${testEnvPath})`);
} else {
    console.warn(`⚠️  Warning: .env.e2e file found but no variables were loaded from ${testEnvPath}`);
}

// Global instances
let serverProcess: ServerProcessHelper | null = null;
let databaseHelper: DatabaseTestHelper | null = null;
let storageHelper: StorageTestHelper | null = null;
const globalApiClients: Set<any> = new Set();

// 设置全局清理钩子
setupGlobalCleanup();

// Global test setup
beforeAll(async () => {
    console.log("🚀 Starting global test setup...");

    // Initialize test mode
    TestModeDetector.initializeTestMode();

    // Validate test environment
    const validation = TestModeDetector.validateTestEnvironment();
    if (!validation.valid) {
        console.warn("⚠️  Test environment validation warnings:");
        validation.warnings.forEach((warning) => console.warn(`   - ${warning}`));
    }

    // Log test mode status
    const testInfo = TestModeDetector.getTestModeInfo();
    console.log("🧪 Test Environment Info:", testInfo);

    // 1. 检查数据库连接
    console.log("📊 Checking database connection...");
    databaseHelper = new DatabaseTestHelper();
    try {
        await databaseHelper.checkConnection();
        console.log("✅ Database connection verified");
    } catch (error) {
        console.error("❌ Database connection failed:", error.message);
        throw error;
    }

    // 2. 检查OSS连接
    console.log("📦 Checking OSS connection...");
    storageHelper = StorageTestHelper.getInstance();
    try {
        await storageHelper.start();
        const stats = await storageHelper.getStats();
        console.log("✅ OSS connection verified:", stats);
    } catch (error) {
        console.warn("⚠️  OSS setup warning:", error.message);
        // OSS 连接失败不阻止测试继续
    }

    // Ensure MySQL test database configuration
    if (!process.env.DB_TYPE) {
        process.env.DB_TYPE = "mysql";
        process.env.DB_DATABASE = process.env.DB_DATABASE || "optimus_e2e";
    }

    // 3. 启动服务器
    console.log("🌐 Starting test server...");
    try {
        const port = parseInt(process.env.APP_PORT || "8081", 10);
        console.log(`🔧 Configured port: ${port}`);
        console.log(`🔧 Environment APP_PORT: ${process.env.APP_PORT}`);

        serverProcess = new ServerProcessHelper({
            command: "npm",
            args: ["run", "start:e2e"],
            cwd: join(__dirname, ".."),
            port,
            env: {
                NODE_ENV: "e2e",
                APP_PORT: port.toString(), // 确保端口传递给子进程
                ...process.env,
            },
            startupTimeout: 90000, // 90秒启动超时
            shutdownTimeout: 15000, // 15秒关闭超时
        });

        await serverProcess.start();

        // 等待服务器健康检查
        await serverProcess.waitForHealth("/api", 30000);

        console.log(`✅ Test server running at ${serverProcess.getServerUrl()}`);
    } catch (error) {
        console.error("❌ Failed to start test server:", error.message);
        throw error;
    }

    console.log("🎉 Global test setup complete - Ready for testing!");
}, 120000); // 120秒总超时

// Global test teardown
afterAll(async () => {
    console.log("🧹 Starting global test cleanup...");

    // Clean up all registered API clients
    try {
        cleanupAllClients();
        console.log("🧹 API clients cleaned up");
    } catch (error) {
        console.warn("⚠️  API client cleanup warning:", error.message);
    }

    // Stop server process
    if (serverProcess) {
        try {
            await serverProcess.stop();
            console.log("🛑 Test server stopped");
        } catch (error) {
            console.error("❌ Error stopping test server:", error.message);
        }
        serverProcess = null;
    }

    // Clean up storage (but keep data for debugging)
    if (storageHelper) {
        try {
            await storageHelper.stop();
            console.log("📦 Storage service stopped");
        } catch (error) {
            console.warn("⚠️  Storage cleanup warning:", error.message);
        }
    }

    // 保留数据库数据，不进行清理
    if (databaseHelper) {
        try {
            await databaseHelper.disconnect();
            console.log("📊 Database connection closed (data preserved)");
        } catch (error) {
            console.warn("⚠️  Database cleanup warning:", error.message);
        }
    }

    // Clean up test mode
    TestModeDetector.reset();

    // 清理HTTP客户端连接
    try {
        HttpClientHelper.reset();
        console.log("🧹 HTTP connections cleaned up");
    } catch (error) {
        console.warn("⚠️  HTTP client cleanup warning:", error.message);
    }

    // 执行全面的资源清理
    await CleanupHelper.cleanupAll();

    console.log("✅ Global test cleanup complete (database data preserved)");
}, 30000); // 30秒清理超时

// Increase timeout for integration tests
jest.setTimeout(60000);

/**
 * 获取测试服务器实例
 * 供测试文件使用
 */
export function getTestServer(): ServerProcessHelper | null {
    return serverProcess;
}

/**
 * 获取测试服务器 URL
 */
export function getTestServerUrl(): string {
    if (!serverProcess) {
        throw new Error("Test server is not running");
    }
    return serverProcess.getServerUrl();
}

/**
 * 获取数据库测试助手实例
 */
export function getDatabaseHelper(): DatabaseTestHelper | null {
    return databaseHelper;
}

/**
 * 获取存储测试助手实例
 */
export function getStorageHelper(): StorageTestHelper | null {
    return storageHelper;
}

/**
 * 等待服务器就绪
 * 用于测试开始前确保服务器可用
 */
export async function waitForTestServer(timeout = 15000): Promise<void> {
    if (!serverProcess) {
        throw new Error("Test server is not initialized");
    }

    if (!serverProcess.isRunning()) {
        throw new Error("Test server is not running");
    }

    await serverProcess.waitForHealth("/api", timeout);
}

/**
 * 重置数据库到初始状态（可选，用于特定测试）
 * 注意：种子数据由应用程序自动处理，此方法仅清空数据库
 */
export async function resetDatabase(): Promise<void> {
    if (!databaseHelper) {
        throw new Error("Database helper is not initialized");
    }

    await databaseHelper.cleanDatabase();
}

/**
 * 获取数据库统计信息
 */
export async function getDatabaseStats(): Promise<any> {
    if (!databaseHelper) {
        throw new Error("Database helper is not initialized");
    }

    return await databaseHelper.getDatabaseStats();
}

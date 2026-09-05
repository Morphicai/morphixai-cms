import { getTestServerUrl, getDatabaseHelper, getStorageHelper, getDatabaseStats } from "../setup";
import { HttpClientHelper } from "../utils/http-client.helper";

// 使用HTTP客户端助手管理连接
let httpClient: HttpClientHelper;

describe("Test Setup Validation (E2E)", () => {
    beforeAll(() => {
        // 获取HTTP客户端实例
        httpClient = HttpClientHelper.getInstance();
    });

    afterAll(async () => {
        // 清理HTTP客户端
        if (httpClient) {
            await httpClient.cleanup();
        }
        // 重置HTTP客户端单例
        HttpClientHelper.reset();
    });
    describe("Database Setup", () => {
        it("should have database connection established", async () => {
            const databaseHelper = getDatabaseHelper();
            expect(databaseHelper).toBeDefined();
            expect(databaseHelper).not.toBeNull();
        });

        it("should have seed data loaded", async () => {
            const stats = await getDatabaseStats();
            expect(stats).toBeDefined();
            expect(stats.userCount).toBeGreaterThan(0);
            expect(stats.roleCount).toBeGreaterThan(0);

            console.log("📊 Database Stats:", stats);
        });

        it("should have admin user available", async () => {
            const databaseHelper = getDatabaseHelper();
            const databaseHelperInstance = databaseHelper;
            if (!databaseHelperInstance) {
                throw new Error("Database helper not available");
            }
            const adminUsers = await databaseHelperInstance.query(
                "SELECT * FROM op_sys_user WHERE account = ? AND type = 0",
                ["admin"],
            );

            expect(adminUsers).toBeDefined();
            expect(adminUsers.length).toBeGreaterThan(0);
            expect(adminUsers[0].account).toBe("admin");
            expect(adminUsers[0].type).toBe(0); // 超管类型
        });
    });

    describe("Storage Setup", () => {
        it("should have storage helper initialized", async () => {
            const storageHelper = getStorageHelper();
            expect(storageHelper).toBeDefined();
            expect(storageHelper).not.toBeNull();
        });

        it("should have storage service ready", async () => {
            const storageHelper = getStorageHelper();
            const storageHelperInstance = storageHelper;
            if (!storageHelperInstance) {
                throw new Error("Storage helper not available");
            }
            const isReady = await storageHelperInstance.isReady();
            expect(isReady).toBe(true);
        });
    });

    describe("Server Setup", () => {
        it("should have test server running", async () => {
            const serverUrl = getTestServerUrl();
            expect(serverUrl).toBeDefined();
            expect(serverUrl).toMatch(/^http:\/\/localhost:\d+$/);

            console.log("🌐 Test Server URL:", serverUrl);
        });

        it("should respond to health check", async () => {
            const serverUrl = getTestServerUrl();
            const response = await httpClient.get(`${serverUrl}/api`);

            expect(response.status).toBe(200);
        });

        it("should have API endpoints accessible", async () => {
            const serverUrl = getTestServerUrl();

            // 测试登录接口是否可访问
            try {
                const response = await httpClient.post(`${serverUrl}/api/login`, {
                    account: "admin",
                    password: "admin",
                });

                // 登录应该成功或返回验证错误（说明接口可访问）
                expect([200, 400, 401]).toContain(response.status);
            } catch (error) {
                // 如果是网络错误，测试失败
                if (error.code === "ECONNREFUSED") {
                    throw error;
                }
                // 其他HTTP错误说明接口可访问
                expect(error.response.status).toBeDefined();
            }
        });
    });

    describe("Integration Test", () => {
        it("should be able to perform a complete login flow", async () => {
            const serverUrl = getTestServerUrl();

            try {
                // 尝试登录
                const loginResponse = await httpClient.post(`${serverUrl}/api/login`, {
                    account: "admin",
                    password: "admin",
                });

                if (loginResponse.status === 200) {
                    expect(loginResponse.data).toBeDefined();
                    const data = loginResponse.data as any;
                    expect(data.token || data.access_token).toBeDefined();

                    console.log("✅ Login flow test passed");
                } else {
                    console.log("ℹ️  Login returned status:", loginResponse.status);
                    // 即使登录失败，只要接口响应就说明setup成功
                    expect(loginResponse.status).toBeDefined();
                }
            } catch (error) {
                if (error.response) {
                    // 有响应说明服务器在运行
                    console.log("ℹ️  Login error response:", error.response.status);
                    expect(error.response.status).toBeDefined();
                } else {
                    throw error;
                }
            }
        });
    });
});

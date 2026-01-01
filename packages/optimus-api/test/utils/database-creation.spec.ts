import { DatabaseTestHelper } from "./database-test.helper";

describe("Database Creation Safety", () => {
    let databaseHelper: DatabaseTestHelper;

    beforeEach(() => {
        databaseHelper = new DatabaseTestHelper();
    });

    afterEach(async () => {
        if (databaseHelper) {
            await databaseHelper.disconnect();
        }
    });

    describe("E2E Database Auto-Creation", () => {
        it("should create database when name ends with _e2e", async () => {
            // 设置测试环境
            const originalEnv = process.env.NODE_ENV;
            const originalDb = process.env.DB_DATABASE;

            try {
                process.env.NODE_ENV = "e2e";
                process.env.DB_DATABASE = "test_auto_create_e2e";

                // 这应该成功创建数据库
                await expect(databaseHelper.checkConnection()).resolves.not.toThrow();
            } finally {
                // 恢复环境变量
                process.env.NODE_ENV = originalEnv;
                process.env.DB_DATABASE = originalDb;
            }
        });

        it("should reject database creation when name does not end with _e2e", async () => {
            const originalEnv = process.env.NODE_ENV;
            const originalDb = process.env.DB_DATABASE;

            try {
                process.env.NODE_ENV = "e2e";
                process.env.DB_DATABASE = "test_invalid_name"; // 不以 _e2e 结尾

                // 这应该失败
                await expect(databaseHelper.checkConnection()).rejects.toThrow(/must end with '_e2e'/);
            } finally {
                process.env.NODE_ENV = originalEnv;
                process.env.DB_DATABASE = originalDb;
            }
        });

        it("should reject database creation in non-e2e environments", async () => {
            const originalEnv = process.env.NODE_ENV;
            const originalDb = process.env.DB_DATABASE;

            try {
                // 测试生产环境
                process.env.NODE_ENV = "production";
                process.env.DB_DATABASE = "test_production_e2e";

                await expect(databaseHelper.checkConnection()).rejects.toThrow(/only allowed when NODE_ENV=e2e/);

                // 测试普通 test 环境 (也应该被拒绝)
                process.env.NODE_ENV = "test";
                process.env.DB_DATABASE = "test_regular_test_e2e";

                await expect(databaseHelper.checkConnection()).rejects.toThrow(/only allowed when NODE_ENV=e2e/);

                // 测试开发环境
                process.env.NODE_ENV = "development";
                process.env.DB_DATABASE = "test_development_e2e";

                await expect(databaseHelper.checkConnection()).rejects.toThrow(/only allowed when NODE_ENV=e2e/);
            } finally {
                process.env.NODE_ENV = originalEnv;
                process.env.DB_DATABASE = originalDb;
            }
        });

        it("should validate database name format", async () => {
            const originalEnv = process.env.NODE_ENV;
            const originalDb = process.env.DB_DATABASE;

            try {
                process.env.NODE_ENV = "e2e";

                // 测试无效字符
                process.env.DB_DATABASE = "test-invalid-chars_e2e"; // 包含连字符
                await expect(databaseHelper.checkConnection()).rejects.toThrow(
                    /can only contain letters, numbers, and underscores/,
                );

                // 测试名称太短
                process.env.DB_DATABASE = "a_e2e"; // 太短
                await expect(databaseHelper.checkConnection()).rejects.toThrow(
                    /length must be between 5 and 64 characters/,
                );
            } finally {
                process.env.NODE_ENV = originalEnv;
                process.env.DB_DATABASE = originalDb;
            }
        });
    });

    describe("Database Connection Safety", () => {
        it("should connect to existing E2E database without creation", async () => {
            const originalDb = process.env.DB_DATABASE;

            try {
                // 使用已存在的测试数据库
                process.env.DB_DATABASE = "kapok_e2e";

                // 这应该成功连接而不需要创建
                await expect(databaseHelper.checkConnection()).resolves.not.toThrow();
            } finally {
                process.env.DB_DATABASE = originalDb;
            }
        });
    });
});

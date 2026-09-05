import { createConnection, Connection } from "typeorm";
import * as fs from "fs";
import * as path from "path";

/**
 * 数据库测试助手
 * 提供数据库连接检查和种子数据初始化功能
 */
export class DatabaseTestHelper {
    private connection: Connection | null = null;

    /**
     * 检查数据库连接
     */
    async checkConnection(): Promise<void> {
        if (!process.env.DB_USERNAME) {
            throw new Error("DB_USERNAME environment variable is required");
        }
        if (!process.env.DB_PASSWORD) {
            throw new Error("DB_PASSWORD environment variable is required");
        }

        const dbName = process.env.DB_DATABASE || "optimus_e2e";

        try {
            // 首先尝试连接到目标数据库
            try {
                this.connection = await createConnection({
                    type: "mysql",
                    host: process.env.DB_HOST || "localhost",
                    port: parseInt(process.env.DB_PORT || "3306", 10),
                    username: process.env.DB_USERNAME,
                    password: process.env.DB_PASSWORD,
                    database: dbName,
                    charset: process.env.DB_CHARSET || "utf8mb4",
                    synchronize: false, // 不自动同步，使用种子数据
                    logging: process.env.DB_LOGGING === "true",
                    entities: [],
                    migrations: [],
                    subscribers: [],
                });

                // 测试连接
                await this.connection.query("SELECT 1");
                console.log(`📊 Connected to database: ${dbName}`);
            } catch (connectionError) {
                // 安全检查：只有数据库名以 _e2e 结尾时才尝试创建
                if (!dbName.endsWith("_e2e")) {
                    console.error(
                        `❌ Database '${dbName}' does not exist and cannot be auto-created (not an E2E database)`,
                    );
                    console.error(`   E2E databases must end with '_e2e' for safety`);
                    throw new Error(
                        `Database '${dbName}' not found. E2E databases must end with '_e2e' and will be auto-created.`,
                    );
                }

                // 额外安全检查：确保是 E2E 环境
                const nodeEnv = process.env.NODE_ENV;
                if (nodeEnv !== "e2e") {
                    console.error(`❌ Auto-creation of E2E database '${dbName}' is only allowed in E2E environment`);
                    console.error(`   Current NODE_ENV: ${nodeEnv}`);
                    console.error(`   Required NODE_ENV: e2e`);
                    throw new Error(`E2E database auto-creation is only allowed when NODE_ENV=e2e`);
                }

                console.log(`📝 E2E database '${dbName}' not found, attempting to create...`);
                console.log(`   Environment: ${nodeEnv}`);
                console.log(`   Safety check: Database name ends with '_e2e' ✅`);

                try {
                    await this.createE2EDatabase(dbName);

                    // 重新尝试连接
                    this.connection = await createConnection({
                        type: "mysql",
                        host: process.env.DB_HOST || "localhost",
                        port: parseInt(process.env.DB_PORT || "3306", 10),
                        username: process.env.DB_USERNAME,
                        password: process.env.DB_PASSWORD,
                        database: dbName,
                        charset: process.env.DB_CHARSET || "utf8mb4",
                        synchronize: false,
                        logging: process.env.DB_LOGGING === "true",
                        entities: [],
                        migrations: [],
                        subscribers: [],
                    });

                    await this.connection.query("SELECT 1");
                    console.log(`✅ E2E database '${dbName}' created and connected successfully`);
                } catch (createError) {
                    console.error(`❌ Failed to create E2E database '${dbName}':`, createError.message);
                    throw new Error(`Failed to create E2E database '${dbName}': ${createError.message}`);
                }
            }
        } catch (error) {
            throw new Error(`Database connection failed: ${error.message}`);
        }
    }

    /**
     * 创建 E2E 测试数据库
     * 安全限制：只能创建以 _e2e 结尾的数据库
     */
    private async createE2EDatabase(dbName: string): Promise<void> {
        // 双重安全检查：确保数据库名以 _e2e 结尾
        if (!dbName.endsWith("_e2e")) {
            throw new Error(`Security violation: Cannot create database '${dbName}' - must end with '_e2e'`);
        }

        // 检查数据库名长度和格式
        if (dbName.length < 5 || dbName.length > 64) {
            throw new Error(`Invalid database name '${dbName}': length must be between 5 and 64 characters`);
        }

        // 检查数据库名是否包含非法字符
        const validNamePattern = /^[a-zA-Z0-9_]+$/;
        if (!validNamePattern.test(dbName)) {
            throw new Error(`Invalid database name '${dbName}': can only contain letters, numbers, and underscores`);
        }

        let adminConnection: Connection | null = null;

        try {
            console.log(`🔐 Creating E2E database with safety checks:`);
            console.log(`   Database name: ${dbName}`);
            console.log(`   Ends with '_e2e': ✅`);
            console.log(`   Environment: ${process.env.NODE_ENV}`);

            // 连接到 MySQL 服务器（不指定数据库）
            adminConnection = await createConnection({
                type: "mysql",
                host: process.env.DB_HOST || "localhost",
                port: parseInt(process.env.DB_PORT || "3306", 10),
                username: process.env.DB_USERNAME,
                password: process.env.DB_PASSWORD,
                charset: process.env.DB_CHARSET || "utf8mb4",
                name: `admin-connection-${Date.now()}`, // 给连接一个唯一名称
            });

            // 检查数据库是否已存在
            const existingDbs = await adminConnection.query(`SHOW DATABASES LIKE '${dbName}'`);

            if (existingDbs.length > 0) {
                console.log(`ℹ️  E2E database '${dbName}' already exists, skipping creation`);
                return;
            }

            // 创建数据库
            await adminConnection.query(
                `CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`,
            );

            // 验证数据库创建成功
            const verifyDbs = await adminConnection.query(`SHOW DATABASES LIKE '${dbName}'`);

            if (verifyDbs.length === 0) {
                throw new Error(`Database creation verification failed: '${dbName}' not found after creation`);
            }

            console.log(`✅ E2E database '${dbName}' created successfully`);
        } catch (error) {
            console.error(`❌ Failed to create E2E database '${dbName}':`, error.message);
            throw new Error(`Failed to create E2E database '${dbName}': ${error.message}`);
        } finally {
            if (adminConnection && adminConnection.isConnected) {
                try {
                    await adminConnection.close();
                } catch (closeError) {
                    console.warn(`⚠️  Warning closing admin connection: ${closeError.message}`);
                }
            }
        }
    }

    /**
     * 使用种子数据初始化数据库
     */
    async initializeWithSeedData(seedFilePath: string): Promise<void> {
        if (!this.connection) {
            throw new Error("Database connection not established");
        }

        if (!fs.existsSync(seedFilePath)) {
            throw new Error(`Seed file not found: ${seedFilePath}`);
        }

        try {
            console.log(`🌱 Loading seed data from: ${seedFilePath}`);

            // 读取SQL文件
            const sqlContent = fs.readFileSync(seedFilePath, "utf8");

            // 分割SQL语句（简单的分割，基于分号和换行）
            const statements = this.splitSqlStatements(sqlContent);

            console.log(`📝 Executing ${statements.length} SQL statements...`);

            // 禁用外键检查
            await this.connection.query("SET FOREIGN_KEY_CHECKS = 0");

            // 执行每个SQL语句
            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i].trim();
                if (statement && !statement.startsWith("--") && !statement.startsWith("/*")) {
                    try {
                        await this.connection.query(statement);
                        if (statement.toLowerCase().includes("insert into op_sys_user")) {
                            console.log(`✅ Executed user insert statement ${i + 1}`);
                        }
                    } catch (error) {
                        console.warn(`⚠️  Warning executing statement ${i + 1}: ${error.message}`);
                        // 继续执行其他语句，某些语句可能因为表已存在等原因失败
                    }
                }
            }

            // 重新启用外键检查
            await this.connection.query("SET FOREIGN_KEY_CHECKS = 1");

            // 验证数据是否正确加载
            await this.validateSeedData();

            console.log("✅ Seed data loaded successfully");
        } catch (error) {
            throw new Error(`Failed to initialize database with seed data: ${error.message}`);
        }
    }

    /**
     * 分割SQL语句
     */
    private splitSqlStatements(sqlContent: string): string[] {
        // 移除注释
        const cleanSql = sqlContent
            .replace(/\/\*[\s\S]*?\*\//g, "") // 移除 /* */ 注释
            .replace(/--.*$/gm, ""); // 移除 -- 注释

        // 按分号分割，但要考虑字符串中的分号
        const statements: string[] = [];
        let currentStatement = "";
        let inString = false;
        let stringChar = "";

        for (let i = 0; i < cleanSql.length; i++) {
            const char = cleanSql[i];
            const prevChar = i > 0 ? cleanSql[i - 1] : "";

            if (!inString && (char === '"' || char === "'")) {
                inString = true;
                stringChar = char;
            } else if (inString && char === stringChar && prevChar !== "\\") {
                inString = false;
                stringChar = "";
            }

            if (!inString && char === ";") {
                const statement = currentStatement.trim();
                if (statement) {
                    statements.push(statement);
                }
                currentStatement = "";
            } else {
                currentStatement += char;
            }
        }

        // 添加最后一个语句（如果有）
        const lastStatement = currentStatement.trim();
        if (lastStatement) {
            statements.push(lastStatement);
        }

        return statements.filter((stmt) => stmt.length > 0);
    }

    /**
     * 验证种子数据是否正确加载
     */
    private async validateSeedData(): Promise<void> {
        if (!this.connection) {
            throw new Error("Database connection not established");
        }

        try {
            // 检查关键表是否存在并有数据
            const userCount = await this.connection.query("SELECT COUNT(*) as count FROM op_sys_user");
            const roleCount = await this.connection.query("SELECT COUNT(*) as count FROM op_sys_role");

            console.log(`📊 Seed data validation:`);
            console.log(`   - Users: ${userCount[0].count}`);
            console.log(`   - Roles: ${roleCount[0].count}`);

            // 调试：检查admin用户详情
            const adminUsers = await this.connection.query(
                "SELECT id, account, status, is_deleted FROM op_sys_user WHERE account = ?",
                ["admin"],
            );
            console.log("🔍 [DEBUG] Admin用户详情:", adminUsers);

            if (userCount[0].count === 0) {
                throw new Error("No users found in seed data");
            }

            if (roleCount[0].count === 0) {
                throw new Error("No roles found in seed data");
            }

            console.log("✅ Seed data validation passed");
        } catch (error) {
            throw new Error(`Seed data validation failed: ${error.message}`);
        }
    }

    /**
     * 清理数据库（清空所有表，用于重新导入种子数据）
     */
    async cleanDatabase(): Promise<void> {
        if (!this.connection) {
            return;
        }

        try {
            console.log("🧹 Cleaning database (all tables)...");

            // 获取所有表名（包括系统表）
            const tables = await this.connection.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE()
        AND table_type = 'BASE TABLE'
      `);

            // 禁用外键检查
            await this.connection.query("SET FOREIGN_KEY_CHECKS = 0");

            // 清空所有表
            for (const table of tables) {
                try {
                    await this.connection.query(`TRUNCATE TABLE ${table.table_name}`);
                    console.log(`   - Truncated table: ${table.table_name}`);
                } catch (error) {
                    console.warn(`   - Warning truncating ${table.table_name}: ${error.message}`);
                    // 如果TRUNCATE失败，尝试DELETE
                    try {
                        await this.connection.query(`DELETE FROM ${table.table_name}`);
                        console.log(`   - Deleted from table: ${table.table_name}`);
                    } catch (deleteError) {
                        console.warn(`   - Failed to clean ${table.table_name}: ${deleteError.message}`);
                    }
                }
            }

            // 重新启用外键检查
            await this.connection.query("SET FOREIGN_KEY_CHECKS = 1");

            console.log("✅ Database cleaned (all tables)");
        } catch (error) {
            console.warn(`⚠️  Database cleanup warning: ${error.message}`);
        }
    }

    /**
     * 重置数据库到初始状态
     */
    async resetDatabase(seedFilePath: string): Promise<void> {
        console.log("🔄 Starting database reset...");
        await this.cleanDatabase();
        console.log("🌱 Database cleaned, now importing seed data...");
        await this.initializeWithSeedData(seedFilePath);
        console.log("✅ Database reset completed");
    }

    /**
     * 执行自定义SQL查询
     */
    async query(sql: string, parameters?: any[]): Promise<any> {
        if (!this.connection) {
            throw new Error("Database connection not established");
        }
        return await this.connection.query(sql, parameters);
    }

    /**
     * 获取数据库连接
     */
    getConnection(): Connection | null {
        return this.connection;
    }

    /**
     * 检查表是否存在
     */
    async tableExists(tableName: string): Promise<boolean> {
        if (!this.connection) {
            return false;
        }

        try {
            const result = await this.connection.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = '${tableName}'
      `);

            return result[0].count > 0;
        } catch (error) {
            return false;
        }
    }

    /**
     * 获取数据库统计信息
     */
    async getDatabaseStats(): Promise<{
        tableCount: number;
        userCount: number;
        roleCount: number;
    }> {
        if (!this.connection) {
            throw new Error("Database connection not established");
        }

        try {
            const tableCountResult = await this.connection.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE()
      `);

            const userCountResult = await this.connection.query("SELECT COUNT(*) as count FROM op_sys_user");
            const roleCountResult = await this.connection.query("SELECT COUNT(*) as count FROM op_sys_role");

            return {
                tableCount: parseInt(tableCountResult[0].count, 10),
                userCount: parseInt(userCountResult[0].count, 10),
                roleCount: parseInt(roleCountResult[0].count, 10),
            };
        } catch (error) {
            throw new Error(`Failed to get database stats: ${error.message}`);
        }
    }

    /**
     * 断开数据库连接
     */
    async disconnect(): Promise<void> {
        if (this.connection && this.connection.isConnected) {
            try {
                await this.connection.close();
                console.log("📊 Database connection closed");
            } catch (error) {
                console.warn(`⚠️  Error closing database connection: ${error.message}`);
            }
            this.connection = null;
        }
    }

    /**
     * 等待数据库就绪
     */
    async waitForReady(timeout = 30000): Promise<void> {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            try {
                if (!this.connection) {
                    await this.checkConnection();
                }

                if (!this.connection) {
                    throw new Error("Database connection not established");
                }
                await this.connection.query("SELECT 1");
                return;
            } catch (error) {
                // 继续等待
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        }

        throw new Error(`Database not ready within ${timeout}ms`);
    }
}

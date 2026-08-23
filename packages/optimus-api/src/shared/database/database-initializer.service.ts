import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Connection, QueryRunner } from "typeorm";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export interface DatabaseInfo {
    id?: number;
    schema_version: string;
    seed_version: string;
    environment: string;
    initialized_at?: Date;
    last_updated_at?: Date;
    node_env: string;
    app_version: string;
    initialization_source: string;
    metadata?: any;
}

@Injectable()
export class DatabaseInitializerService {
    private readonly logger = new Logger(DatabaseInitializerService.name);
    private readonly CURRENT_SCHEMA_VERSION = "2025-10-30";
    private readonly CURRENT_SEED_VERSION = "2025-11-01";

    constructor(private readonly configService: ConfigService) {}

    /**
     * 检查数据库是否需要初始化
     * 判断依据：op_sys_database_info 表是否存在或强制初始化
     */
    async shouldInitializeDatabase(connection: Connection, forceInit = false): Promise<boolean> {
        // queryRunner 必须无条件 release：这个方法在启动路径被调用,漏一个连接
        // 就是池里永久少一个
        const queryRunner = connection.createQueryRunner();
        try {
            const currentEnv = this.getCurrentEnvironment();
            const dbName = this.configService.get("db.mysql.database");

            this.logger.log(`Checking initialization for environment: ${currentEnv}, database: ${dbName}`);

            // 1. E2E 环境：检查数据库名称规范
            if (currentEnv === "e2e") {
                if (!dbName?.endsWith("_e2e")) {
                    this.logger.warn(`E2E environment should use database name ending with '_e2e', current: ${dbName}`);
                }
            }

            // 2. 强制初始化
            if (forceInit) {
                this.logger.log(`Force initialization requested for ${currentEnv} environment`);
                return true;
            }

            // 3. 检查 op_sys_database_info 表是否存在
            const infoTableExists = await queryRunner.query(`
        SELECT COUNT(*) as exists_count
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = 'op_sys_database_info'
      `);
            const hasInfoTable = Number(infoTableExists[0]?.exists_count || 0) > 0;

            // 4. op_sys_database_info 表不存在 - 需要初始化
            if (!hasInfoTable) {
                this.logger.log(`op_sys_database_info table does not exist, initialization required`);
                return true;
            }

            // 5. op_sys_database_info 表已存在 - 不需要初始化
            this.logger.log(`op_sys_database_info table exists, skipping initialization`);
            return false;
        } catch (error) {
            this.logger.error("Error checking database initialization status:", error);
            // 检查失败时，根据环境决定默认行为
            const currentEnv = this.getCurrentEnvironment();
            const shouldInit = currentEnv === "e2e" || currentEnv === "development";
            this.logger.log(
                `Check failed, defaulting to ${shouldInit ? "initialize" : "skip"} for ${currentEnv} environment`,
            );
            return shouldInit;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * 初始化数据库
     * 完整流程：创建 op_sys_database_info 表 → 执行种子数据 → 记录环境初始化信息
     */
    async initializeDatabase(connection: Connection, forceInit = false): Promise<void> {
        const queryRunner = connection.createQueryRunner();
        const currentEnv = this.getCurrentEnvironment();
        const dbName = this.configService.get("db.mysql.database");

        try {
            await queryRunner.startTransaction();

            this.logger.log("🚀 Starting database initialization...");
            this.logger.log(`   Environment: ${currentEnv}`);
            this.logger.log(`   Database: ${dbName}`);
            this.logger.log(`   Force Init: ${forceInit}`);

            // 步骤 2: 执行种子数据
            this.logger.log("🌱 Step 2: Executing seed data...");
            await this.executeSeedData(queryRunner);
            // await this.createDatabaseInfoTable(queryRunner);
            // 步骤 3: 记录当前环境的初始化信息到 op_sys_database_info 表
            this.logger.log("📝 Step 3: Recording initialization info for current environment...");
            await this.recordInitializationInfo(queryRunner);

            await queryRunner.commitTransaction();

            this.logger.log("✅ Database initialization completed successfully");
            this.logger.log(`   Environment '${currentEnv}' has been initialized`);
            this.logger.log(`   Schema Version: ${this.CURRENT_SCHEMA_VERSION}`);
            this.logger.log(`   Seed Version: ${this.CURRENT_SEED_VERSION}`);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error("❌ Database initialization failed:", error);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * 获取数据库文件的绝对路径
     * 使用 __dirname 从当前文件位置向上查找
     */
    private getDbFilePath(relativePath: string): string {
        // __dirname 指向编译后的文件位置，通常是 dist/shared/database
        // 需要向上三级到达 packages/optimus-api 目录
        return join(__dirname, "../../../", relativePath);
    }

    /**
     * 创建数据库信息表
     */
    private async createDatabaseInfoTable(queryRunner: QueryRunner): Promise<void> {
        try {
            // 检查表是否已存在
            const tableExists = await queryRunner.query(`
        SELECT COUNT(*) as exists_count
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = 'op_sys_database_info'
      `);

            if (tableExists[0]?.exists_count > 0) {
                this.logger.log("   op_sys_database_info table already exists, skipping creation");
                return;
            }

            const schemaPath = this.getDbFilePath("db/schema/op_sys_database_info.sql");

            if (!existsSync(schemaPath)) {
                throw new Error(`Database info schema file not found: ${schemaPath}`);
            }

            const schemaSql = readFileSync(schemaPath, "utf8");
            this.logger.log(`   Reading schema from: ${schemaPath}`);

            // 分割SQL语句并执行
            const statements = this.splitSqlStatements(schemaSql);

            for (const statement of statements) {
                if (statement.trim()) {
                    try {
                        await queryRunner.query(statement);
                    } catch (error) {
                        // 如果是表已存在的错误，忽略它
                        if (
                            error.message.includes("already exists") ||
                            (error.message.includes("Table") && error.message.includes("already exists"))
                        ) {
                            this.logger.warn(
                                `   Table creation statement skipped (table may already exist): ${error.message}`,
                            );
                            continue;
                        }
                        throw error;
                    }
                }
            }

            this.logger.log("   ✅ op_sys_database_info table created successfully");
        } catch (error) {
            this.logger.error("   ❌ Failed to create op_sys_database_info table:", error);
            throw error;
        }
    }

    /**
     * 执行种子数据
     */
    private async executeSeedData(queryRunner: QueryRunner): Promise<void> {
        const seedPath = this.getDbFilePath("db/optimus-minimal.sql");

        if (!existsSync(seedPath)) {
            throw new Error(`Seed data file not found: ${seedPath}`);
        }

        const seedSql = readFileSync(seedPath, "utf8");
        this.logger.log(`   Reading seed data from: ${seedPath}`);

        // 分割SQL语句并执行
        const statements = this.splitSqlStatements(seedSql);
        this.logger.log(`   Found ${statements.length} SQL statements to execute`);

        let successCount = 0;
        let skipCount = 0;

        for (const statement of statements) {
            if (statement.trim() && !statement.trim().startsWith("--")) {
                try {
                    await queryRunner.query(statement);
                    successCount++;
                } catch (error) {
                    // 记录错误但继续执行（某些语句可能因为表已存在而失败）
                    this.logger.warn(`   SQL statement failed (continuing): ${error.message}`);
                    skipCount++;
                }
            }
        }

        this.logger.log(`   ✅ Seed data execution completed: ${successCount} successful, ${skipCount} skipped`);

        // 执行自定义初始化逻辑
        await this.executeCustomInitialization(queryRunner);
    }

    /**
     * 执行自定义初始化逻辑
     */
    private async executeCustomInitialization(queryRunner: QueryRunner): Promise<void> {
        this.logger.log("   🔧 Executing custom initialization logic...");

        try {
            // 确保内置分类存在（防止数据被意外删除）
            await this.ensureBuiltInCategories(queryRunner);

            this.logger.log("   ✅ Custom initialization completed");
        } catch (error) {
            this.logger.error("   ❌ Custom initialization failed:", error);
            throw error;
        }
    }

    /**
     * 确保内置分类存在
     */
    private async ensureBuiltInCategories(queryRunner: QueryRunner): Promise<void> {
        const builtInCategories = [
            {
                id: 1,
                name: "News",
                code: "news",
                description: "News and information articles",
                config: { maxCoverImages: 3, maxVersions: 10 },
                sortWeight: 100,
            },
            {
                id: 2,
                name: "Activity",
                code: "activity",
                description: "Activity related articles",
                config: { maxCoverImages: 5, maxVersions: 15 },
                sortWeight: 90,
            },
            {
                id: 3,
                name: "Announcement",
                code: "announcement",
                description: "Announcement and notice articles",
                config: { maxCoverImages: 1, maxVersions: 5 },
                sortWeight: 80,
            },
        ];

        // 直接执行插入，假设表结构已正确同步
        for (const category of builtInCategories) {
            try {
                await queryRunner.query(
                    `
                    INSERT IGNORE INTO op_sys_category 
                    (id, name, code, description, is_built_in, config, sort_weight, create_date, update_date)
                    VALUES (?, ?, ?, ?, true, ?, ?, NOW(), NOW())
                    ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    description = VALUES(description),
                    config = VALUES(config),
                    sort_weight = VALUES(sort_weight),
                    update_date = NOW()
                `,
                    [
                        category.id,
                        category.name,
                        category.code,
                        category.description,
                        JSON.stringify(category.config),
                        category.sortWeight,
                    ],
                );

                this.logger.log(`     ✓ Built-in category ensured: ${category.name} (${category.code})`);
            } catch (error) {
                this.logger.warn(`     ⚠ Failed to ensure built-in category ${category.name}: ${error.message}`);
            }
        }
    }

    /**
     * 记录初始化信息到 op_sys_database_info 表
     * 为当前环境创建或更新记录
     */
    private async recordInitializationInfo(queryRunner: QueryRunner): Promise<void> {
        const currentEnv = this.getCurrentEnvironment();
        const appVersion = this.getAppVersion();
        const dbName = this.configService.get("db.mysql.database");
        const dbHost = this.configService.get("db.mysql.host");

        const dbInfo: Partial<DatabaseInfo> = {
            schema_version: this.CURRENT_SCHEMA_VERSION,
            seed_version: this.CURRENT_SEED_VERSION,
            environment: currentEnv,
            node_env: process.env.NODE_ENV || "development",
            app_version: appVersion,
            initialization_source: "auto",
            metadata: {
                initialized_by: "DatabaseInitializerService",
                timestamp: new Date().toISOString(),
                config: {
                    database: dbName,
                    host: dbHost,
                },
                versions: {
                    schema: this.CURRENT_SCHEMA_VERSION,
                    seed: this.CURRENT_SEED_VERSION,
                    app: appVersion,
                },
            },
        };

        this.logger.log(`   Recording initialization info for environment: ${currentEnv}`);
        this.logger.log(`   Schema Version: ${dbInfo.schema_version}`);
        this.logger.log(`   Seed Version: ${dbInfo.seed_version}`);
        this.logger.log(`   App Version: ${dbInfo.app_version}`);

        // 使用 INSERT ... ON DUPLICATE KEY UPDATE 来处理重复环境
        await queryRunner.query(
            `
      INSERT INTO op_sys_database_info 
      (schema_version, seed_version, environment, node_env, app_version, initialization_source, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      schema_version = VALUES(schema_version),
      seed_version = VALUES(seed_version),
      last_updated_at = CURRENT_TIMESTAMP(6),
      app_version = VALUES(app_version),
      metadata = VALUES(metadata)
    `,
            [
                dbInfo.schema_version,
                dbInfo.seed_version,
                dbInfo.environment,
                dbInfo.node_env,
                dbInfo.app_version,
                dbInfo.initialization_source,
                JSON.stringify(dbInfo.metadata),
            ],
        );

        this.logger.log(`   ✅ Environment '${currentEnv}' record created/updated in op_sys_database_info`);
    }

    /**
     * 获取当前环境
     */
    private getCurrentEnvironment(): string {
        const nodeEnv = process.env.NODE_ENV;

        if (nodeEnv === "e2e" || process.env.TEST_MODE === "true") {
            return "e2e";
        }

        return nodeEnv || "development";
    }

    /**
     * 获取应用版本
     */
    private getAppVersion(): string {
        try {
            const packagePath = this.getDbFilePath("package.json");
            const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
            return packageJson.version || "0.0.1";
        } catch (error) {
            this.logger.warn("Could not read app version from package.json");
            return "0.0.1";
        }
    }

    /**
     * 分割SQL语句
     */
    private splitSqlStatements(sql: string): string[] {
        // 移除注释和空行
        const cleanSql = sql
            .split("\n")
            .filter((line) => !line.trim().startsWith("--") && line.trim() !== "")
            .join("\n");

        // 按分号分割，但要考虑存储过程等复杂情况
        const statements = cleanSql.split(";");

        return statements.map((stmt) => stmt.trim()).filter((stmt) => stmt.length > 0);
    }

    /**
     * 验证初始化环境安全性
     */
    async validateInitializationSafety(
        forceInit = false,
    ): Promise<{ safe: boolean; warnings: string[]; errors: string[] }> {
        const warnings: string[] = [];
        const errors: string[] = [];
        const currentEnv = this.getCurrentEnvironment();
        const dbName = this.configService.get("db.mysql.database");

        // E2E环境：数据库名称必须以 _e2e 结尾
        if (currentEnv === "e2e") {
            if (!dbName?.endsWith("_e2e")) {
                errors.push('E2E environment requires database name to end with "_e2e"');
            }
            this.logger.log(`E2E database: ${dbName}`);
        }

        // 生产环境：只有明确要求才初始化
        if (currentEnv === "production") {
            if (!forceInit && process.env.ALLOW_PROD_INIT !== "true") {
                errors.push("Production database initialization requires ALLOW_PROD_INIT=true or explicit force flag");
            }
            this.logger.log(`Production database: ${dbName}`);
        }

        // 其他环境的建议
        if (currentEnv !== "e2e" && currentEnv !== "production") {
            this.logger.log(`${currentEnv} database: ${dbName}`);
            if (forceInit) {
                warnings.push(`Force initialization requested for ${currentEnv} environment`);
            }
        }

        return {
            safe: errors.length === 0,
            warnings,
            errors,
        };
    }

    /**
     * 获取数据库初始化状态
     */
    async getDatabaseInitializationStatus(connection: Connection): Promise<DatabaseInfo | null> {
        // 初始化守卫每 5s 缓存过期就调一次这里。之前 queryRunner 建了不还,
        // 等于按 5s/个 的速度漏干连接池——池空后本查询超时,catch 返回 null,
        // 守卫把"已初始化"的系统判成未初始化,全接口 403。release 必须无条件执行
        const queryRunner = connection.createQueryRunner();
        try {
            const currentEnv = this.getCurrentEnvironment();

            // 先检查 op_sys_database_info 表是否存在
            const tableExists = await queryRunner.query(`
        SELECT COUNT(*) as exists_count
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = 'op_sys_database_info'
      `);

            const existsCount = Number(tableExists[0]?.exists_count || 0);
            this.logger.log(`op_sys_database_info table exists check: ${existsCount}`);

            if (existsCount === 0) {
                this.logger.log("op_sys_database_info table does not exist, skipping status query");
                return null;
            }

            const result = await queryRunner.query(
                `
        SELECT * FROM op_sys_database_info WHERE environment = ?
      `,
                [currentEnv],
            );

            return result.length > 0 ? result[0] : null;
        } catch (error) {
            this.logger.warn("Could not get database initialization status:", error.message);
            return null;
        } finally {
            await queryRunner.release();
        }
    }
}

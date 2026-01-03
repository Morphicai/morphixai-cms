import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectConnection } from "@nestjs/typeorm";
import { Connection, QueryRunner } from "typeorm";
import { genSalt, hash } from "bcryptjs";
import { readFileSync } from "fs";
import { join } from "path";
import { plainToClass } from "class-transformer";

import { DatabaseInitializerService, DatabaseInfo } from "../../shared/database/database-initializer.service";
import { InitializationGuard } from "../../shared/guards/initialization.guard";
import { UserEntity, UserDeleted } from "../user/user.entity";
import { UserRoleEntity } from "../user/user-role.entity";
import { RoleEntity } from "../role/entities/role.entity";
import { InitializeSystemDto } from "./dto/initialize-system.dto";
import { SetupStatusDto } from "./dto/setup-status.dto";

@Injectable()
export class SetupService {
    private readonly logger = new Logger(SetupService.name);

    constructor(
        @InjectConnection() private readonly connection: Connection,
        private readonly configService: ConfigService,
        private readonly databaseInitializer: DatabaseInitializerService,
        private readonly initializationGuard: InitializationGuard,
    ) {}

    /**
     * 获取系统状态（优化版本，快速响应，不阻塞）
     */
    async getStatus(): Promise<SetupStatusDto> {
        const status: SetupStatusDto = {
            isInitialized: false,
            databaseStatus: {
                connected: false,
            },
            apiStatus: {
                status: "ok",
                uptime: process.uptime(),
            },
            appVersion: this.getAppVersion(),
        };

        // 使用 Promise.race 设置超时，避免长时间阻塞
        const DB_CHECK_TIMEOUT = 2000; // 2秒超时

        // 检查数据库连接（带超时）
        try {
            const dbCheckPromise = this.connection.query("SELECT 1");
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Database check timeout")), DB_CHECK_TIMEOUT),
            );

            await Promise.race([dbCheckPromise, timeoutPromise]);
            status.databaseStatus.connected = true;
        } catch (error) {
            status.databaseStatus.connected = false;
            status.databaseStatus.error = error.message || "Connection check failed";
            this.logger.warn("Database connection check failed:", error.message);
            // 数据库连接失败时，直接返回，不继续检查初始化状态
            return status;
        }

        // 检查是否已初始化（带超时，简化查询）
        try {
            const initCheckPromise = this.checkInitializationStatus();
            const timeoutPromise = new Promise<null>((resolve) =>
                setTimeout(() => {
                    this.logger.warn("Initialization status check timeout, assuming not initialized");
                    resolve(null);
                }, DB_CHECK_TIMEOUT),
            );

            const dbInfo = await Promise.race([initCheckPromise, timeoutPromise]);

            if (dbInfo) {
                status.isInitialized = true;
                status.systemInfo = {
                    schemaVersion: dbInfo.schema_version,
                    seedVersion: dbInfo.seed_version,
                    environment: dbInfo.environment,
                    initializedAt: dbInfo.initialized_at,
                };
            } else {
                status.isInitialized = false;
            }
        } catch (error) {
            this.logger.warn("Failed to check initialization status:", error.message);
            status.isInitialized = false;
        }

        return status;
    }

    /**
     * 检查初始化状态（优化版本，快速查询）
     */
    private async checkInitializationStatus(): Promise<DatabaseInfo | null> {
        try {
            // 直接查询 op_sys_database_info 表，如果表不存在会抛出错误，捕获后返回 null
            const currentEnv = this.getCurrentEnvironment();
            const result = await this.connection.query(
                `SELECT * FROM op_sys_database_info WHERE environment = ? LIMIT 1`,
                [currentEnv],
            );
            return result.length > 0 ? result[0] : null;
        } catch (error) {
            // 表不存在或其他错误，返回 null（表示未初始化）
            return null;
        }
    }

    /**
     * 初始化系统
     */
    async initializeSystem(dto: InitializeSystemDto): Promise<void> {
        const queryRunner = this.connection.createQueryRunner();

        try {
            await queryRunner.startTransaction();

            this.logger.log("🚀 Starting system initialization...");

            // 步骤 1: 初始化数据库
            this.logger.log("📦 Step 1: Initializing database...");
            await this.databaseInitializer.initializeDatabase(this.connection, false);

            // 步骤 2: 创建管理员用户
            this.logger.log("👤 Step 2: Creating admin user...");
            const userId = await this.createAdminUser(queryRunner, dto);

            // 步骤 3: 设置系统信息
            this.logger.log("⚙️  Step 3: Setting system information...");
            await this.setSystemInfo(queryRunner, dto, userId);

            await queryRunner.commitTransaction();

            // 清除初始化守卫的缓存，确保后续请求能获取到最新的初始化状态
            this.initializationGuard.clearCache();

            this.logger.log("✅ System initialization completed successfully");
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error("❌ System initialization failed:", error);
            throw new BadRequestException(`系统初始化失败: ${error.message}`);
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * 创建管理员用户
     */
    private async createAdminUser(queryRunner: QueryRunner, dto: InitializeSystemDto): Promise<number> {
        // 检查是否已存在该账号的用户（无论是否删除）
        const existingUser = await queryRunner.query(`SELECT id FROM op_sys_user WHERE account = ?`, [dto.account]);

        if (existingUser.length > 0) {
            this.logger.warn(`User with account '${dto.account}' already exists, skipping creation`);
            return existingUser[0].id;
        }

        // 生成密码哈希
        const salt = await genSalt();
        const hashedPassword = await hash(dto.password, salt);

        // 获取管理员角色ID（默认为1）
        const adminRole = await queryRunner.query(`SELECT id FROM op_sys_role WHERE id = 1 LIMIT 1`);
        if (adminRole.length === 0) {
            throw new Error("管理员角色不存在，请先初始化数据库");
        }
        const roleId = adminRole[0].id;

        // 创建用户
        const userResult = await queryRunner.query(
            `INSERT INTO op_sys_user (account, password, salt, full_name, email, phone_num, status, is_deleted, type, create_date, update_date)
             VALUES (?, ?, ?, ?, ?, ?, 1, 1, 0, NOW(), NOW())`,
            [dto.account, hashedPassword, salt, dto.fullName || "系统管理员", dto.email || "", dto.phoneNum || ""],
        );

        const userId = userResult.insertId;

        // 分配管理员角色
        await queryRunner.query(`INSERT INTO op_sys_user_role (user_id, role_id) VALUES (?, ?)`, [userId, roleId]);

        this.logger.log(`✅ Admin user created: ${dto.account} (ID: ${userId})`);
        return userId;
    }

    /**
     * 设置系统信息
     */
    private async setSystemInfo(queryRunner: QueryRunner, dto: InitializeSystemDto, userId: number): Promise<void> {
        // 更新 sys_database_info 表的 metadata 字段，添加站点信息
        const currentEnv = this.getCurrentEnvironment();
        const metadata = {
            siteName: dto.siteName || "Optimus CMS",
            siteDescription: dto.siteDescription || "",
            initializedBy: dto.account,
            initializedAt: new Date().toISOString(),
        };

        await queryRunner.query(
            `UPDATE op_sys_database_info 
             SET metadata = JSON_SET(COALESCE(metadata, '{}'), '$.siteName', ?, '$.siteDescription', ?, '$.initializedBy', ?, '$.initializedAt', ?)
             WHERE environment = ?`,
            [metadata.siteName, metadata.siteDescription, metadata.initializedBy, metadata.initializedAt, currentEnv],
        );

        // 更新 document 表中的站点名称和站点描述
        // 如果提供了站点名称，则更新对应的 document
        if (dto.siteName) {
            await queryRunner.query(
                `UPDATE op_sys_document 
                 SET content = ?, user_id = ?
                 WHERE doc_key = 'site_name' AND source = 'config'`,
                [dto.siteName, String(userId)],
            );
            this.logger.log(`✅ Site name updated in document: ${dto.siteName}`);
        }

        // 如果提供了站点描述，则更新对应的 document
        if (dto.siteDescription) {
            await queryRunner.query(
                `UPDATE op_sys_document 
                 SET content = ?, user_id = ?
                 WHERE doc_key = 'site_description' AND source = 'seo'`,
                [dto.siteDescription, String(userId)],
            );
            this.logger.log(`✅ Site description updated in document: ${dto.siteDescription}`);
        }

        this.logger.log("✅ System information updated");
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
            const packagePath = join(__dirname, "../../../package.json");
            const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
            return packageJson.version || "0.0.1";
        } catch (error) {
            this.logger.warn("Could not read app version from package.json");
            return "0.0.1";
        }
    }
}

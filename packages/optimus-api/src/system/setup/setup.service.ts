import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectConnection } from "@nestjs/typeorm";
import { Connection, QueryRunner } from "typeorm";
import { genSalt, hash } from "bcryptjs";
import { readFileSync } from "fs";
import { join } from "path";
import { plainToClass } from "class-transformer";

import { DatabaseInitializerService, DatabaseInfo } from "../../shared/database/database-initializer.service";
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
    ) {}

    /**
     * 获取系统状态
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

        // 检查数据库连接
        try {
            await this.connection.query("SELECT 1");
            status.databaseStatus.connected = true;
        } catch (error) {
            status.databaseStatus.connected = false;
            status.databaseStatus.error = error.message;
            this.logger.warn("Database connection check failed:", error.message);
            return status; // 如果数据库连接失败，直接返回
        }

        // 检查是否已初始化
        try {
            const dbInfo = await this.databaseInitializer.getDatabaseInitializationStatus(this.connection);
            if (dbInfo) {
                status.isInitialized = true;
                status.systemInfo = {
                    schemaVersion: dbInfo.schema_version,
                    seedVersion: dbInfo.seed_version,
                    environment: dbInfo.environment,
                    initializedAt: dbInfo.initialized_at,
                };
            } else {
                // 检查是否有系统信息表
                const tableExists = await this.connection.query(`
                    SELECT COUNT(*) as exists_count
                    FROM information_schema.tables 
                    WHERE table_schema = DATABASE() 
                    AND table_name = 'op_sys_database_info'
                `);
                const hasInfoTable = Number(tableExists[0]?.exists_count || 0) > 0;

                if (hasInfoTable) {
                    // 表存在但没有数据，认为未初始化
                    status.isInitialized = false;
                } else {
                    // 表不存在，检查是否有其他系统表
                    const userTableExists = await this.connection.query(`
                        SELECT COUNT(*) as exists_count
                        FROM information_schema.tables 
                        WHERE table_schema = DATABASE() 
                        AND table_name = 'op_sys_user'
                    `);
                    const hasUserTable = Number(userTableExists[0]?.exists_count || 0) > 0;

                    if (!hasUserTable) {
                        // 没有任何系统表，认为未初始化
                        status.isInitialized = false;
                    } else {
                        // 有系统表但没有 sys_database_info 表，认为未初始化
                        status.isInitialized = false;
                    }
                }
            }
        } catch (error) {
            this.logger.warn("Failed to check initialization status:", error.message);
            status.isInitialized = false;
        }

        return status;
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
            await this.createAdminUser(queryRunner, dto);

            // 步骤 3: 设置系统信息
            this.logger.log("⚙️  Step 3: Setting system information...");
            await this.setSystemInfo(queryRunner, dto);

            await queryRunner.commitTransaction();

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
    private async createAdminUser(queryRunner: QueryRunner, dto: InitializeSystemDto): Promise<void> {
        // 检查是否已存在该账号的用户（无论是否删除）
        const existingUser = await queryRunner.query(`SELECT id FROM op_sys_user WHERE account = ?`, [dto.account]);

        if (existingUser.length > 0) {
            this.logger.warn(`User with account '${dto.account}' already exists, skipping creation`);
            return;
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
    }

    /**
     * 设置系统信息
     */
    private async setSystemInfo(queryRunner: QueryRunner, dto: InitializeSystemDto): Promise<void> {
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

import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron } from "@nestjs/schedule";
import { InjectConnection } from "@nestjs/typeorm";
import { Connection } from "typeorm";
import { DatabaseBackupService } from "./database-backup.service";
import { DatabaseInitializerService } from "../../shared/database/database-initializer.service";

/**
 * 备份调度服务
 * 负责定时触发备份任务和清理过期备份
 */
@Injectable()
export class BackupSchedulerService {
    private readonly logger = new Logger(BackupSchedulerService.name);
    private readonly backupEnabled: boolean;
    private readonly backupSchedule: string;
    private readonly cleanupSchedule: string;

    constructor(
        private readonly backupService: DatabaseBackupService,
        private readonly configService: ConfigService,
        @InjectConnection() private readonly connection: Connection,
        private readonly databaseInitializer: DatabaseInitializerService,
    ) {
        // 从环境变量或配置文件读取调度配置
        this.backupEnabled = this.getConfigValue("BACKUP_ENABLED", "backup.enabled", "true") === "true";
        this.backupSchedule = this.getConfigValue("BACKUP_SCHEDULE", "backup.schedule", "0 2 * * *");
        this.cleanupSchedule = this.getConfigValue("BACKUP_CLEANUP_SCHEDULE", "backup.cleanupSchedule", "0 3 * * *");

        this.logger.log(`Backup scheduler initialized:`);
        this.logger.log(`  - Enabled: ${this.backupEnabled}`);
        this.logger.log(`  - Backup schedule: ${this.backupSchedule}`);
        this.logger.log(`  - Cleanup schedule: ${this.cleanupSchedule}`);
    }

    /**
     * 获取配置值（优先环境变量，其次配置文件，最后默认值）
     */
    private getConfigValue(envKey: string, configKey: string, defaultValue: string): string {
        // 优先使用环境变量
        const envValue = process.env[envKey];
        if (envValue !== undefined) {
            return envValue;
        }

        // 其次使用配置文件
        const configValue = this.configService.get<string>(configKey);
        if (configValue !== undefined) {
            return String(configValue);
        }

        // 最后使用默认值
        return defaultValue;
    }

    /**
     * 定时执行数据库备份
     * 默认每天凌晨 2 点执行
     * 可通过 BACKUP_SCHEDULE 环境变量或配置文件自定义
     */
    @Cron("0 2 * * *")
    async scheduledBackup(): Promise<void> {
        // 检查系统是否已初始化，如果未初始化则跳过执行
        const dbInfo = await this.databaseInitializer.getDatabaseInitializationStatus(this.connection);
        if (!dbInfo) {
            this.logger.debug("System not initialized, skipping scheduled backup");
            return;
        }

        // 检查是否启用自动备份
        if (!this.backupEnabled) {
            this.logger.log("Automatic backup is disabled, skipping scheduled backup");
            return;
        }

        try {
            this.logger.log("Starting scheduled automatic backup...");

            const backupInfo = await this.backupService.executeBackup("auto");

            this.logger.log(
                `Scheduled backup completed successfully: ${backupInfo.fileName} (${backupInfo.fileSize} bytes)`,
            );
        } catch (error) {
            this.logger.error(`Scheduled backup failed: ${error.message}`, error.stack);
            // 不抛出异常，避免影响后续的定时任务
        }
    }

    /**
     * 定时清理过期备份（30 天前）
     * 默认每天凌晨 3 点执行
     * 可通过 BACKUP_CLEANUP_SCHEDULE 环境变量或配置文件自定义
     */
    @Cron("0 3 * * *")
    async scheduledCleanup(): Promise<void> {
        // 检查系统是否已初始化，如果未初始化则跳过执行
        const dbInfo = await this.databaseInitializer.getDatabaseInitializationStatus(this.connection);
        if (!dbInfo) {
            this.logger.debug("System not initialized, skipping scheduled cleanup");
            return;
        }

        // 检查是否启用自动备份（如果备份都禁用了，清理也应该禁用）
        if (!this.backupEnabled) {
            this.logger.log("Automatic backup is disabled, skipping scheduled cleanup");
            return;
        }

        try {
            this.logger.log("Starting scheduled cleanup of expired backups...");

            const deletedCount = await this.backupService.cleanupExpiredBackups();

            this.logger.log(`Scheduled cleanup completed: ${deletedCount} backup(s) deleted`);
        } catch (error) {
            this.logger.error(`Scheduled cleanup failed: ${error.message}`, error.stack);
            // 不抛出异常，避免影响后续的定时任务
        }
    }
}

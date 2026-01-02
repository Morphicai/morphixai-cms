import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan } from "typeorm";
import { ConfigService } from "@nestjs/config";
import * as zlib from "zlib";
import * as crypto from "crypto";
import mysqldump from "mysqldump";
import { StorageFactory } from "../oss/factory/storage.factory";
import { IStorageService } from "../oss/interfaces/storage.interface";
import { FindBackupsDto } from "./dto/find-backups.dto";
import { BackupFileInfo } from "./interfaces/backup-file-info.interface";
import { BackupRecordEntity } from "./entities/backup-record.entity";

/**
 * 数据库备份服务
 */
@Injectable()
export class DatabaseBackupService {
    private readonly logger = new Logger(DatabaseBackupService.name);
    private readonly encryptionSecret: string;
    private readonly ossPath: string;
    private readonly retentionDays: number;
    private readonly storageService: IStorageService;

    constructor(
        private readonly configService: ConfigService,
        private readonly storageFactory: StorageFactory,
        @InjectRepository(BackupRecordEntity)
        private readonly backupRecordRepository: Repository<BackupRecordEntity>,
    ) {
        // 从环境变量或配置文件读取，使用默认值作为后备
        this.encryptionSecret = this.getConfigValue(
            "BACKUP_ENCRYPTION_SECRET",
            "backup.defaultEncryptionSecret",
            "default-backup-encryption-secret-key",
        );
        this.ossPath = this.getConfigValue("BACKUP_OSS_PATH", "backup.ossPath", "database-backups");
        this.retentionDays = parseInt(this.getConfigValue("BACKUP_RETENTION_DAYS", "backup.retentionDays", "30"));

        // 获取存储服务实例
        this.storageService = this.storageFactory.create();

        // 打印存储提供商信息
        const storageProvider = this.storageFactory.getStorageProvider();
        this.logger.log("=".repeat(80));
        this.logger.log(`📦 Database Backup Storage Configuration`);
        this.logger.log(`   Provider: ${storageProvider.toUpperCase()}`);
        this.logger.log(`   Backup Path: ${this.ossPath}`);
        this.logger.log(`   Retention Days: ${this.retentionDays}`);
        this.logger.log(`   Encryption: ${this.encryptionSecret ? "Enabled" : "Disabled"}`);
        this.logger.log("=".repeat(80));
    }

    /**
     * 获取配置值（优先环境变量，其次配置文件，最后默认值）
     */
    private getConfigValue(envKey: string, configKey: string, defaultValue?: string): string {
        // 优先使用环境变量
        const envValue = process.env[envKey];
        if (envValue) {
            return envValue;
        }

        // 其次使用配置文件
        const configValue = this.configService.get<string>(configKey);
        if (configValue) {
            return configValue;
        }

        // 最后使用默认值
        return defaultValue || "";
    }

    /**
     * 使用 mysqldump npm 包导出数据库
     */
    private async dumpDatabase(): Promise<Buffer> {
        try {
            // 从配置中读取数据库连接信息
            const dbHost = this.configService.get<string>("db.mysql.host") || "localhost";
            const dbPort = this.configService.get<number>("db.mysql.port") || 3306;
            const dbUsername = this.configService.get<string>("db.mysql.username") || "root";
            const dbPassword = this.configService.get<string>("db.mysql.password") || "";
            const dbDatabase = this.configService.get<string>("db.mysql.database") || "optimus";

            this.logger.log(`Starting database dump for ${dbDatabase}...`);
            this.logger.log(`Connection: ${dbUsername}@${dbHost}:${dbPort}`);

            // 使用 mysqldump npm 包导出数据库
            const result = await mysqldump({
                connection: {
                    host: dbHost,
                    port: dbPort,
                    user: dbUsername,
                    password: dbPassword,
                    database: dbDatabase,
                },
                dumpToFile: null, // 不写入文件，直接返回 SQL
                dump: {
                    schema: {
                        table: {
                            ifNotExist: true, // 添加 IF NOT EXISTS
                            dropIfExist: true, // 添加 DROP TABLE IF EXISTS
                        },
                    },
                    data: {
                        format: true, // 格式化 SQL
                        maxRowsPerInsertStatement: 1000, // 每个 INSERT 语句最多 1000 行
                    },
                    trigger: {
                        delimiter: "$$", // 触发器分隔符
                        dropIfExist: true,
                    },
                },
            });

            // 将 SQL 字符串转换为 Buffer
            const sqlContent = result.dump.schema + "\n" + result.dump.data + "\n" + result.dump.trigger;
            const buffer = Buffer.from(sqlContent, "utf8");

            this.logger.log(
                `Database dump completed successfully. Size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`,
            );
            return buffer;
        } catch (error) {
            this.logger.error("Failed to dump database", error);
            throw new Error(`Database dump failed: ${error.message}`);
        }
    }

    /**
     * 压缩数据库转储文件
     */
    private async compressData(data: Buffer): Promise<Buffer> {
        try {
            this.logger.log("Compressing database dump...");

            return new Promise((resolve, reject) => {
                zlib.gzip(data, { level: 6 }, (error, compressed) => {
                    if (error) {
                        reject(error);
                    } else {
                        this.logger.log(
                            `Compression completed. Original: ${data.length} bytes, Compressed: ${compressed.length} bytes`,
                        );
                        resolve(compressed);
                    }
                });
            });
        } catch (error) {
            this.logger.error("Failed to compress data", error);
            throw new Error(`Data compression failed: ${error.message}`);
        }
    }

    /**
     * 从密钥派生 AES-256 所需的 key 和 IV
     */
    private deriveKeyAndIV(secret: string): { key: Buffer; iv: Buffer } {
        try {
            // 使用 SHA-256 派生 32 字节的 key
            const key = crypto.createHash("sha256").update(secret).digest();

            // 使用 MD5 派生 16 字节的 IV
            const iv = crypto.createHash("md5").update(secret).digest();

            return { key, iv };
        } catch (error) {
            this.logger.error("Failed to derive key and IV", error);
            throw new Error(`Key derivation failed: ${error.message}`);
        }
    }

    /**
     * 加密压缩后的数据
     * 使用 AES-256-CBC 加密
     */
    private async encryptData(data: Buffer): Promise<Buffer> {
        try {
            this.logger.log("Encrypting backup data...");

            const { key, iv } = this.deriveKeyAndIV(this.encryptionSecret);

            // 创建加密器
            const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

            // 加密数据
            const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);

            this.logger.log(`Encryption completed. Size: ${encrypted.length} bytes`);
            return encrypted;
        } catch (error) {
            this.logger.error("Failed to encrypt data", error);
            throw new Error(`Data encryption failed: ${error.message}`);
        }
    }

    /**
     * 生成备份文件名
     * 格式：backup-{type}-YYYYMMDD-HHmmss.sql.gz.enc
     */
    private generateBackupFileName(backupType: "auto" | "manual"): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");

        const timestamp = `${year}${month}${day}-${hours}${minutes}${seconds}`;
        return `backup-${backupType}-${timestamp}.sql.gz.enc`;
    }

    /**
     * 执行数据库备份
     * @param backupType 备份类型
     */
    async executeBackup(backupType: "auto" | "manual"): Promise<BackupFileInfo> {
        const startTime = new Date();
        const storageProvider = this.storageFactory.getStorageProvider();

        this.logger.log("=".repeat(80));
        this.logger.log(`🔄 Starting ${backupType.toUpperCase()} backup`);
        this.logger.log(`   Time: ${startTime.toISOString()}`);
        this.logger.log(`   Storage: ${storageProvider.toUpperCase()}`);
        this.logger.log("=".repeat(80));

        try {
            // 1. 导出数据库
            const dumpData = await this.dumpDatabase();

            // 2. 压缩数据
            const compressedData = await this.compressData(dumpData);

            // 3. 加密数据
            const encryptedData = await this.encryptData(compressedData);

            // 4. 生成文件名
            const fileName = this.generateBackupFileName(backupType);

            // 5. 上传到 OSS
            const { fileKey } = await this.uploadToOss(encryptedData, fileName);

            const endTime = new Date();
            const duration = endTime.getTime() - startTime.getTime();
            const storageProvider = this.storageFactory.getStorageProvider();

            // 6. 保存备份记录到数据库
            const backupRecord = this.backupRecordRepository.create({
                fileName,
                fileKey,
                fileSize: encryptedData.length,
                backupType,
                storageProvider,
                status: "success",
                startTime,
                completedTime: endTime,
                duration,
            });
            await this.backupRecordRepository.save(backupRecord);

            this.logger.log("=".repeat(80));
            this.logger.log(`✅ Backup completed successfully`);
            this.logger.log(`   Duration: ${duration}ms`);
            this.logger.log(`   File: ${fileKey}`);
            this.logger.log(`   Size: ${(encryptedData.length / 1024 / 1024).toFixed(2)} MB`);
            this.logger.log(`   Storage: ${storageProvider.toUpperCase()}`);
            this.logger.log(`   Record ID: ${backupRecord.id}`);
            this.logger.log("=".repeat(80));

            // 返回备份文件信息
            return {
                fileName,
                fileKey,
                fileSize: encryptedData.length,
                createdAt: startTime,
                backupType,
                storageProvider,
            };
        } catch (error) {
            const endTime = new Date();
            const duration = endTime.getTime() - startTime.getTime();

            // 保存失败记录到数据库
            try {
                const failedRecord = this.backupRecordRepository.create({
                    fileName: `backup-${backupType}-failed-${Date.now()}.sql.gz.enc`,
                    fileKey: "",
                    fileSize: 0,
                    backupType,
                    storageProvider: this.storageFactory.getStorageProvider(),
                    status: "failed",
                    startTime,
                    completedTime: endTime,
                    duration,
                    errorMessage: error.message,
                });
                await this.backupRecordRepository.save(failedRecord);
            } catch (dbError) {
                this.logger.error("Failed to save backup failure record", dbError);
            }

            this.logger.error(`Backup failed after ${duration}ms: ${error.message}`, error.stack);

            throw error;
        }
    }

    /**
     * 解密加密后的数据
     * 使用 AES-256-CBC 解密
     * @param encryptedData 加密的数据
     * @returns 解密后的数据
     */
    private async decryptData(encryptedData: Buffer): Promise<Buffer> {
        try {
            this.logger.log("Decrypting backup data...");

            const { key, iv } = this.deriveKeyAndIV(this.encryptionSecret);

            // 创建解密器
            const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

            // 解密数据
            const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

            this.logger.log(`Decryption completed. Size: ${decrypted.length} bytes`);
            return decrypted;
        } catch (error) {
            this.logger.error("Failed to decrypt data", error);
            throw new Error(`Data decryption failed: ${error.message}`);
        }
    }

    /**
     * 下载并解密备份文件
     * 返回解密后的 .sql.gz 文件流
     * @param fileKey 文件键名
     * @returns 解密后的文件 Buffer
     */
    async downloadAndDecryptBackup(fileKey: string): Promise<Buffer> {
        try {
            this.logger.log(`Downloading and decrypting backup file: ${fileKey}`);

            // 1. 检查文件是否存在
            const exists = await this.storageService.fileExists(fileKey);
            if (!exists) {
                throw new Error(`Backup file not found: ${fileKey}`);
            }

            // 2. 从 OSS 下载加密文件
            const fileStream = await this.storageService.downloadFile(fileKey);

            // 3. 将流转换为 Buffer
            const chunks: Buffer[] = [];
            for await (const chunk of fileStream) {
                chunks.push(chunk);
            }
            const encryptedData = Buffer.concat(chunks);

            this.logger.log(`Downloaded encrypted file. Size: ${encryptedData.length} bytes`);

            // 4. 解密数据
            const decryptedData = await this.decryptData(encryptedData);

            this.logger.log(`Decryption completed. Decrypted size: ${decryptedData.length} bytes`);

            return decryptedData;
        } catch (error) {
            this.logger.error(`Failed to download and decrypt backup: ${error.message}`, error.stack);
            throw new Error(`Failed to download and decrypt backup: ${error.message}`);
        }
    }

    /**
     * 生成备份文件的下载 URL
     * 生成临时访问 URL 并重定向，无需解密
     * @param fileKey 文件键名
     * @param expiresIn 过期时间（秒），默认 3600 秒（1 小时）
     * @returns 临时访问 URL
     */
    async generateDownloadUrl(fileKey: string, expiresIn = 3600): Promise<string> {
        try {
            this.logger.log(`Generating download URL for: ${fileKey}, expires in ${expiresIn}s`);

            // 检查文件是否存在
            const exists = await this.storageService.fileExists(fileKey);
            if (!exists) {
                throw new Error(`Backup file not found: ${fileKey}`);
            }

            // 生成临时访问 URL
            const temporaryUrl = await this.storageService.generateTemporaryUrl(fileKey, {
                expiresIn,
            });

            this.logger.log(`Generated temporary URL for: ${fileKey}`);
            return temporaryUrl;
        } catch (error) {
            this.logger.error(`Failed to generate download URL: ${error.message}`);
            throw new Error(`Failed to generate download URL: ${error.message}`);
        }
    }

    /**
     * 上传备份文件到 OSS 指定目录
     * 目录格式：{ossPath}/YYYY/MM/
     * 例如：database-backups/2024/01/
     *
     * 实现重试机制：最多 3 次，指数退避
     */
    private async uploadToOss(encryptedData: Buffer, fileName: string): Promise<{ fileKey: string }> {
        const maxRetries = 3;
        const baseDelay = 2000; // 2 seconds

        // 生成目录路径：{ossPath}/YYYY/MM/
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const directoryPath = `${this.ossPath}/${year}/${month}`;
        const fileKey = `${directoryPath}/${fileName}`;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                this.logger.log(`Uploading backup to OSS (attempt ${attempt}/${maxRetries}): ${fileKey}`);

                // 准备元数据
                const metadata = {
                    "Content-Type": "application/octet-stream",
                    "Backup-Type": fileName.includes("-auto-") ? "auto" : "manual",
                    "Upload-Date": now.toISOString(),
                    "File-Type": "database-backup",
                };

                // 使用统一的存储接口上传文件
                await this.storageService.uploadBuffer(encryptedData, fileKey, metadata);

                this.logger.log(`Backup uploaded successfully: ${fileKey} (${encryptedData.length} bytes)`);
                return { fileKey };
            } catch (error) {
                this.logger.error(`Upload attempt ${attempt} failed: ${error.message}`);

                if (attempt === maxRetries) {
                    throw new Error(`Failed to upload backup after ${maxRetries} attempts: ${error.message}`);
                }

                // 指数退避：2秒、4秒、8秒
                const delay = baseDelay * Math.pow(2, attempt - 1);
                this.logger.log(`Retrying in ${delay}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }

        throw new Error("Upload failed after all retries");
    }

    /**
     * 列出所有备份文件
     * 从数据库读取备份记录
     */
    async listBackups(query: FindBackupsDto): Promise<{ list: BackupFileInfo[]; total: number }> {
        try {
            this.logger.log(`Listing backups with query: ${JSON.stringify(query)}`);

            // 构建查询条件
            const where: any = {
                status: "success", // 只显示成功的备份
            };

            // 按备份类型筛选
            if (query.backupType) {
                where.backupType = query.backupType;
            }

            // 按日期范围筛选
            if (query.startDate && query.endDate) {
                const endDate = new Date(query.endDate);
                endDate.setHours(23, 59, 59, 999);
                where.startTime = {
                    $gte: new Date(query.startDate),
                    $lte: endDate,
                };
            } else if (query.startDate) {
                where.startTime = { $gte: new Date(query.startDate) };
            } else if (query.endDate) {
                const endDate = new Date(query.endDate);
                endDate.setHours(23, 59, 59, 999);
                where.startTime = { $lte: endDate };
            }

            // 查询总数
            const total = await this.backupRecordRepository.count({ where });

            // 查询分页数据
            const page = query.page || 1;
            const size = query.size || 10;
            const skip = (page - 1) * size;

            const records = await this.backupRecordRepository.find({
                where,
                order: {
                    startTime: "DESC", // 按备份时间降序
                },
                skip,
                take: size,
            });

            // 转换为 BackupFileInfo 格式
            const list: BackupFileInfo[] = records.map((record) => ({
                fileName: record.fileName,
                fileKey: record.fileKey,
                fileSize: record.fileSize,
                createdAt: record.startTime,
                backupType: record.backupType as "auto" | "manual",
                storageProvider: record.storageProvider,
            }));

            this.logger.log(`Found ${total} backups, returning ${list.length} for page ${page}`);

            return {
                list,
                total,
            };
        } catch (error) {
            this.logger.error(`Failed to list backups: ${error.message}`, error.stack);
            throw new Error(`Failed to list backups: ${error.message}`);
        }
    }

    /**
     * 获取备份统计信息
     * 从数据库统计
     */
    async getBackupStats(): Promise<{
        totalBackups: number;
        totalSize: number;
        autoBackups: number;
        manualBackups: number;
        oldestBackup: Date | null;
        newestBackup: Date | null;
    }> {
        try {
            this.logger.log("Calculating backup statistics...");

            // 统计成功的备份
            const successRecords = await this.backupRecordRepository.find({
                where: { status: "success" },
                order: { startTime: "ASC" },
            });

            const totalBackups = successRecords.length;
            const totalSize = successRecords.reduce((sum, record) => sum + Number(record.fileSize), 0);
            const autoBackups = successRecords.filter((r) => r.backupType === "auto").length;
            const manualBackups = successRecords.filter((r) => r.backupType === "manual").length;
            const oldestBackup = successRecords.length > 0 ? successRecords[0].startTime : null;
            const newestBackup = successRecords.length > 0 ? successRecords[successRecords.length - 1].startTime : null;

            this.logger.log(
                `Backup statistics: total=${totalBackups}, size=${totalSize}, auto=${autoBackups}, manual=${manualBackups}`,
            );

            return {
                totalBackups,
                totalSize,
                autoBackups,
                manualBackups,
                oldestBackup,
                newestBackup,
            };
        } catch (error) {
            this.logger.error(`Failed to get backup statistics: ${error.message}`, error.stack);
            throw new Error(`Failed to get backup statistics: ${error.message}`);
        }
    }

    /**
     * 清理超过保留天数的备份文件
     * 默认清理 30 天前的备份
     * @returns 删除的文件数量
     */
    async cleanupExpiredBackups(): Promise<number> {
        try {
            this.logger.log(`Starting cleanup of backups older than ${this.retentionDays} days...`);

            // 计算过期时间点
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() - this.retentionDays);

            this.logger.log(`Expiration date: ${expirationDate.toISOString()}`);

            // 从数据库查询过期的备份记录
            const expiredRecords = await this.backupRecordRepository.find({
                where: {
                    status: "success",
                    startTime: LessThan(expirationDate),
                },
            });

            this.logger.log(`Found ${expiredRecords.length} expired backup(s) to delete`);

            let deletedCount = 0;

            // 删除过期文件和数据库记录
            for (const record of expiredRecords) {
                try {
                    // 1. 从 OSS 删除文件
                    await this.storageService.deleteFile(record.fileKey);
                    this.logger.log(`Deleted file from OSS: ${record.fileKey}`);

                    // 2. 更新数据库记录状态为已删除
                    record.status = "deleted";
                    await this.backupRecordRepository.save(record);

                    deletedCount++;
                    this.logger.log(
                        `Deleted expired backup: ${record.fileName} (created: ${record.startTime.toISOString()})`,
                    );
                } catch (error) {
                    this.logger.error(`Failed to delete backup ${record.fileName}: ${error.message}`);
                    // 即使删除失败，也更新记录状态
                    record.errorMessage = `Cleanup failed: ${error.message}`;
                    await this.backupRecordRepository.save(record);
                }
            }

            this.logger.log(`Cleanup completed. Deleted ${deletedCount} expired backup(s)`);
            return deletedCount;
        } catch (error) {
            this.logger.error(`Failed to cleanup expired backups: ${error.message}`, error.stack);
            throw new Error(`Cleanup failed: ${error.message}`);
        }
    }
}

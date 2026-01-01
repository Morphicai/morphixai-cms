import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron, CronExpression } from "@nestjs/schedule";
import { IStorageService } from "./interfaces/storage.interface";
import { StorageFactory } from "./factory/storage.factory";
import { StorageException, StorageErrorType, ConfigurationException } from "./exceptions/storage.exception";

/**
 * 存储健康状态
 */
export interface StorageHealthStatus {
    /** 是否健康 */
    healthy: boolean;
    /** 存储提供商 */
    provider: string;
    /** 最后检查时间 */
    lastCheck: Date;
    /** 错误信息 */
    error?: string;
    /** 响应时间（毫秒） */
    responseTime?: number;
}

/**
 * 存储配置服务
 * 负责管理存储初始化、健康检查和状态监控
 */
@Injectable()
export class StorageConfigService implements OnModuleInit {
    private readonly logger = new Logger(StorageConfigService.name);
    private storageService: IStorageService;
    private healthStatus: StorageHealthStatus;
    private isInitialized = false;

    constructor(private readonly configService: ConfigService, private readonly storageFactory: StorageFactory) {
        this.healthStatus = {
            healthy: false,
            provider: "unknown",
            lastCheck: new Date(),
        };
    }

    /**
     * 模块初始化时执行
     */
    async onModuleInit() {
        await this.initializeStorage();
    }

    /**
     * 初始化存储服务
     */
    async initializeStorage(): Promise<void> {
        try {
            this.logger.log("Initializing storage service...");

            // 创建存储服务实例
            this.storageService = this.storageFactory.create();
            const provider = this.storageFactory.getStorageProvider();

            this.logger.log(`Storage service initialized with provider: ${provider}`);

            // 执行初始健康检查
            await this.performHealthCheck();

            this.isInitialized = true;
            this.logger.log("Storage service initialization completed successfully");
        } catch (error) {
            this.logger.error("Failed to initialize storage service", error);

            this.healthStatus = {
                healthy: false,
                provider: this.storageFactory.getStorageProvider() || "unknown",
                lastCheck: new Date(),
                error: error.message,
            };

            // 不抛出异常，允许应用继续启动
            // throw error;
        }
    }

    /**
     * 获取存储服务实例
     * @returns 存储服务实例
     */
    getStorageService(): IStorageService {
        if (!this.isInitialized || !this.storageService) {
            throw new StorageException(StorageErrorType.CONFIG_ERROR, "Storage service is not initialized");
        }
        return this.storageService;
    }

    /**
     * 检查存储服务是否已初始化
     * @returns 是否已初始化
     */
    isStorageInitialized(): boolean {
        return this.isInitialized && !!this.storageService;
    }

    /**
     * 获取存储健康状态
     * @returns 健康状态
     */
    getHealthStatus(): StorageHealthStatus {
        return { ...this.healthStatus };
    }

    /**
     * 执行健康检查
     * @returns 健康检查结果
     */
    async healthCheck(): Promise<StorageHealthStatus> {
        await this.performHealthCheck();
        return this.getHealthStatus();
    }

    /**
     * 定时健康检查（每5分钟执行一次）
     */
    @Cron(CronExpression.EVERY_5_MINUTES)
    async scheduledHealthCheck(): Promise<void> {
        if (!this.isInitialized) {
            return;
        }

        try {
            await this.performHealthCheck();

            if (this.healthStatus.healthy) {
                this.logger.debug("Scheduled health check passed");
            } else {
                this.logger.warn("Scheduled health check failed", this.healthStatus.error);
            }
        } catch (error) {
            this.logger.error("Scheduled health check error", error);
        }
    }

    /**
     * 执行实际的健康检查
     */
    private async performHealthCheck(): Promise<void> {
        const startTime = Date.now();
        const provider = this.storageFactory.getStorageProvider();

        try {
            if (!this.storageService) {
                throw new Error("Storage service is not available");
            }

            // 根据存储提供商执行不同的健康检查
            switch (provider) {
                case "minio":
                    await this.checkMinioHealth();
                    break;
                case "aliyun":
                    await this.checkAliyunHealth();
                    break;
                default:
                    throw new Error(`Unsupported storage provider: ${provider}`);
            }

            const responseTime = Date.now() - startTime;

            this.healthStatus = {
                healthy: true,
                provider,
                lastCheck: new Date(),
                responseTime,
            };

            this.logger.debug(`Health check passed for ${provider} (${responseTime}ms)`);
        } catch (error) {
            const responseTime = Date.now() - startTime;

            this.healthStatus = {
                healthy: false,
                provider,
                lastCheck: new Date(),
                error: error.message,
                responseTime,
            };

            this.logger.warn(`Health check failed for ${provider}: ${error.message}`);
        }
    }

    /**
     * MinIO 健康检查
     */
    private async checkMinioHealth(): Promise<void> {
        try {
            // 尝试检查一个不存在的文件，如果服务正常应该返回 false
            const testKey = `health-check-${Date.now()}`;
            await this.storageService.fileExists(testKey);

            this.logger.debug("MinIO health check completed");
        } catch (error) {
            // 如果是连接错误或配置错误，则认为不健康
            if (
                error.message.includes("ECONNREFUSED") ||
                error.message.includes("ENOTFOUND") ||
                error.message.includes("Invalid credentials")
            ) {
                throw error;
            }

            // 其他错误可能是正常的（比如文件不存在），认为服务是健康的
            this.logger.debug("MinIO service is responding normally");
        }
    }

    /**
     * 阿里云 OSS 健康检查
     */
    private async checkAliyunHealth(): Promise<void> {
        try {
            // 尝试检查一个不存在的文件
            const testKey = `health-check-${Date.now()}`;
            await this.storageService.fileExists(testKey);

            this.logger.debug("Aliyun OSS health check completed");
        } catch (error) {
            // 如果是认证错误或网络错误，则认为不健康
            if (
                error.message.includes("InvalidAccessKeyId") ||
                error.message.includes("SignatureDoesNotMatch") ||
                error.message.includes("ENOTFOUND")
            ) {
                throw error;
            }

            // 其他错误可能是正常的，认为服务是健康的
            this.logger.debug("Aliyun OSS service is responding normally");
        }
    }

    /**
     * 重新初始化存储服务（用于配置更新后）
     */
    async reinitializeStorage(): Promise<void> {
        this.logger.log("Reinitializing storage service...");

        try {
            // 重置工厂
            this.storageFactory.reset();

            // 重新初始化
            this.isInitialized = false;
            this.storageService = null;

            await this.initializeStorage();

            this.logger.log("Storage service reinitialized successfully");
        } catch (error) {
            this.logger.error("Failed to reinitialize storage service", error);
            throw error;
        }
    }

    /**
     * 获取存储提供商类型
     * @returns 存储提供商类型
     */
    getStorageProvider(): string {
        return this.storageFactory.getStorageProvider();
    }

    /**
     * 获取存储服务统计信息
     * @returns 统计信息
     */
    getStorageStats(): any {
        return {
            provider: this.storageFactory.getStorageProvider(),
            initialized: this.isInitialized,
            healthy: this.healthStatus.healthy,
            lastHealthCheck: this.healthStatus.lastCheck,
            responseTime: this.healthStatus.responseTime,
        };
    }

    /**
     * 测试存储连接
     * @returns 测试结果
     */
    async testConnection(): Promise<{ success: boolean; message: string; responseTime?: number }> {
        const startTime = Date.now();

        try {
            if (!this.storageService) {
                return {
                    success: false,
                    message: "Storage service is not initialized",
                };
            }

            // 执行一个简单的操作来测试连接
            const testKey = `connection-test-${Date.now()}`;
            await this.storageService.fileExists(testKey);

            const responseTime = Date.now() - startTime;

            return {
                success: true,
                message: "Connection test successful",
                responseTime,
            };
        } catch (error) {
            const responseTime = Date.now() - startTime;

            return {
                success: false,
                message: `Connection test failed: ${error.message}`,
                responseTime,
            };
        }
    }
}

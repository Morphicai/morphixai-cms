import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { IStorageService } from "../interfaces/storage.interface";
import { StorageConfig, MinioConfig, AliyunOssConfig } from "../interfaces/config.interface";
import { ConfigLoader, ConfigValidator } from "../config";
import { StorageException, StorageErrorType, ConfigurationException } from "../exceptions/storage.exception";
import { MinioService } from "../minio.service";
import { AliyunOssService } from "../aliyun-oss.service";
import { MemoryStorageService } from "../memory-storage.service";

/**
 * 存储工厂类
 * 根据环境配置创建相应的存储服务实例
 */
@Injectable()
export class StorageFactory {
    private readonly logger = new Logger(StorageFactory.name);
    private storageService: IStorageService;

    constructor(private readonly configService: ConfigService) {}

    /**
     * 创建存储服务实例
     * @returns 存储服务实例
     */
    create(): IStorageService {
        if (this.storageService) {
            return this.storageService;
        }

        try {
            const config = ConfigLoader.loadStorageConfig();

            // 打印存储配置信息
            this.logger.log("=".repeat(80));
            this.logger.log(`🗄️  Storage Service Initialization`);
            this.logger.log(`   Provider: ${config.provider.toUpperCase()}`);

            if (config.provider === "minio" && config.minio) {
                this.logger.log(`   MinIO Endpoint: ${config.minio.endPoint}:${config.minio.port}`);
                this.logger.log(`   MinIO Bucket: ${config.minio.bucketName}`);
                this.logger.log(`   MinIO SSL: ${config.minio.useSSL ? "Enabled" : "Disabled"}`);
            } else if (config.provider === "aliyun" && config.aliyun) {
                this.logger.log(`   Aliyun Region: ${config.aliyun.region}`);
                this.logger.log(`   Aliyun Bucket: ${config.aliyun.bucket}`);
                this.logger.log(`   Aliyun Endpoint: ${config.aliyun.endpoint || "Default"}`);
            }
            this.logger.log("=".repeat(80));

            // 验证配置
            const validation = ConfigValidator.validateStorageConfig(config);
            if (!validation.isValid) {
                throw new ConfigurationException(
                    `Storage configuration validation failed: ${validation.errors.join(", ")}`,
                );
            }

            // 根据提供商创建服务实例
            this.storageService = this.createServiceInstance(config);

            this.logger.log(`✓ Storage service initialized successfully with provider: ${config.provider}`);
            return this.storageService;
        } catch (error) {
            this.logger.error("Failed to create storage service", error);

            if (error instanceof StorageException) {
                throw error;
            }

            // 尝试使用默认 MinIO 配置作为降级方案
            return this.createFallbackService();
        }
    }

    /**
     * 根据配置创建服务实例
     * @param config 存储配置
     * @returns 存储服务实例
     */
    private createServiceInstance(config: StorageConfig): IStorageService {
        switch (config.provider) {
            case "memory":
                // 内存存储只允许在测试环境中使用
                if (!this.isTestEnvironment()) {
                    this.logger.error("Memory storage is not allowed in production environment");
                    throw new ConfigurationException(
                        "Memory storage is only allowed in test environment. Please use MinIO or Aliyun OSS for production.",
                    );
                }
                this.logger.log("Using memory storage for testing environment");
                return new MemoryStorageService();

            case "minio":
                if (!config.minio) {
                    throw new ConfigurationException("MinIO configuration is missing");
                }
                return this.createMinioService(config.minio);

            case "aliyun":
                if (!config.aliyun) {
                    throw new ConfigurationException("Aliyun OSS configuration is missing");
                }
                return this.createAliyunService(config.aliyun);

            default:
                throw new ConfigurationException(`Unsupported storage provider: ${config.provider}`);
        }
    }

    /**
     * 创建 MinIO 服务实例
     * @param config MinIO 配置
     * @returns MinIO 服务实例
     */
    private createMinioService(config: MinioConfig): IStorageService {
        try {
            return new MinioService(config);
        } catch (error) {
            throw new ConfigurationException(`Failed to create MinIO service: ${error.message}`, error);
        }
    }

    /**
     * 创建阿里云 OSS 服务实例
     * @param config 阿里云 OSS 配置
     * @returns 阿里云 OSS 服务实例
     */
    private createAliyunService(config: AliyunOssConfig): IStorageService {
        try {
            return new AliyunOssService(config);
        } catch (error) {
            throw new ConfigurationException(`Failed to create Aliyun OSS service: ${error.message}`, error);
        }
    }

    /**
     * 创建降级服务（默认 MinIO）
     * @returns 降级存储服务实例
     */
    private createFallbackService(): IStorageService {
        this.logger.warn("Using fallback MinIO configuration due to configuration errors");

        try {
            const fallbackConfig: MinioConfig = {
                endPoint: "localhost",
                port: 9000,
                useSSL: false,
                accessKey: "minioadmin",
                secretKey: "minioadmin123",
                bucketName: "uploads",
                thumbnailBucket: "thumbnails",
                region: "us-east-1",
            };

            // 验证降级配置
            const validation = ConfigValidator.validateMinioConfig(fallbackConfig);
            if (!validation.isValid) {
                throw new ConfigurationException(`Fallback configuration is invalid: ${validation.errors.join(", ")}`);
            }

            return this.createMinioService(fallbackConfig);
        } catch (error) {
            throw new StorageException(
                StorageErrorType.CONFIG_ERROR,
                "Failed to create fallback storage service",
                error,
            );
        }
    }

    /**
     * 获取当前存储提供商类型
     * @returns 存储提供商类型
     */
    getStorageProvider(): string {
        return ConfigLoader.getStorageProvider();
    }

    /**
     * 检查存储服务是否已初始化
     * @returns 是否已初始化
     */
    isInitialized(): boolean {
        return !!this.storageService;
    }

    /**
     * 重置存储服务（用于配置更新后重新初始化）
     */
    reset(): void {
        this.storageService = null;
        this.logger.log("Storage service has been reset");
    }

    /**
     * 检查是否为测试环境
     * @returns 是否为测试环境
     */
    private isTestEnvironment(): boolean {
        const nodeEnv = process.env.NODE_ENV;
        const testMode = process.env.TEST_MODE;

        // 只有在明确的测试环境中才允许使用内存存储
        const isTestEnv = nodeEnv === "e2e" || testMode === "true";

        if (isTestEnv) {
            this.logger.log(`E2E test environment detected: NODE_ENV=${nodeEnv}, TEST_MODE=${testMode}`);
        } else {
            this.logger.log(`Production environment detected: NODE_ENV=${nodeEnv}, TEST_MODE=${testMode}`);
        }

        return isTestEnv;
    }
}

/**
 * 静态工厂方法（用于非依赖注入场景）
 */
export class StaticStorageFactory {
    private static instance: IStorageService;

    /**
     * 创建存储服务实例
     * @returns 存储服务实例
     */
    static create(): IStorageService {
        if (StaticStorageFactory.instance) {
            return StaticStorageFactory.instance;
        }

        const config = ConfigLoader.loadStorageConfig();

        // 验证配置
        const validation = ConfigValidator.validateStorageConfig(config);
        if (!validation.isValid) {
            throw new ConfigurationException(`Storage configuration error: ${validation.errors.join(", ")}`);
        }

        // 根据提供商创建服务
        switch (config.provider) {
            case "memory":
                // 内存存储只允许在测试环境中使用
                if (!StaticStorageFactory.isTestEnvironment()) {
                    throw new ConfigurationException(
                        "Memory storage is only allowed in test environment. Please use MinIO or Aliyun OSS for production.",
                    );
                }
                console.log("Using memory storage for testing environment");
                StaticStorageFactory.instance = new MemoryStorageService();
                break;

            case "minio":
                if (!config.minio) {
                    throw new ConfigurationException("MinIO configuration is missing");
                }
                StaticStorageFactory.instance = new MinioService(config.minio);
                break;

            case "aliyun":
                if (!config.aliyun) {
                    throw new ConfigurationException("Aliyun OSS configuration is missing");
                }
                StaticStorageFactory.instance = new AliyunOssService(config.aliyun);
                break;

            default:
                // 默认使用 MinIO
                console.warn("No valid storage configuration found, using default MinIO settings");
                const defaultConfig = ConfigLoader.loadMinioConfig();
                StaticStorageFactory.instance = new MinioService(defaultConfig);
                break;
        }

        return StaticStorageFactory.instance;
    }

    /**
     * 重置实例
     */
    static reset(): void {
        StaticStorageFactory.instance = null;
    }

    /**
     * 检查是否为测试环境
     * @returns 是否为测试环境
     */
    private static isTestEnvironment(): boolean {
        const nodeEnv = process.env.NODE_ENV;
        const testMode = process.env.TEST_MODE;

        // 只有在明确的测试环境中才允许使用内存存储
        const isTestEnv = nodeEnv === "e2e" || testMode === "true";

        if (isTestEnv) {
            console.log(`E2E test environment detected: NODE_ENV=${nodeEnv}, TEST_MODE=${testMode}`);
        } else {
            console.log(`Production environment detected: NODE_ENV=${nodeEnv}, TEST_MODE=${testMode}`);
        }

        return isTestEnv;
    }
}

import { Injectable, Logger } from "@nestjs/common";
import { IStorageService } from "../interfaces/storage.interface";
import { StorageProvider } from "../interfaces/config.interface";
import { StorageFactory } from "../factory/storage.factory";
import { ConfigLoader } from "../config";
import { StorageException, StorageErrorType, ConfigurationException } from "../exceptions/storage.exception";

/**
 * 存储提供商解析器
 * 负责解析存储提供商、验证有效性和获取存储服务实例
 */
@Injectable()
export class StorageProviderResolver {
    private readonly logger = new Logger(StorageProviderResolver.name);
    private readonly SUPPORTED_PROVIDERS: StorageProvider[] = ["aliyun", "minio"];
    private storageServiceCache = new Map<string, IStorageService>();

    constructor(private readonly storageFactory: StorageFactory) {}

    /**
     * 解析存储提供商
     * @param requestedProvider 请求的存储提供商
     * @returns 解析后的存储提供商
     */
    resolveProvider(requestedProvider?: string): string {
        try {
            // 如果没有指定提供商，使用默认配置的提供商
            if (!requestedProvider) {
                const defaultProvider = this.getDefaultProvider();
                this.logger.debug(`Using default storage provider: ${defaultProvider}`);
                return defaultProvider;
            }

            // 验证请求的提供商是否有效
            if (!this.validateProvider(requestedProvider)) {
                this.logger.warn(`Invalid storage provider requested: ${requestedProvider}, falling back to default`);
                const defaultProvider = this.getDefaultProvider();
                this.logger.debug(`Using fallback storage provider: ${defaultProvider}`);
                return defaultProvider;
            }

            // 检查请求的提供商是否与当前配置匹配
            const configuredProvider = this.getDefaultProvider();
            if (requestedProvider !== configuredProvider) {
                this.logger.warn(
                    `Requested provider (${requestedProvider}) differs from configured provider (${configuredProvider})`,
                );

                // 根据策略决定是否允许使用不同的提供商
                // 目前的策略是使用配置的提供商，但记录警告
                this.logger.debug(`Using configured provider: ${configuredProvider}`);
                return configuredProvider;
            }

            this.logger.debug(`Using requested storage provider: ${requestedProvider}`);
            return requestedProvider;
        } catch (error) {
            this.logger.error("Failed to resolve storage provider", error);

            // 发生错误时，尝试使用默认提供商
            try {
                const defaultProvider = this.getDefaultProvider();
                this.logger.warn(`Error resolving provider, using default: ${defaultProvider}`);
                return defaultProvider;
            } catch (fallbackError) {
                throw new ConfigurationException(`Failed to resolve storage provider: ${error.message}`, error);
            }
        }
    }

    /**
     * 获取存储服务实例
     * @param provider 存储提供商
     * @returns 存储服务实例
     */
    getStorageService(provider: string): IStorageService {
        try {
            // 验证提供商
            if (!this.validateProvider(provider)) {
                throw new ConfigurationException(`Invalid storage provider: ${provider}`);
            }

            // 检查缓存
            if (this.storageServiceCache.has(provider)) {
                const cachedService = this.storageServiceCache.get(provider);
                this.logger.debug(`Using cached storage service for provider: ${provider}`);
                return cachedService;
            }

            // 获取当前配置的提供商
            const configuredProvider = this.getDefaultProvider();

            // 如果请求的提供商与配置的不同，记录警告但继续使用配置的提供商
            if (provider !== configuredProvider) {
                this.logger.warn(
                    `Requested provider (${provider}) differs from configured provider (${configuredProvider}), using configured provider`,
                );
            }

            // 创建存储服务实例
            const storageService = this.storageFactory.create();

            // 缓存服务实例（使用配置的提供商作为缓存键）
            this.storageServiceCache.set(configuredProvider, storageService);

            this.logger.debug(`Created storage service for provider: ${configuredProvider}`);
            return storageService;
        } catch (error) {
            this.logger.error(`Failed to get storage service for provider: ${provider}`, error);

            if (error instanceof StorageException || error instanceof ConfigurationException) {
                throw error;
            }

            throw new StorageException(
                StorageErrorType.CONFIG_ERROR,
                `Failed to get storage service for provider ${provider}: ${error.message}`,
                error,
            );
        }
    }

    /**
     * 验证存储提供商有效性
     * @param provider 存储提供商
     * @returns 是否有效
     */
    validateProvider(provider: string): boolean {
        if (!provider || typeof provider !== "string") {
            return false;
        }

        const normalizedProvider = provider.toLowerCase().trim();
        const isSupported = this.SUPPORTED_PROVIDERS.includes(normalizedProvider as StorageProvider);

        if (!isSupported) {
            this.logger.debug(`Unsupported storage provider: ${provider}`);
        }

        return isSupported;
    }

    /**
     * 获取默认存储提供商
     * @returns 默认存储提供商
     */
    getDefaultProvider(): string {
        try {
            return this.storageFactory.getStorageProvider();
        } catch (error) {
            this.logger.error("Failed to get default storage provider from factory", error);

            // 尝试直接从配置加载
            try {
                const config = ConfigLoader.loadStorageConfig();
                return config.provider;
            } catch (configError) {
                this.logger.error("Failed to load storage config", configError);
                throw new ConfigurationException("Unable to determine default storage provider", configError);
            }
        }
    }

    /**
     * 获取支持的存储提供商列表
     * @returns 支持的存储提供商列表
     */
    getSupportedProviders(): StorageProvider[] {
        return [...this.SUPPORTED_PROVIDERS];
    }

    /**
     * 检查指定提供商是否已配置
     * @param provider 存储提供商
     * @returns 是否已配置
     */
    isProviderConfigured(provider: string): boolean {
        try {
            if (!this.validateProvider(provider)) {
                return false;
            }

            const config = ConfigLoader.loadStorageConfig();

            switch (provider) {
                case "aliyun":
                    return !!config.aliyun && this.isAliyunConfigValid(config.aliyun);
                case "minio":
                    return !!config.minio && this.isMinioConfigValid(config.minio);
                default:
                    return false;
            }
        } catch (error) {
            this.logger.debug(`Provider ${provider} configuration check failed`, error);
            return false;
        }
    }

    /**
     * 获取提供商配置状态
     * @returns 提供商配置状态
     */
    getProviderStatus(): Record<string, { configured: boolean; active: boolean }> {
        const status: Record<string, { configured: boolean; active: boolean }> = {};
        const activeProvider = this.getDefaultProvider();

        for (const provider of this.SUPPORTED_PROVIDERS) {
            status[provider] = {
                configured: this.isProviderConfigured(provider),
                active: provider === activeProvider,
            };
        }

        return status;
    }

    /**
     * 清除存储服务缓存
     * @param provider 可选，指定要清除的提供商，不指定则清除所有
     */
    clearCache(provider?: string): void {
        if (provider) {
            this.storageServiceCache.delete(provider);
            this.logger.debug(`Cleared cache for provider: ${provider}`);
        } else {
            this.storageServiceCache.clear();
            this.logger.debug("Cleared all storage service cache");
        }
    }

    /**
     * 验证阿里云 OSS 配置有效性
     * @param config 阿里云 OSS 配置
     * @returns 是否有效
     */
    private isAliyunConfigValid(config: any): boolean {
        const requiredFields = ["region", "accessKeyId", "accessKeySecret", "bucket"];
        return requiredFields.every((field) => config[field] && typeof config[field] === "string");
    }

    /**
     * 验证 MinIO 配置有效性
     * @param config MinIO 配置
     * @returns 是否有效
     */
    private isMinioConfigValid(config: any): boolean {
        const requiredFields = ["endPoint", "accessKey", "secretKey", "bucketName"];
        const hasRequiredFields = requiredFields.every((field) => config[field] && typeof config[field] === "string");

        const hasValidPort = typeof config.port === "number" && config.port > 0 && config.port <= 65535;

        const hasValidSSL = typeof config.useSSL === "boolean";

        return hasRequiredFields && hasValidPort && hasValidSSL;
    }
}

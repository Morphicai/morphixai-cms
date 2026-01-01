import { Injectable, Logger } from "@nestjs/common";
import { IStorageService } from "../interfaces/storage.interface";
import { StorageFactory } from "../factory/storage.factory";
import { StorageException, StorageErrorType, ConfigurationException } from "../exceptions/storage.exception";
import { MemoryCache } from "../../../shared/cache/memory-cache";

/**
 * 临时 URL 选项接口
 */
export interface TemporaryUrlOptions {
    /** 存储提供商，可选，默认使用配置中的提供商 */
    provider?: string;
    /** 过期时间（秒），可选，默认使用 1 小时 */
    expiresIn?: number;
}

/**
 * 临时 URL 响应接口
 */
export interface TemporaryUrlResponse {
    /** 临时访问 URL */
    temporaryUrl: string;
    /** 过期时间 */
    expiresAt: Date;
    /** 使用的存储提供商 */
    provider: string;
    /** 文件键名 */
    fileKey: string;
}

/**
 * 缓存条目接口
 */
interface CachedUrlEntry {
    /** 缓存键 */
    cacheKey: string;
    /** 文件键名 */
    fileKey: string;
    /** 存储提供商 */
    provider: string;
    /** 临时 URL */
    temporaryUrl: string;
    /** URL 过期时间 */
    expiresAt: Date;
    /** 过期时间（秒） */
    expiresIn: number;
}

/**
 * 临时 URL 生成服务
 * 负责生成临时访问 URL 和文件访问验证
 */
@Injectable()
export class TemporaryUrlService {
    private readonly logger = new Logger(TemporaryUrlService.name);
    private readonly DEFAULT_EXPIRES_IN = 3600; // 1小时
    private readonly CACHE_BUFFER_TIME = 300; // 缓存提前5分钟过期（预留时间）
    private readonly MAX_CACHE_SIZE = 1000; // 最大缓存条目数

    /** 临时 URL 缓存 */
    private readonly urlCache: MemoryCache<CachedUrlEntry>;

    constructor(private readonly storageFactory: StorageFactory) {
        // 初始化缓存，使用 fileKey 和 provider 作为索引
        this.urlCache = new MemoryCache<CachedUrlEntry>({
            maxSize: this.MAX_CACHE_SIZE,
            indexKeys: ["fileKey", "provider", "cacheKey"],
        });
    }

    /**
     * 生成临时访问 URL
     * @param fileKey 文件键名
     * @param options 临时 URL 选项
     * @returns 临时 URL 响应
     */
    async generateTemporaryUrl(fileKey: string, options: TemporaryUrlOptions = {}): Promise<TemporaryUrlResponse> {
        try {
            this.logger.debug(`Generating temporary URL for file: ${fileKey}`);

            // 验证文件键名
            this.validateFileKey(fileKey);

            // 解析存储提供商
            const provider = options.provider || this.storageFactory.getStorageProvider();
            this.logger.debug(`Using storage provider: ${provider}`);

            // 设置过期时间
            const expiresIn = options.expiresIn || this.DEFAULT_EXPIRES_IN;

            // 尝试从缓存获取
            const cachedEntry = this.getCachedUrl(fileKey, provider, expiresIn);
            if (cachedEntry) {
                this.logger.debug(`Using cached temporary URL for ${fileKey}`);
                return {
                    temporaryUrl: cachedEntry.temporaryUrl,
                    expiresAt: cachedEntry.expiresAt,
                    provider: cachedEntry.provider,
                    fileKey: cachedEntry.fileKey,
                };
            }

            // 验证文件是否存在
            await this.validateFileAccess(fileKey, provider);

            // 计算过期时间
            const expiresAt = new Date(Date.now() + expiresIn * 1000);

            // 根据提供商生成临时 URL
            const temporaryUrl = await this.generateUrlByProvider(fileKey, provider, expiresIn);

            // 缓存生成的 URL
            this.cacheUrl(fileKey, provider, temporaryUrl, expiresAt, expiresIn);

            const response: TemporaryUrlResponse = {
                temporaryUrl,
                expiresAt,
                provider,
                fileKey,
            };

            this.logger.debug(`Temporary URL generated successfully for ${fileKey}`);
            return response;
        } catch (error) {
            this.logger.error(`Failed to generate temporary URL for ${fileKey}`, error);

            if (error instanceof StorageException || error instanceof ConfigurationException) {
                throw error;
            }

            throw new StorageException(
                StorageErrorType.SIGNING_ERROR,
                `Failed to generate temporary URL for ${fileKey}: ${error.message}`,
                error,
            );
        }
    }

    /**
     * 验证文件访问权限
     * @param fileKey 文件键名
     * @param provider 存储提供商
     * @returns 是否有访问权限
     */
    async validateFileAccess(fileKey: string, provider?: string): Promise<boolean> {
        try {
            this.logger.debug(`Validating file access for: ${fileKey}`);

            // 验证文件键名
            this.validateFileKey(fileKey);

            // 获取存储服务实例
            const storageService = this.getStorageServiceByProvider(provider);

            // 检查文件是否存在
            const exists = await storageService.fileExists(fileKey);

            if (!exists) {
                throw new StorageException(StorageErrorType.FILE_NOT_FOUND, `File not found: ${fileKey}`);
            }

            this.logger.debug(`File access validation passed for: ${fileKey}`);
            return true;
        } catch (error) {
            this.logger.warn(`File access validation failed for ${fileKey}`, error);

            if (error instanceof StorageException) {
                throw error;
            }

            throw new StorageException(
                StorageErrorType.CONNECTION_ERROR,
                `Failed to validate file access for ${fileKey}: ${error.message}`,
                error,
            );
        }
    }

    /**
     * 根据存储提供商生成临时 URL
     * @param fileKey 文件键名
     * @param provider 存储提供商
     * @param expiresIn 过期时间（秒）
     * @returns 临时 URL
     */
    private async generateUrlByProvider(fileKey: string, provider: string, expiresIn: number): Promise<string> {
        try {
            // 获取存储服务实例
            const storageService = this.getStorageServiceByProvider(provider);

            // 使用存储服务的 generateTemporaryUrl 方法
            return await storageService.generateTemporaryUrl(fileKey, { expiresIn });
        } catch (error) {
            throw new StorageException(
                StorageErrorType.SIGNING_ERROR,
                `Failed to generate temporary URL for provider ${provider}: ${error.message}`,
                error,
            );
        }
    }

    /**
     * 根据提供商获取存储服务实例
     * @param provider 存储提供商
     * @returns 存储服务实例
     */
    private getStorageServiceByProvider(provider?: string): IStorageService {
        // 如果没有指定提供商，使用默认的存储服务
        if (!provider) {
            return this.storageFactory.create();
        }

        // 验证提供商是否与当前配置匹配
        const currentProvider = this.storageFactory.getStorageProvider();
        if (provider !== currentProvider) {
            this.logger.warn(
                `Requested provider (${provider}) differs from configured provider (${currentProvider}), using configured provider`,
            );
        }

        return this.storageFactory.create();
    }

    /**
     * 验证文件键名
     * @param fileKey 文件键名
     */
    private validateFileKey(fileKey: string): void {
        if (!fileKey || typeof fileKey !== "string") {
            throw new ConfigurationException("File key must be a non-empty string");
        }

        // 防止路径遍历攻击
        if (fileKey.includes("..") || fileKey.includes("//")) {
            throw new ConfigurationException("Invalid file key: path traversal detected");
        }

        // 检查危险字符
        const dangerousChars = /[<>:"|?*\x00-\x1f]/;
        if (dangerousChars.test(fileKey)) {
            throw new ConfigurationException("Invalid file key: contains dangerous characters");
        }

        // 检查文件键名长度
        if (fileKey.length > 1024) {
            throw new ConfigurationException("File key is too long (max 1024 characters)");
        }
    }

    /**
     * 获取默认过期时间
     * @returns 默认过期时间（秒）
     */
    getDefaultExpiresIn(): number {
        return this.DEFAULT_EXPIRES_IN;
    }

    /**
     * 生成缓存键
     * @param fileKey 文件键名
     * @param provider 存储提供商
     * @param expiresIn 过期时间（秒）
     * @returns 缓存键
     */
    private generateCacheKey(fileKey: string, provider: string, expiresIn: number): string {
        return `${provider}:${fileKey}:${expiresIn}`;
    }

    /**
     * 从缓存获取临时 URL
     * @param fileKey 文件键名
     * @param provider 存储提供商
     * @param expiresIn 过期时间（秒）
     * @returns 缓存的 URL 条目或 undefined
     */
    private getCachedUrl(fileKey: string, provider: string, expiresIn: number): CachedUrlEntry | undefined {
        const cacheKey = this.generateCacheKey(fileKey, provider, expiresIn);
        const cachedEntry = this.urlCache.get(cacheKey);

        if (cachedEntry) {
            this.logger.debug(`Cache hit for ${cacheKey}, hit rate: ${(this.urlCache.getHitRate() * 100).toFixed(2)}%`);
        }

        return cachedEntry;
    }

    /**
     * 缓存临时 URL
     * @param fileKey 文件键名
     * @param provider 存储提供商
     * @param temporaryUrl 临时 URL
     * @param expiresAt URL 过期时间
     * @param expiresIn 过期时间（秒）
     */
    private cacheUrl(
        fileKey: string,
        provider: string,
        temporaryUrl: string,
        expiresAt: Date,
        expiresIn: number,
    ): void {
        const cacheKey = this.generateCacheKey(fileKey, provider, expiresIn);

        // 计算缓存 TTL：URL 过期时间减去缓冲时间（预留5分钟）
        // 确保缓存在 URL 实际过期前就失效，避免返回即将过期的 URL
        const cacheTtl = Math.max((expiresIn - this.CACHE_BUFFER_TIME) * 1000, 0);

        if (cacheTtl <= 0) {
            this.logger.warn(`Cache TTL is too short for ${cacheKey}, skipping cache`);
            return;
        }

        const entry: CachedUrlEntry = {
            cacheKey,
            fileKey,
            provider,
            temporaryUrl,
            expiresAt,
            expiresIn,
        };

        this.urlCache.set(cacheKey, entry, cacheTtl);
        this.logger.debug(
            `Cached temporary URL for ${cacheKey}, cache TTL: ${cacheTtl}ms, URL expires at: ${expiresAt.toISOString()}`,
        );
    }

    /**
     * 清除指定文件的缓存
     * @param fileKey 文件键名
     * @param provider 存储提供商（可选）
     */
    clearCache(fileKey: string, provider?: string): void {
        if (provider) {
            // 清除特定提供商的缓存
            const entries = this.urlCache.getAllEntries();
            entries
                .filter((entry) => entry.fileKey === fileKey && entry.provider === provider)
                .forEach((entry) => this.urlCache.delete(entry.cacheKey));

            this.logger.debug(`Cleared cache for ${fileKey} with provider ${provider}`);
        } else {
            // 清除所有提供商的缓存
            const entries = this.urlCache.getAllEntries();
            entries
                .filter((entry) => entry.fileKey === fileKey)
                .forEach((entry) => this.urlCache.delete(entry.cacheKey));

            this.logger.debug(`Cleared all cache entries for ${fileKey}`);
        }
    }

    /**
     * 清除所有缓存
     */
    clearAllCache(): void {
        this.urlCache.clear();
        this.logger.debug("Cleared all temporary URL cache");
    }

    /**
     * 获取缓存统计信息
     * @returns 缓存统计信息
     */
    getCacheStats(): {
        size: number;
        hitRate: number;
        maxSize: number;
    } {
        return {
            size: this.urlCache.size,
            hitRate: this.urlCache.getHitRate(),
            maxSize: this.MAX_CACHE_SIZE,
        };
    }
}

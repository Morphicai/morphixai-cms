import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";

/**
 * 缓存文件项
 */
interface CachedFile {
    /** 文件内容 */
    buffer: Buffer;
    /** 文件大小（字节） */
    size: number;
    /** 内容类型 */
    contentType: string;
    /** 其他响应头 */
    headers: Record<string, string>;
    /** 缓存时间 */
    cachedAt: Date;
    /** 最后访问时间 */
    lastAccessedAt: Date;
    /** 访问次数 */
    accessCount: number;
}

/**
 * 缓存统计信息
 */
interface CacheStats {
    /** 缓存命中次数 */
    hits: number;
    /** 缓存未命中次数 */
    misses: number;
    /** 当前缓存文件数 */
    fileCount: number;
    /** 当前缓存总大小（字节） */
    totalSize: number;
    /** 缓存命中率 */
    hitRate: number;
    /** 正在进行中的请求数 */
    inflightRequestCount: number;
}

/**
 * 文件缓存服务
 * 使用 LRU (Least Recently Used) 策略管理文件缓存
 */
@Injectable()
export class FileCacheService {
    private readonly logger = new Logger(FileCacheService.name);

    /** 缓存存储 Map<cacheKey, CachedFile> */
    private cache = new Map<string, CachedFile>();

    /** 飞行中的请求 Map<cacheKey, Promise<CachedFile>> */
    private inflightRequests = new Map<string, Promise<CachedFile>>();

    /** 最大缓存文件数量 */
    private readonly maxFiles: number;

    /** 最大缓存总大小（字节） */
    private readonly maxTotalSize: number;

    /** 最大单个文件大小（字节） */
    private readonly maxFileSize: number;

    /** 缓存过期时间（毫秒） */
    private readonly cacheTtl: number;

    /** 统计信息 */
    private stats = {
        hits: 0,
        misses: 0,
    };

    constructor() {
        // 从环境变量读取配置，提供默认值
        this.maxFiles = parseInt(process.env.FILE_CACHE_MAX_FILES || "100", 10);
        this.maxTotalSize = parseInt(process.env.FILE_CACHE_MAX_SIZE || String(100 * 1024 * 1024), 10); // 默认 100MB
        this.maxFileSize = parseInt(process.env.FILE_CACHE_MAX_FILE_SIZE || String(10 * 1024 * 1024), 10); // 默认 10MB
        this.cacheTtl = parseInt(process.env.FILE_CACHE_TTL || String(30 * 60 * 1000), 10); // 默认 30 分钟

        this.logger.log(`File cache initialized:`);
        this.logger.log(`  - Max files: ${this.maxFiles}`);
        this.logger.log(`  - Max total size: ${(this.maxTotalSize / 1024 / 1024).toFixed(2)}MB`);
        this.logger.log(`  - Max file size: ${(this.maxFileSize / 1024 / 1024).toFixed(2)}MB`);
        this.logger.log(`  - Cache TTL: ${(this.cacheTtl / 1000 / 60).toFixed(2)} minutes`);
    }

    /**
     * 生成缓存键
     */
    private getCacheKey(fileKey: string, provider: string): string {
        return `${provider}:${fileKey}`;
    }

    /**
     * 获取当前缓存总大小
     */
    private getCurrentCacheSize(): number {
        let totalSize = 0;
        for (const cached of this.cache.values()) {
            totalSize += cached.size;
        }
        return totalSize;
    }

    /**
     * 检查缓存项是否过期
     */
    private isExpired(cached: CachedFile): boolean {
        const now = Date.now();
        const cacheAge = now - cached.cachedAt.getTime();
        return cacheAge > this.cacheTtl;
    }

    /**
     * 清理过期的缓存项
     */
    private cleanupExpired(): void {
        const now = Date.now();
        let removedCount = 0;
        let removedSize = 0;

        for (const [key, cached] of this.cache.entries()) {
            if (this.isExpired(cached)) {
                removedSize += cached.size;
                this.cache.delete(key);
                removedCount++;
            }
        }

        if (removedCount > 0) {
            this.logger.debug(
                `Cleaned up ${removedCount} expired cache entries, freed ${(removedSize / 1024 / 1024).toFixed(2)}MB`,
            );
        }
    }

    /**
     * 驱逐最少使用的缓存项 (LRU)
     * 根据最后访问时间和访问次数综合判断
     */
    private evictLRU(): void {
        if (this.cache.size === 0) return;

        // 找出最少使用的项
        let lruKey: string | null = null;
        let lruScore = Infinity;

        for (const [key, cached] of this.cache.entries()) {
            // 计算 LRU 分数：越小越应该被驱逐
            // 综合考虑最后访问时间和访问次数
            const timeSinceLastAccess = Date.now() - cached.lastAccessedAt.getTime();
            const score = cached.accessCount * 1000 - timeSinceLastAccess;

            if (score < lruScore) {
                lruScore = score;
                lruKey = key;
            }
        }

        if (lruKey) {
            const cached = this.cache.get(lruKey);
            if (cached) {
                this.cache.delete(lruKey);
                this.logger.debug(
                    `Evicted LRU cache entry: ${lruKey}, size: ${(cached.size / 1024).toFixed(2)}KB, ` +
                        `access count: ${cached.accessCount}, last accessed: ${cached.lastAccessedAt.toISOString()}`,
                );
            }
        }
    }

    /**
     * 确保有足够的缓存空间
     */
    private ensureCacheSpace(requiredSize: number): void {
        // 首先清理过期项
        this.cleanupExpired();

        // 检查文件数量限制
        while (this.cache.size >= this.maxFiles) {
            this.evictLRU();
        }

        // 检查总大小限制
        while (this.getCurrentCacheSize() + requiredSize > this.maxTotalSize && this.cache.size > 0) {
            this.evictLRU();
        }
    }

    /**
     * 从缓存获取文件
     */
    async get(fileKey: string, provider: string): Promise<CachedFile | null> {
        const cacheKey = this.getCacheKey(fileKey, provider);
        const cached = this.cache.get(cacheKey);

        if (!cached) {
            this.stats.misses++;
            this.logger.debug(`Cache miss: ${cacheKey}`);
            return null;
        }

        // 检查是否过期
        if (this.isExpired(cached)) {
            this.cache.delete(cacheKey);
            this.stats.misses++;
            this.logger.debug(`Cache expired: ${cacheKey}`);
            return null;
        }

        // 更新访问信息
        cached.lastAccessedAt = new Date();
        cached.accessCount++;
        this.stats.hits++;

        this.logger.debug(
            `Cache hit: ${cacheKey}, size: ${(cached.size / 1024).toFixed(2)}KB, ` +
                `access count: ${cached.accessCount}`,
        );

        return cached;
    }

    /**
     * 从 OSS 获取文件并缓存
     * 使用飞行中请求机制，确保同一文件只发起一次请求
     */
    async fetchAndCache(fileKey: string, provider: string, ossUrl: string, requestId: string): Promise<CachedFile> {
        const cacheKey = this.getCacheKey(fileKey, provider);

        // 检查是否有正在进行中的请求
        const inflightRequest = this.inflightRequests.get(cacheKey);
        if (inflightRequest) {
            this.logger.debug(`[${requestId}] Reusing inflight request for: ${cacheKey}`);
            return inflightRequest;
        }

        // 创建新的请求 Promise
        const fetchPromise = this.performFetch(fileKey, provider, ossUrl, requestId, cacheKey);

        // 存储到飞行中的请求 Map
        this.inflightRequests.set(cacheKey, fetchPromise);

        // 无论成功或失败，都要清理飞行中的请求
        fetchPromise
            .finally(() => {
                this.inflightRequests.delete(cacheKey);
                this.logger.debug(`[${requestId}] Inflight request completed and removed: ${cacheKey}`);
            })
            .catch(() => {
                // 捕获错误，避免未处理的 Promise rejection
                // 实际错误已经在 performFetch 中处理
            });

        return fetchPromise;
    }

    /**
     * 执行实际的文件获取操作
     */
    private async performFetch(
        fileKey: string,
        provider: string,
        ossUrl: string,
        requestId: string,
        cacheKey: string,
    ): Promise<CachedFile> {
        this.logger.debug(`[${requestId}] Fetching file from OSS: ${ossUrl}`);

        try {
            // 从 OSS 下载文件
            const ossResponse = await axios.get(ossUrl, {
                responseType: "arraybuffer",
                timeout: 30000,
                maxRedirects: 5,
                validateStatus: (status) => status >= 200 && status < 300,
            });

            const buffer = Buffer.from(ossResponse.data);
            const fileSize = buffer.length;

            // 检查文件大小是否超过限制
            if (fileSize > this.maxFileSize) {
                this.logger.warn(
                    `[${requestId}] File too large to cache: ${(fileSize / 1024 / 1024).toFixed(2)}MB > ` +
                        `${(this.maxFileSize / 1024 / 1024).toFixed(2)}MB, skipping cache`,
                );

                // 文件太大，不缓存，但仍返回数据
                return {
                    buffer,
                    size: fileSize,
                    contentType: ossResponse.headers["content-type"] || "application/octet-stream",
                    headers: {
                        "content-length": String(fileSize),
                        "last-modified": ossResponse.headers["last-modified"] || "",
                        etag: ossResponse.headers["etag"] || "",
                        "content-disposition": ossResponse.headers["content-disposition"] || "",
                    },
                    cachedAt: new Date(),
                    lastAccessedAt: new Date(),
                    accessCount: 1,
                };
            }

            // 确保有足够的缓存空间
            this.ensureCacheSpace(fileSize);

            // 构建缓存项
            const cached: CachedFile = {
                buffer,
                size: fileSize,
                contentType: ossResponse.headers["content-type"] || "application/octet-stream",
                headers: {
                    "content-length": String(fileSize),
                    "last-modified": ossResponse.headers["last-modified"] || "",
                    etag: ossResponse.headers["etag"] || "",
                    "content-disposition": ossResponse.headers["content-disposition"] || "",
                },
                cachedAt: new Date(),
                lastAccessedAt: new Date(),
                accessCount: 1,
            };

            // 存入缓存
            this.cache.set(cacheKey, cached);

            this.logger.log(
                `[${requestId}] File cached: ${cacheKey}, size: ${(fileSize / 1024).toFixed(2)}KB, ` +
                    `total cached: ${this.cache.size} files, ` +
                    `${(this.getCurrentCacheSize() / 1024 / 1024).toFixed(2)}MB`,
            );

            return cached;
        } catch (error) {
            this.logger.error(`[${requestId}] Failed to fetch file from OSS`, error);
            throw error;
        }
    }

    /**
     * 清理指定文件的缓存
     */
    invalidate(fileKey: string, provider: string): boolean {
        const cacheKey = this.getCacheKey(fileKey, provider);
        const existed = this.cache.has(cacheKey);
        this.cache.delete(cacheKey);

        if (existed) {
            this.logger.debug(`Cache invalidated: ${cacheKey}`);
        }

        return existed;
    }

    /**
     * 清空所有缓存
     */
    clear(): void {
        const count = this.cache.size;
        const size = this.getCurrentCacheSize();
        this.cache.clear();
        this.logger.log(`Cache cleared: ${count} files, ${(size / 1024 / 1024).toFixed(2)}MB freed`);
    }

    /**
     * 获取缓存统计信息
     */
    getStats(): CacheStats {
        const totalRequests = this.stats.hits + this.stats.misses;
        const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            fileCount: this.cache.size,
            totalSize: this.getCurrentCacheSize(),
            hitRate: Math.round(hitRate * 100) / 100,
            inflightRequestCount: this.inflightRequests.size,
        };
    }

    /**
     * 定期清理过期缓存（应由调度器调用）
     */
    scheduledCleanup(): void {
        this.logger.debug("Running scheduled cache cleanup...");
        this.cleanupExpired();

        const stats = this.getStats();
        this.logger.debug(
            `Cache stats: ${stats.fileCount} files, ` +
                `${(stats.totalSize / 1024 / 1024).toFixed(2)}MB, ` +
                `${stats.inflightRequestCount} inflight requests, ` +
                `hit rate: ${stats.hitRate}% (${stats.hits}/${stats.hits + stats.misses})`,
        );
    }
}

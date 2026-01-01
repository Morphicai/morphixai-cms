import { Redis } from "ioredis";
import { ICache } from "./cache.interface";
import { MemoryCache } from "./memory-cache";
import { MemoryCacheAdapter } from "./memory-cache.adapter";
import { RedisCache } from "./redis-cache";

/**
 * 自动降级缓存 - 优先使用 Redis，不可用时自动降级到内存缓存
 * @template TValue 缓存值类型
 */
export class AutoCache<TValue extends Record<string, any>> implements ICache<TValue> {
    private redisCache: RedisCache<TValue>;
    private memoryCache: ICache<TValue>;
    private currentCache: ICache<TValue>;
    private cacheType: "redis" | "memory";

    constructor(
        redis: Redis | null,
        options: {
            maxSize: number;
            indexKeys?: string[];
            prefix?: string;
        },
    ) {
        // 初始化 Redis 缓存
        this.redisCache = new RedisCache<TValue>(redis, options);

        // 初始化内存缓存作为降级方案
        const memoryCache = new MemoryCache<TValue>({
            maxSize: options.maxSize,
            indexKeys: options.indexKeys,
        });
        this.memoryCache = new MemoryCacheAdapter<TValue>(memoryCache);

        // 根据 Redis 是否可用选择缓存实现
        if (this.redisCache.isAvailable()) {
            this.currentCache = this.redisCache;
            this.cacheType = "redis";
            console.log(`[AutoCache] 使用 Redis 缓存 (prefix: ${options.prefix || "cache"})`);
        } else {
            this.currentCache = this.memoryCache;
            this.cacheType = "memory";
            console.warn(
                `[AutoCache] Redis 不可用，降级使用内存缓存 (maxSize: ${options.maxSize})`,
            );
        }
    }

    /**
     * 获取当前使用的缓存类型
     */
    getCacheType(): "redis" | "memory" {
        return this.cacheType;
    }

    /**
     * 检查是否使用 Redis
     */
    isUsingRedis(): boolean {
        return this.cacheType === "redis";
    }

    async getHitRate(): Promise<number> {
        return this.currentCache.getHitRate();
    }

    async size(): Promise<number> {
        return this.currentCache.size();
    }

    async delete(key: string): Promise<void> {
        return this.currentCache.delete(key);
    }

    async clear(): Promise<void> {
        return this.currentCache.clear();
    }

    async get(key: string): Promise<TValue | undefined> {
        return this.currentCache.get(key);
    }

    async set(key: string, value: TValue, ttl?: number): Promise<void> {
        return this.currentCache.set(key, value, ttl);
    }

    async getAllEntries(): Promise<TValue[]> {
        return this.currentCache.getAllEntries();
    }

    async findByIndexKeyValue(indexKey: string, indexValue: any): Promise<TValue | undefined> {
        return this.currentCache.findByIndexKeyValue(indexKey, indexValue);
    }
}

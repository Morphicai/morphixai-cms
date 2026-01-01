import { Redis } from "ioredis";

/**
 * Redis 版本的 LRU 缓存，支持过期时间和索引查询
 * @template TValue 缓存值类型
 *
 * 环境变量要求：
 * - REDIS_ENABLED: 是否启用 Redis 缓存（true/false）
 * - REDIS_HOST: Redis 服务器地址
 * - REDIS_PORT: Redis 服务器端口
 * - REDIS_PASSWORD: Redis 密码（可选）
 * - REDIS_DB: Redis 数据库编号（可选，默认 0）
 */
export class RedisCache<TValue extends Record<string, any>> {
    private maxSize: number;
    private indexKeys: string[] = [];
    private prefix: string;
    private isEnabled: boolean;

    // 命中率统计的 Redis key
    private readonly hitCountKey: string;
    private readonly allCountKey: string;

    constructor(
        private readonly redis: Redis | null,
        options: {
            maxSize: number;
            indexKeys?: string[];
            prefix?: string;
        },
    ) {
        this.maxSize = options.maxSize;
        this.indexKeys = options.indexKeys || [];
        this.prefix = options.prefix || "cache";

        // 检查 Redis 是否启用
        this.isEnabled = this.checkRedisEnabled();

        this.hitCountKey = `${this.prefix}:stats:hit`;
        this.allCountKey = `${this.prefix}:stats:all`;

        if (!this.isEnabled) {
            console.warn(`[RedisCache] Redis 缓存未启用，请检查环境变量 REDIS_ENABLED 和 Redis 连接配置`);
        }
    }

    /**
     * 检查 Redis 是否启用
     */
    private checkRedisEnabled(): boolean {
        // 检查环境变量
        const redisEnabled = process.env.REDIS_ENABLED === "true";
        if (!redisEnabled) {
            return false;
        }

        // 检查 Redis 连接是否存在
        if (!this.redis) {
            console.error("[RedisCache] Redis 客户端未初始化");
            return false;
        }

        // 检查必需的环境变量
        const requiredEnvVars = ["REDIS_HOST", "REDIS_PORT"];
        const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

        if (missingVars.length > 0) {
            console.error(`[RedisCache] 缺少必需的环境变量: ${missingVars.join(", ")}`);
            return false;
        }

        return true;
    }

    /**
     * 检查 Redis 是否可用
     */
    isAvailable(): boolean {
        return this.isEnabled && this.redis !== null;
    }

    /**
     * 获取缓存命中率
     */
    async getHitRate(): Promise<number> {
        if (!this.isEnabled || !this.redis) return 0;

        const hitCount = await this.redis.get(this.hitCountKey);
        const allCount = await this.redis.get(this.allCountKey);

        const hit = parseInt(hitCount || "0", 10);
        const all = parseInt(allCount || "0", 10);

        if (all === 0) return 0;
        return hit / all;
    }

    /**
     * 获取当前缓存大小
     */
    async size(): Promise<number> {
        if (!this.isEnabled || !this.redis) return 0;

        const keys = await this.redis.keys(`${this.prefix}:data:*`);
        return keys.length;
    }

    /**
     * 删除指定 key 的缓存
     */
    async delete(key: string): Promise<void> {
        if (!this.isEnabled || !this.redis) return;

        const dataKey = this.getDataKey(key);
        const metaKey = this.getMetaKey(key);

        // 获取值以便删除索引
        const valueStr = await this.redis.get(dataKey);
        if (valueStr) {
            const entry: CacheEntry<TValue> = JSON.parse(valueStr);
            await this.removeFromIndexes(key, entry.value);
        }

        // 删除数据和元数据
        await this.redis.del(dataKey, metaKey);
    }

    /**
     * 清空所有缓存
     */
    async clear(): Promise<void> {
        if (!this.isEnabled || !this.redis) return;

        const keys = await this.redis.keys(`${this.prefix}:*`);
        if (keys.length > 0) {
            await this.redis.del(...keys);
        }
    }

    /**
     * 获取缓存值
     * @param key 缓存键
     * @returns 缓存值或 undefined
     */
    async get(key: string): Promise<TValue | undefined> {
        if (!this.isEnabled || !this.redis) return undefined;

        await this.redis.incr(this.allCountKey);

        const dataKey = this.getDataKey(key);
        const valueStr = await this.redis.get(dataKey);

        if (!valueStr) {
            return undefined;
        }

        const entry: CacheEntry<TValue> = JSON.parse(valueStr);

        // 检查是否过期
        if (this.isExpired(entry)) {
            await this.delete(key);
            return undefined;
        }

        // 更新访问时间（LRU）
        entry.lastAccessTime = Date.now();
        await this.redis.set(dataKey, JSON.stringify(entry));

        await this.redis.incr(this.hitCountKey);

        return entry.value;
    }

    /**
     * 设置缓存值
     * @param key 缓存键
     * @param value 缓存值
     * @param ttl 过期时间（毫秒），可选
     */
    async set(key: string, value: TValue, ttl?: number): Promise<void> {
        if (!this.isEnabled || !this.redis) return;

        const dataKey = this.getDataKey(key);

        // 如果已存在，先删除旧的索引
        const existingValueStr = await this.redis.get(dataKey);
        if (existingValueStr) {
            const existingEntry: CacheEntry<TValue> = JSON.parse(existingValueStr);
            await this.removeFromIndexes(key, existingEntry.value);
        }

        // 检查是否需要淘汰
        if (!existingValueStr) {
            const currentSize = await this.size();
            if (currentSize >= this.maxSize) {
                await this.evict();
            }
        }

        const now = Date.now();
        const entry: CacheEntry<TValue> = {
            value,
            createdTime: now,
            lastAccessTime: now,
            expireTime: ttl ? now + ttl : undefined,
        };

        // 存储数据
        await this.redis.set(dataKey, JSON.stringify(entry));

        // 如果有 TTL，设置 Redis 过期时间（额外保护）
        if (ttl) {
            await this.redis.pexpire(dataKey, ttl);
        }

        // 添加到索引
        await this.addToIndexes(key, value);
    }

    /**
     * 获取所有未过期的缓存条目
     */
    async getAllEntries(): Promise<TValue[]> {
        if (!this.isEnabled || !this.redis) return [];

        const keys = await this.redis.keys(`${this.prefix}:data:*`);
        const result: TValue[] = [];

        for (const dataKey of keys) {
            const valueStr = await this.redis.get(dataKey);
            if (!valueStr) continue;

            const entry: CacheEntry<TValue> = JSON.parse(valueStr);
            const cacheKey = this.extractKeyFromDataKey(dataKey);

            if (this.isExpired(entry)) {
                await this.delete(cacheKey);
            } else {
                result.push(entry.value);
            }
        }

        return result;
    }

    /**
     * 通过索引字段值查找缓存条目
     * @param indexKey 索引字段名
     * @param indexValue 索引字段的值
     * @returns 匹配的缓存条目或 undefined
     */
    async findByIndexKeyValue(indexKey: string, indexValue: any): Promise<TValue | undefined> {
        if (!this.isEnabled || !this.redis) return undefined;

        const indexMapKey = this.getIndexMapKey(indexKey);
        const key = await this.redis.hget(indexMapKey, String(indexValue));

        if (!key) {
            return undefined;
        }

        return this.get(key);
    }

    /**
     * 检查条目是否过期
     */
    private isExpired(entry: CacheEntry<TValue>): boolean {
        if (!entry.expireTime) {
            return false;
        }
        return Date.now() > entry.expireTime;
    }

    /**
     * 淘汰策略：
     * 1. 优先删除过期的
     * 2. 其次删除最久没有被使用的（LRU）
     */
    private async evict(): Promise<void> {
        if (!this.redis) return;

        const keys = await this.redis.keys(`${this.prefix}:data:*`);
        const now = Date.now();
        let keyToEvict: string | null = null;
        let oldestAccessTime = now;

        // 第一遍：查找过期的条目
        for (const dataKey of keys) {
            const valueStr = await this.redis.get(dataKey);
            if (!valueStr) continue;

            const entry: CacheEntry<TValue> = JSON.parse(valueStr);
            if (this.isExpired(entry)) {
                keyToEvict = this.extractKeyFromDataKey(dataKey);
                break;
            }
        }

        // 如果没有过期的，找最久未使用的（LRU）
        if (!keyToEvict) {
            for (const dataKey of keys) {
                const valueStr = await this.redis.get(dataKey);
                if (!valueStr) continue;

                const entry: CacheEntry<TValue> = JSON.parse(valueStr);
                if (entry.lastAccessTime < oldestAccessTime) {
                    oldestAccessTime = entry.lastAccessTime;
                    keyToEvict = this.extractKeyFromDataKey(dataKey);
                }
            }
        }

        if (keyToEvict) {
            await this.delete(keyToEvict);
        }
    }

    /**
     * 添加值到所有索引中
     */
    private async addToIndexes(key: string, value: TValue): Promise<void> {
        if (!this.redis) return;

        const promises = this.indexKeys.map(async (indexKey) => {
            if (value[indexKey] !== undefined && this.redis) {
                const indexMapKey = this.getIndexMapKey(indexKey);
                await this.redis.hset(indexMapKey, String(value[indexKey]), key);
            }
        });

        await Promise.all(promises);
    }

    /**
     * 从所有索引中移除值
     */
    private async removeFromIndexes(key: string, value: TValue): Promise<void> {
        if (!this.redis) return;

        const promises = this.indexKeys.map(async (indexKey) => {
            if (value[indexKey] !== undefined && this.redis) {
                const indexMapKey = this.getIndexMapKey(indexKey);
                await this.redis.hdel(indexMapKey, String(value[indexKey]));
            }
        });

        await Promise.all(promises);
    }

    /**
     * 获取数据存储的 Redis key
     */
    private getDataKey(key: string): string {
        return `${this.prefix}:data:${key}`;
    }

    /**
     * 获取元数据存储的 Redis key
     */
    private getMetaKey(key: string): string {
        return `${this.prefix}:meta:${key}`;
    }

    /**
     * 获取索引映射的 Redis key
     */
    private getIndexMapKey(indexKey: string): string {
        return `${this.prefix}:index:${indexKey}`;
    }

    /**
     * 从 Redis data key 中提取原始 key
     */
    private extractKeyFromDataKey(dataKey: string): string {
        return dataKey.replace(`${this.prefix}:data:`, "");
    }
}

/**
 * 缓存条目接口
 */
interface CacheEntry<TValue> {
    value: TValue;
    createdTime: number;
    lastAccessTime: number;
    expireTime?: number;
}

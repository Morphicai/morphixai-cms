/**
 * 内存级别的 LRU 缓存，支持过期时间和索引查询
 * @template TValue 缓存值类型
 */
export class MemoryCache<TValue extends Record<string, any>> {
    private maxSize = 10;
    private cache = new Map<string, CacheEntry<TValue>>();

    // 索引相关
    private indexKeys: string[] = [];
    private indexMaps = new Map<string, Map<any, string>>(); // 存储索引值到 key 的映射

    // 命中率统计
    private hitCount = 0;
    private allCount = 0;

    constructor(options: { maxSize: number; indexKeys?: string[] }) {
        this.maxSize = options.maxSize;
        this.indexKeys = options.indexKeys || [];

        // 初始化索引映射
        this.indexKeys.forEach((key) => {
            this.indexMaps.set(key, new Map<any, string>());
        });
    }

    /**
     * 获取缓存命中率
     */
    getHitRate(): number {
        if (this.allCount === 0) return 0;
        return this.hitCount / this.allCount;
    }

    /**
     * 获取当前缓存大小
     */
    get size(): number {
        return this.cache.size;
    }

    /**
     * 删除指定 key 的缓存
     */
    delete(key: string): void {
        const entry = this.cache.get(key);
        if (entry) {
            this.removeFromIndexes(key, entry.value);
            this.cache.delete(key);
        }
    }

    /**
     * 清空所有缓存
     */
    clear(): void {
        this.cache.clear();
        this.indexMaps.forEach((indexMap) => {
            indexMap.clear();
        });
        // 重置统计计数器
        this.hitCount = 0;
        this.allCount = 0;
    }

    /**
     * 获取缓存值
     * @param key 缓存键
     * @returns 缓存值或 undefined
     */
    get(key: string): TValue | undefined {
        this.allCount++;

        const entry = this.cache.get(key);
        if (!entry) {
            return undefined;
        }

        // 检查是否过期
        if (this.isExpired(entry)) {
            this.delete(key);
            return undefined;
        }

        // 更新访问时间（LRU）
        entry.lastAccessTime = Date.now();
        this.hitCount++;

        return entry.value;
    }

    /**
     * 设置缓存值
     * @param key 缓存键
     * @param value 缓存值
     * @param ttl 过期时间（毫秒），可选
     */
    set(key: string, value: TValue, ttl?: number): void {
        // 如果已存在，先删除旧的索引
        const existingEntry = this.cache.get(key);
        if (existingEntry) {
            this.removeFromIndexes(key, existingEntry.value);
        }

        // 检查是否需要淘汰
        if (!existingEntry && this.cache.size >= this.maxSize) {
            this.evict();
        }

        const now = Date.now();
        const entry: CacheEntry<TValue> = {
            value,
            createdTime: now,
            lastAccessTime: now,
            expireTime: ttl ? now + ttl : undefined,
        };

        this.cache.set(key, entry);
        this.addToIndexes(key, value);
    }

    /**
     * 获取所有未过期的缓存条目
     */
    getAllEntries(): TValue[] {
        const result: TValue[] = [];
        const now = Date.now();

        for (const [key, entry] of this.cache.entries()) {
            if (this.isExpired(entry)) {
                this.delete(key);
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
    findByIndexKeyValue(indexKey: string, indexValue: any): TValue | undefined {
        const indexMap = this.indexMaps.get(indexKey);
        if (!indexMap) {
            return undefined;
        }

        const key = indexMap.get(indexValue);
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
    private evict(): void {
        const now = Date.now();
        let keyToEvict: string | null = null;
        let oldestAccessTime = now;

        // 第一遍：查找过期的条目
        for (const [key, entry] of this.cache.entries()) {
            if (this.isExpired(entry)) {
                keyToEvict = key;
                break;
            }
        }

        // 如果没有过期的，找最久未使用的（LRU）
        if (!keyToEvict) {
            for (const [key, entry] of this.cache.entries()) {
                if (entry.lastAccessTime < oldestAccessTime) {
                    oldestAccessTime = entry.lastAccessTime;
                    keyToEvict = key;
                }
            }
        }

        if (keyToEvict) {
            this.delete(keyToEvict);
        }
    }

    /**
     * 添加值到所有索引中
     */
    private addToIndexes(key: string, value: TValue): void {
        this.indexKeys.forEach((indexKey) => {
            if (value[indexKey] !== undefined) {
                const indexMap = this.indexMaps.get(indexKey);
                if (indexMap) {
                    indexMap.set(value[indexKey], key);
                }
            }
        });
    }

    /**
     * 从所有索引中移除值
     */
    private removeFromIndexes(key: string, value: TValue): void {
        this.indexKeys.forEach((indexKey) => {
            if (value[indexKey] !== undefined) {
                const indexMap = this.indexMaps.get(indexKey);
                if (indexMap) {
                    indexMap.delete(value[indexKey]);
                }
            }
        });
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

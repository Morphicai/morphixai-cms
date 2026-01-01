/**
 * 缓存接口 - 统一 MemoryCache 和 RedisCache 的接口
 * @template TValue 缓存值类型
 */
export interface ICache<TValue extends Record<string, any>> {
    /**
     * 获取缓存命中率
     */
    getHitRate(): Promise<number>;

    /**
     * 获取当前缓存大小
     */
    size(): Promise<number>;

    /**
     * 删除指定 key 的缓存
     */
    delete(key: string): Promise<void>;

    /**
     * 清空所有缓存
     */
    clear(): Promise<void>;

    /**
     * 获取缓存值
     * @param key 缓存键
     * @returns 缓存值或 undefined
     */
    get(key: string): Promise<TValue | undefined>;

    /**
     * 设置缓存值
     * @param key 缓存键
     * @param value 缓存值
     * @param ttl 过期时间（毫秒），可选
     */
    set(key: string, value: TValue, ttl?: number): Promise<void>;

    /**
     * 获取所有未过期的缓存条目
     */
    getAllEntries(): Promise<TValue[]>;

    /**
     * 通过索引字段值查找缓存条目
     * @param indexKey 索引字段名
     * @param indexValue 索引字段的值
     * @returns 匹配的缓存条目或 undefined
     */
    findByIndexKeyValue(indexKey: string, indexValue: any): Promise<TValue | undefined>;
}

import { MemoryCache } from "./memory-cache";
import { ICache } from "./cache.interface";

/**
 * MemoryCache 适配器 - 将同步接口转换为异步接口
 * @template TValue 缓存值类型
 */
export class MemoryCacheAdapter<TValue extends Record<string, any>> implements ICache<TValue> {
    constructor(private readonly memoryCache: MemoryCache<TValue>) {}

    async getHitRate(): Promise<number> {
        return this.memoryCache.getHitRate();
    }

    async size(): Promise<number> {
        return this.memoryCache.size;
    }

    async delete(key: string): Promise<void> {
        this.memoryCache.delete(key);
    }

    async clear(): Promise<void> {
        this.memoryCache.clear();
    }

    async get(key: string): Promise<TValue | undefined> {
        return this.memoryCache.get(key);
    }

    async set(key: string, value: TValue, ttl?: number): Promise<void> {
        this.memoryCache.set(key, value, ttl);
    }

    async getAllEntries(): Promise<TValue[]> {
        return this.memoryCache.getAllEntries();
    }

    async findByIndexKeyValue(indexKey: string, indexValue: any): Promise<TValue | undefined> {
        return this.memoryCache.findByIndexKeyValue(indexKey, indexValue);
    }
}

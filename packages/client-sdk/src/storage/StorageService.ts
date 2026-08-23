/**
 * StorageService - 存储服务
 * 提供 localStorage 和 sessionStorage 的统一封装
 */

export type StorageType = 'local' | 'session';

export interface StorageOptions {
  prefix?: string;
  encrypt?: boolean;
}

/**
 * 存储服务类
 * 支持 localStorage 和 sessionStorage
 */
export class StorageService {
  private prefix: string;
  private encrypt: boolean;

  constructor(options: StorageOptions = {}) {
    this.prefix = options.prefix || 'optimus_';
    this.encrypt = options.encrypt || false;
  }

  /**
   * 获取存储对象
   */
  private getStorage(type: StorageType): Storage | null {
    if (typeof window === 'undefined') return null;
    return type === 'local' ? window.localStorage : window.sessionStorage;
  }

  /**
   * 生成完整的 key
   */
  private getFullKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * 序列化数据
   */
  private serialize(value: any): string {
    try {
      const serialized = JSON.stringify(value);
      return this.encrypt ? this.simpleEncrypt(serialized) : serialized;
    } catch (error) {
      console.error('Failed to serialize value:', error);
      return '';
    }
  }

  /**
   * 反序列化数据
   */
  private deserialize<T>(value: string): T | null {
    try {
      const decrypted = this.encrypt ? this.simpleDecrypt(value) : value;
      return JSON.parse(decrypted) as T;
    } catch (error) {
      console.error('Failed to deserialize value:', error);
      return null;
    }
  }

  /**
   * 简单加密（Base64）
   * 注意：这只是基础的混淆，不是真正的加密
   */
  private simpleEncrypt(text: string): string {
    return btoa(encodeURIComponent(text));
  }

  /**
   * 简单解密（Base64）
   */
  private simpleDecrypt(text: string): string {
    return decodeURIComponent(atob(text));
  }

  /**
   * 设置存储项
   */
  set<T = any>(key: string, value: T, type: StorageType = 'local'): boolean {
    try {
      const storage = this.getStorage(type);
      if (!storage) return false;

      const fullKey = this.getFullKey(key);
      const serialized = this.serialize(value);
      storage.setItem(fullKey, serialized);
      return true;
    } catch (error) {
      console.error(`Failed to set ${type}Storage item:`, error);
      return false;
    }
  }

  /**
   * 获取存储项
   */
  get<T = any>(key: string, type: StorageType = 'local', defaultValue?: T): T | null {
    try {
      const storage = this.getStorage(type);
      if (!storage) return defaultValue || null;

      const fullKey = this.getFullKey(key);
      const item = storage.getItem(fullKey);
      
      if (item === null) {
        return defaultValue || null;
      }

      return this.deserialize<T>(item) || defaultValue || null;
    } catch (error) {
      console.error(`Failed to get ${type}Storage item:`, error);
      return defaultValue || null;
    }
  }

  /**
   * 移除存储项
   */
  remove(key: string, type: StorageType = 'local'): boolean {
    try {
      const storage = this.getStorage(type);
      if (!storage) return false;

      const fullKey = this.getFullKey(key);
      storage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error(`Failed to remove ${type}Storage item:`, error);
      return false;
    }
  }

  /**
   * 清空指定类型的所有存储
   */
  clear(type: StorageType = 'local'): boolean {
    try {
      const storage = this.getStorage(type);
      if (!storage) return false;

      // 只清空带有前缀的项
      const keys = Object.keys(storage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          storage.removeItem(key);
        }
      });
      
      return true;
    } catch (error) {
      console.error(`Failed to clear ${type}Storage:`, error);
      return false;
    }
  }

  /**
   * 检查存储项是否存在
   */
  has(key: string, type: StorageType = 'local'): boolean {
    const storage = this.getStorage(type);
    if (!storage) return false;

    const fullKey = this.getFullKey(key);
    return storage.getItem(fullKey) !== null;
  }

  /**
   * 获取所有存储的 keys（只返回带前缀的）
   */
  keys(type: StorageType = 'local'): string[] {
    const storage = this.getStorage(type);
    if (!storage) return [];

    const allKeys = Object.keys(storage);
    return allKeys
      .filter(key => key.startsWith(this.prefix))
      .map(key => key.substring(this.prefix.length));
  }

  /**
   * 获取存储项数量（只计算带前缀的）
   */
  size(type: StorageType = 'local'): number {
    return this.keys(type).length;
  }

  /**
   * 设置带过期时间的存储项
   */
  setWithExpiry<T = any>(
    key: string,
    value: T,
    expiryMs: number,
    type: StorageType = 'local'
  ): boolean {
    const item = {
      value,
      expiry: Date.now() + expiryMs,
    };
    return this.set(key, item, type);
  }

  /**
   * 获取带过期时间的存储项
   */
  getWithExpiry<T = any>(key: string, type: StorageType = 'local', defaultValue?: T): T | null {
    const item = this.get<{ value: T; expiry: number }>(key, type);
    
    if (!item) {
      return defaultValue || null;
    }

    // 检查是否过期
    if (Date.now() > item.expiry) {
      this.remove(key, type);
      return defaultValue || null;
    }

    return item.value;
  }
}

// 导出默认实例
export const localStorage = new StorageService({ prefix: 'optimus_local_' });
export const sessionStorage = new StorageService({ prefix: 'optimus_session_' });


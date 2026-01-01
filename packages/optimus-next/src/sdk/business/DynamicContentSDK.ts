/**
 * DynamicContentSDK - 动态内容 SDK
 * 用于获取和管理后台配置的动态内容（文案、图片、HTML 等）
 */

import { BaseHttpService } from '../http/BaseHttpService';

export interface DynamicContent {
  id: string;
  key: string;
  type: 'text' | 'html' | 'image' | 'url' | 'json';
  value: any;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface DynamicContentQuery {
  keys?: string[];
  type?: DynamicContent['type'];
  category?: string;
}

/**
 * 动态内容 SDK
 */
export class DynamicContentSDK {
  private httpService: BaseHttpService;
  private cache: Map<string, { data: DynamicContent; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

  constructor(httpService?: BaseHttpService) {
    this.httpService = httpService || new BaseHttpService();
  }

  /**
   * 获取单个动态内容
   * @param key 内容 key
   * @param useCache 是否使用缓存
   */
  async get(key: string, useCache = true): Promise<DynamicContent | null> {
    // 检查缓存
    if (useCache) {
      const cached = this.getFromCache(key);
      if (cached) return cached;
    }

    try {
      const response = await this.httpService.get<{ data: DynamicContent }>(
        `/api/dynamic-content/${key}`
      );

      if (response.data) {
        this.setToCache(key, response.data);
        return response.data;
      }

      return null;
    } catch (error) {
      console.error(`Failed to get dynamic content: ${key}`, error);
      return null;
    }
  }

  /**
   * 批量获取动态内容
   * @param keys 内容 keys 数组
   */
  async getBatch(keys: string[]): Promise<Record<string, DynamicContent>> {
    try {
      const response = await this.httpService.post<{ data: DynamicContent[] }>(
        '/api/dynamic-content/batch',
        { keys }
      );

      const result: Record<string, DynamicContent> = {};
      
      if (response.data) {
        response.data.forEach(item => {
          result[item.key] = item;
          this.setToCache(item.key, item);
        });
      }

      return result;
    } catch (error) {
      console.error('Failed to get batch dynamic content:', error);
      return {};
    }
  }

  /**
   * 查询动态内容列表
   * @param query 查询条件
   */
  async query(query: DynamicContentQuery): Promise<DynamicContent[]> {
    try {
      const response = await this.httpService.get<{ data: DynamicContent[] }>(
        '/api/dynamic-content',
        { params: query }
      );

      return response.data || [];
    } catch (error) {
      console.error('Failed to query dynamic content:', error);
      return [];
    }
  }

  /**
   * 获取文本内容
   * @param key 内容 key
   * @param defaultValue 默认值
   */
  async getText(key: string, defaultValue = ''): Promise<string> {
    const content = await this.get(key);
    return content?.type === 'text' ? content.value : defaultValue;
  }

  /**
   * 获取 HTML 内容
   * @param key 内容 key
   * @param defaultValue 默认值
   */
  async getHTML(key: string, defaultValue = ''): Promise<string> {
    const content = await this.get(key);
    return content?.type === 'html' ? content.value : defaultValue;
  }

  /**
   * 获取图片 URL
   * @param key 内容 key
   * @param defaultValue 默认值
   */
  async getImage(key: string, defaultValue = ''): Promise<string> {
    const content = await this.get(key);
    return content?.type === 'image' ? content.value : defaultValue;
  }

  /**
   * 获取 URL
   * @param key 内容 key
   * @param defaultValue 默认值
   */
  async getURL(key: string, defaultValue = ''): Promise<string> {
    const content = await this.get(key);
    return content?.type === 'url' ? content.value : defaultValue;
  }

  /**
   * 获取 JSON 数据
   * @param key 内容 key
   * @param defaultValue 默认值
   */
  async getJSON<T = any>(key: string, defaultValue?: T): Promise<T | null> {
    const content = await this.get(key);
    return content?.type === 'json' ? content.value : (defaultValue || null);
  }

  /**
   * 预加载内容
   * @param keys 内容 keys 数组
   */
  async preload(keys: string[]): Promise<void> {
    await this.getBatch(keys);
  }

  /**
   * 清除缓存
   * @param key 可选，指定清除某个 key 的缓存
   */
  clearCache(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * 从缓存获取
   */
  private getFromCache(key: string): DynamicContent | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // 检查缓存是否过期
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * 设置到缓存
   */
  private setToCache(key: string, data: DynamicContent) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
}

// 导出默认实例
export const dynamicContentSDK = new DynamicContentSDK();


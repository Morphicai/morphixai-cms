/**
 * DynamicContentSDK - 动态内容 SDK
 * 用于获取后台配置的动态内容（文案、图片、HTML 等）
 *
 * 后端就是字典模块的公开只读集合 `dynamic-content`（管理端"字典管理"里维护），
 * 没有独立的 dynamic-content 服务——最初按独立服务设计了这套 SDK，后端一直
 * 没立项，接到现成的字典上反而更简洁：一个集合就是一份文案配置表。
 *
 * 字典值约定为 `{ type, value }` 对象；手工录入的纯字符串按 text 兼容。
 */

import { BaseHttpService, httpService } from '../http/BaseHttpService';

export interface DynamicContent {
  key: string;
  type: 'text' | 'html' | 'image' | 'url' | 'json';
  value: any;
}

export interface DynamicContentQuery {
  keys?: string[];
  type?: DynamicContent['type'];
}

/** 字典集合名：对应 op_sys_dictionary_collection 里 public_read 的那条 */
const COLLECTION = 'dynamic-content';

/** 后端 ResultData 包装 */
interface ResultData<T> {
  code: number;
  msg?: string;
  data: T;
}

export class DynamicContentSDK {
  private httpService: BaseHttpService;
  private cache: Map<string, { data: DynamicContent; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

  constructor(http?: BaseHttpService) {
    this.httpService = http || httpService;
  }

  /** 把字典 value 规整成 DynamicContent（兼容纯字符串录入） */
  private normalize(key: string, raw: any): DynamicContent | null {
    if (raw === null || raw === undefined) return null;
    if (typeof raw === 'string') {
      return { key, type: 'text', value: raw };
    }
    if (typeof raw === 'object' && 'value' in raw) {
      return { key, type: raw.type || 'text', value: raw.value };
    }
    // 其他 JSON 形态原样交给调用方
    return { key, type: 'json', value: raw };
  }

  /**
   * 获取单个动态内容
   */
  async get(key: string, useCache = true): Promise<DynamicContent | null> {
    if (useCache) {
      const cached = this.getFromCache(key);
      if (cached) return cached;
    }

    try {
      // 后端字典公开接口带 /api 自前缀，叠加全局前缀后是 /api/api/...，
      // 经代理剥掉第一层刚好对上——别"顺手"把这里的 /api 删了
      const response = await this.httpService.get<ResultData<any>>(
        `/api/dictionary/${COLLECTION}/${encodeURIComponent(key)}`
      );

      const content = this.normalize(key, response?.data);
      if (content) {
        this.setToCache(key, content);
      }
      return content;
    } catch (error) {
      console.error(`Failed to get dynamic content: ${key}`, error);
      return null;
    }
  }

  /**
   * 批量获取动态内容（整集合取回后本地筛，集合体量小，不值得做批量接口）
   */
  async getBatch(keys: string[]): Promise<Record<string, DynamicContent>> {
    const all = await this.query({});
    const result: Record<string, DynamicContent> = {};
    for (const item of all) {
      if (keys.includes(item.key)) {
        result[item.key] = item;
      }
    }
    return result;
  }

  /**
   * 查询动态内容列表
   */
  async query(query: DynamicContentQuery): Promise<DynamicContent[]> {
    try {
      const response = await this.httpService.get<
        ResultData<{ items: Array<{ key: string; value: any }> }>
      >(`/api/dictionary/${COLLECTION}`);

      const items = (response?.data?.items || [])
        .map((row) => this.normalize(row.key, row.value))
        .filter((c): c is DynamicContent => c !== null)
        .filter((c) => !query.type || c.type === query.type)
        .filter((c) => !query.keys || query.keys.includes(c.key));

      items.forEach((c) => this.setToCache(c.key, c));
      return items;
    } catch (error) {
      console.error('Failed to query dynamic content:', error);
      return [];
    }
  }

  /**
   * 获取文本内容
   */
  async getText(key: string, defaultValue = ''): Promise<string> {
    const content = await this.get(key);
    return content && (content.type === 'text' || content.type === 'html')
      ? String(content.value)
      : defaultValue;
  }

  /**
   * 获取 HTML 内容
   */
  async getHTML(key: string, defaultValue = ''): Promise<string> {
    const content = await this.get(key);
    return content?.type === 'html' ? String(content.value) : defaultValue;
  }

  /**
   * 获取图片 URL
   */
  async getImage(key: string, defaultValue = ''): Promise<string> {
    const content = await this.get(key);
    return content?.type === 'image' ? String(content.value) : defaultValue;
  }

  /**
   * 获取链接 URL
   */
  async getURL(key: string, defaultValue = ''): Promise<string> {
    const content = await this.get(key);
    return content?.type === 'url' ? String(content.value) : defaultValue;
  }

  /**
   * 获取 JSON 内容
   */
  async getJSON<T = any>(key: string, defaultValue?: T): Promise<T | null> {
    const content = await this.get(key);
    if (content?.type === 'json') {
      return content.value as T;
    }
    return defaultValue ?? null;
  }

  /**
   * 预加载一批 key 进缓存
   */
  async preload(keys: string[]): Promise<void> {
    await this.getBatch(keys);
  }

  /**
   * 清空缓存
   */
  clearCache() {
    this.cache.clear();
  }

  private getFromCache(key: string): DynamicContent | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setToCache(key: string, data: DynamicContent) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}

// 导出默认实例
export const dynamicContentSDK = new DynamicContentSDK();

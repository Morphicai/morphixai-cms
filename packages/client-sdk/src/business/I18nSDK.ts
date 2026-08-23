/**
 * 多语言文案的 C 端读取。底层是 /api/i18n/:namespace 公开接口
 * (缺失 locale 服务端回退 zh-CN)。按 namespace+locale 内存缓存——
 * 文案在一次会话里基本不变,别让每个组件都打一次接口。
 */
import { BaseHttpService, httpService } from '../http/BaseHttpService';

interface ApiEnvelope<T> {
  code: number;
  msg?: string;
  data: T;
}

interface I18nPayload {
  namespace: string;
  locale: string;
  messages: Record<string, string>;
}

export class I18nSDK {
  private cache = new Map<string, Record<string, string>>();

  constructor(private readonly http: BaseHttpService = httpService) {}

  /** 拉取一个 namespace 在目标 locale 下的键值 map(缓存命中不发请求) */
  async load(namespace: string, locale = 'zh-CN'): Promise<Record<string, string>> {
    const cacheKey = `${namespace}:${locale}`;
    const hit = this.cache.get(cacheKey);
    if (hit) return hit;
    // locale 拼进 URL 而不是 params:请求去重的 key 只看 URL,
    // 用 params 的话不同 locale 的并发请求会被去重成同一个
    const res = await this.http.get<ApiEnvelope<I18nPayload>>(
      `/api/i18n/${encodeURIComponent(namespace)}?locale=${encodeURIComponent(locale)}`,
    );
    if (res?.code !== 200) throw new Error(res?.msg || `读取多语言失败: ${namespace}`);
    const messages = res.data?.messages ?? {};
    this.cache.set(cacheKey, messages);
    return messages;
  }

  /** 便捷取单键:未命中返回 key 本身,页面不至于空一块 */
  async t(namespace: string, key: string, locale = 'zh-CN'): Promise<string> {
    const messages = await this.load(namespace, locale);
    return messages[key] ?? key;
  }

  /** 后台改了文案要即时看到时手动清缓存 */
  clearCache(): void {
    this.cache.clear();
  }
}

export const i18nSDK = new I18nSDK();

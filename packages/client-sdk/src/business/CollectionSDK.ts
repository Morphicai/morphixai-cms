/**
 * 数据集合（entity schema 驱动）的公开读写封装。
 * 一个活动的"配置"就是一个 public_read 集合,"报名"就是一个 public_write 集合——
 * 子应用不用建表、不用写接口,schema 校验(required/类型/范围/unique)服务端白得。
 * 底层是 /api/dictionary/:collection 公开端点,访问控制按集合 accessType 判。
 */
import { BaseHttpService, httpService } from '../http/BaseHttpService';

export interface CollectionItem<T = Record<string, unknown>> {
  key: string;
  value: T;
  sortOrder: number;
}

export interface CollectionData<T = Record<string, unknown>> {
  collection: string;
  items: CollectionItem<T>[];
  total: number;
}

interface ApiEnvelope<T> {
  code: number;
  msg?: string;
  data: T;
}

export class CollectionSDK {
  constructor(private readonly http: BaseHttpService = httpService) {}

  /** 读整个公开集合(按 sortOrder 排序)。集合非 public_read/public_write 会被服务端拒 */
  async list<T = Record<string, unknown>>(collection: string): Promise<CollectionData<T>> {
    const res = await this.http.get<ApiEnvelope<CollectionData<T>>>(
      `/api/dictionary/${encodeURIComponent(collection)}`,
    );
    if (res?.code !== 200) throw new Error(res?.msg || `读取集合失败: ${collection}`);
    return res.data;
  }

  /** 读单行 */
  async get<T = Record<string, unknown>>(collection: string, key: string): Promise<T> {
    const res = await this.http.get<ApiEnvelope<T>>(
      `/api/dictionary/${encodeURIComponent(collection)}/${encodeURIComponent(key)}`,
    );
    if (res?.code !== 200) throw new Error(res?.msg || `读取失败: ${collection}.${key}`);
    return res.data;
  }

  /**
   * 写一行(集合须 public_write)。value 不符合集合 schema 时服务端 400,
   * 错误消息指明具体字段,这里原样抛出——校验失败是调用方要面对的事,不吞
   */
  async create<T = Record<string, unknown>>(collection: string, key: string, value: T): Promise<unknown> {
    const res = await this.http.post<ApiEnvelope<unknown>>(
      `/api/dictionary/${encodeURIComponent(collection)}`,
      { key, value },
    );
    if (res?.code !== 200) throw new Error(res?.msg || `写入失败: ${collection}`);
    return res.data;
  }

  /** 更新一行(集合须 public_write),同样受 schema 校验 */
  async update<T = Record<string, unknown>>(collection: string, key: string, value: T): Promise<unknown> {
    const res = await this.http.put<ApiEnvelope<unknown>>(
      `/api/dictionary/${encodeURIComponent(collection)}/${encodeURIComponent(key)}`,
      { value },
    );
    if (res?.code !== 200) throw new Error(res?.msg || `更新失败: ${collection}.${key}`);
    return res.data;
  }
}

export const collectionSDK = new CollectionSDK();

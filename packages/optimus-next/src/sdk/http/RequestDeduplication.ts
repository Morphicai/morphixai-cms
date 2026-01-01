/**
 * RequestDeduplication - 请求去重服务
 * 防止相同的请求在短时间内重复发送
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

export class RequestDeduplication {
  private pendingRequests: Map<string, PendingRequest<any>> = new Map();
  private readonly CACHE_DURATION = 1000; // 1秒内的相同请求会被去重

  /**
   * 对请求进行去重处理
   * @param key 请求唯一标识
   * @param requestFn 请求函数
   * @returns 请求结果
   */
  async dedupe<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const pending = this.pendingRequests.get(key);

    // 如果存在进行中的相同请求，直接返回该请求的 Promise
    if (pending && now - pending.timestamp < this.CACHE_DURATION) {
      console.log(`[RequestDedup] Returning cached request: ${key}`);
      return pending.promise;
    }

    // 创建新的请求
    const promise = requestFn()
      .then((result) => {
        // 请求完成后清理
        this.pendingRequests.delete(key);
        return result;
      })
      .catch((error) => {
        // 请求失败后清理
        this.pendingRequests.delete(key);
        throw error;
      });

    // 存储进行中的请求
    this.pendingRequests.set(key, {
      promise,
      timestamp: now,
    });

    return promise;
  }

  /**
   * 清除所有待处理的请求
   */
  clear() {
    this.pendingRequests.clear();
  }

  /**
   * 清除指定 key 的请求
   */
  clearKey(key: string) {
    this.pendingRequests.delete(key);
  }
}


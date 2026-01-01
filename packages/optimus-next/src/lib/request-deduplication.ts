/**
 * 请求去重工具
 * 防止短时间内的重复请求
 */

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

class RequestDeduplication {
  private pendingRequests = new Map<string, PendingRequest>();
  private readonly CACHE_DURATION = 1000; // 1秒内的重复请求会被去重

  /**
   * 生成请求的唯一键
   */
  private generateKey(url: string, method: string, data?: any): string {
    const dataStr = data ? JSON.stringify(data) : '';
    return `${method.toUpperCase()}:${url}:${dataStr}`;
  }

  /**
   * 清理过期的请求缓存
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.CACHE_DURATION) {
        this.pendingRequests.delete(key);
      }
    }
  }

  /**
   * 执行去重请求
   */
  async deduplicate<T>(
    url: string,
    method: string,
    requestFn: () => Promise<T>,
    data?: any
  ): Promise<T> {
    this.cleanup();
    
    const key = this.generateKey(url, method, data);
    const existing = this.pendingRequests.get(key);
    
    if (existing) {
      console.log(`🔄 请求去重: ${method} ${url}`);
      return existing.promise;
    }

    const promise = requestFn().finally(() => {
      // 请求完成后延迟删除，避免极短时间内的重复请求
      setTimeout(() => {
        this.pendingRequests.delete(key);
      }, 100);
    });

    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
    });

    return promise;
  }

  /**
   * 清除所有缓存
   */
  clear(): void {
    this.pendingRequests.clear();
  }
}

export const requestDeduplication = new RequestDeduplication();
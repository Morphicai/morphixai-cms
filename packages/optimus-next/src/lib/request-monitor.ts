/**
 * 请求监控工具
 * 用于调试和监控 API 请求
 */

interface RequestLog {
  id: string;
  method: string;
  url: string;
  timestamp: number;
  status?: number;
  duration?: number;
  error?: string;
}

class RequestMonitor {
  private logs: RequestLog[] = [];
  private maxLogs = 100;
  private enabled = process.env.NODE_ENV === 'development';

  /**
   * 生成请求 ID
   */
  private generateId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 记录请求开始
   */
  logRequestStart(method: string, url: string): string {
    if (!this.enabled) return '';

    const id = this.generateId();
    const log: RequestLog = {
      id,
      method: method.toUpperCase(),
      url,
      timestamp: Date.now(),
    };

    this.logs.push(log);
    
    // 保持日志数量在限制内
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    console.log(`🚀 [${id}] ${method.toUpperCase()} ${url}`);
    return id;
  }

  /**
   * 记录请求完成
   */
  logRequestEnd(id: string, status: number, duration?: number): void {
    if (!this.enabled || !id) return;

    const log = this.logs.find(l => l.id === id);
    if (log) {
      log.status = status;
      log.duration = duration || Date.now() - log.timestamp;
      
      const statusIcon = status >= 200 && status < 300 ? '✅' : '❌';
      console.log(`${statusIcon} [${id}] ${status} ${log.duration}ms`);
    }
  }

  /**
   * 记录请求错误
   */
  logRequestError(id: string, error: string): void {
    if (!this.enabled || !id) return;

    const log = this.logs.find(l => l.id === id);
    if (log) {
      log.error = error;
      log.duration = Date.now() - log.timestamp;
      
      console.error(`❌ [${id}] Error: ${error} (${log.duration}ms)`);
    }
  }

  /**
   * 获取最近的请求日志
   */
  getRecentLogs(count = 10): RequestLog[] {
    return this.logs.slice(-count);
  }

  /**
   * 获取重复请求统计
   */
  getDuplicateRequests(timeWindow = 5000): Array<{
    key: string;
    count: number;
    requests: RequestLog[];
  }> {
    const now = Date.now();
    const recentLogs = this.logs.filter(log => now - log.timestamp < timeWindow);
    
    const groups = new Map<string, RequestLog[]>();
    
    recentLogs.forEach(log => {
      const key = `${log.method}:${log.url}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(log);
    });

    return Array.from(groups.entries())
      .filter(([, requests]) => requests.length > 1)
      .map(([key, requests]) => ({
        key,
        count: requests.length,
        requests,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * 清除日志
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * 打印统计信息
   */
  printStats(): void {
    if (!this.enabled) return;

    console.group('📊 请求统计');
    console.log(`总请求数: ${this.logs.length}`);
    
    const duplicates = this.getDuplicateRequests();
    if (duplicates.length > 0) {
      console.warn('⚠️ 发现重复请求:');
      duplicates.forEach(({ key, count, requests }) => {
        console.warn(`  ${key}: ${count} 次`);
        requests.forEach(req => {
          console.warn(`    - ${new Date(req.timestamp).toISOString()} (${req.id})`);
        });
      });
    } else {
      console.log('✅ 未发现重复请求');
    }
    
    console.groupEnd();
  }
}

export const requestMonitor = new RequestMonitor();

// 在开发环境下，每 30 秒打印一次统计信息
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  setInterval(() => {
    const duplicates = requestMonitor.getDuplicateRequests();
    if (duplicates.length > 0) {
      requestMonitor.printStats();
    }
  }, 30000);
}
import { Injectable, Logger } from "@nestjs/common";

/**
 * 文件代理访问日志接口
 */
export interface FileProxyAccessLog {
    requestId: string;
    timestamp: string;
    fileKey: string;
    provider: string;
    success: boolean;
    duration: number;
    statusCode: number;
    errorType?: string;
    errorMessage?: string;
    userAgent?: string;
    ip?: string;
    userId?: string;
    redirectUrl?: string;
}

/**
 * 文件代理访问监控指标接口
 */
export interface FileProxyMetrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgResponseTime: number;
    providerBreakdown: Record<string, { success: number; failed: number; avgTime: number }>;
    errorBreakdown: Record<string, number>;
    recentLogs: FileProxyAccessLog[];
}

/**
 * 文件代理日志记录服务
 * 专门处理文件代理访问的日志记录和监控指标收集
 */
@Injectable()
export class FileProxyLoggerService {
    private readonly logger = new Logger(FileProxyLoggerService.name);
    private readonly accessLogs: FileProxyAccessLog[] = [];
    private readonly maxLogSize = 1000; // 最多保留1000条日志

    /**
     * 记录文件代理访问日志
     * @param log 访问日志
     */
    logAccess(log: FileProxyAccessLog): void {
        // 添加到内存日志
        this.accessLogs.push(log);

        // 保持日志大小限制
        if (this.accessLogs.length > this.maxLogSize) {
            this.accessLogs.shift();
        }

        // 根据成功/失败状态选择日志级别
        if (log.success) {
            this.logger.log(`File proxy access successful`, {
                requestId: log.requestId,
                fileKey: log.fileKey,
                provider: log.provider,
                duration: `${log.duration}ms`,
                statusCode: log.statusCode,
                ip: log.ip,
                userAgent: log.userAgent,
            });
        } else {
            this.logger.error(`File proxy access failed`, {
                requestId: log.requestId,
                fileKey: log.fileKey,
                provider: log.provider,
                duration: `${log.duration}ms`,
                statusCode: log.statusCode,
                errorType: log.errorType,
                errorMessage: log.errorMessage,
                ip: log.ip,
                userAgent: log.userAgent,
            });
        }

        // 如果是慢请求，记录警告
        if (log.duration > 2000) {
            this.logger.warn(`Slow file proxy access detected`, {
                requestId: log.requestId,
                fileKey: log.fileKey,
                provider: log.provider,
                duration: `${log.duration}ms`,
                threshold: "2000ms",
            });
        }
    }

    /**
     * 记录文件代理访问开始
     * @param requestId 请求ID
     * @param fileKey 文件键名
     * @param provider 存储提供商
     * @param metadata 额外元数据
     */
    logAccessStart(
        requestId: string,
        fileKey: string,
        provider: string,
        metadata: {
            ip?: string;
            userAgent?: string;
            userId?: string;
            referer?: string;
        } = {},
    ): void {
        this.logger.log(`File proxy access started`, {
            requestId,
            fileKey,
            provider,
            timestamp: new Date().toISOString(),
            ...metadata,
        });
    }

    /**
     * 记录文件代理访问成功
     * @param requestId 请求ID
     * @param fileKey 文件键名
     * @param provider 存储提供商
     * @param duration 处理时间
     * @param redirectUrl 重定向URL
     */
    logAccessSuccess(
        requestId: string,
        fileKey: string,
        provider: string,
        duration: number,
        redirectUrl: string,
    ): void {
        const log: FileProxyAccessLog = {
            requestId,
            timestamp: new Date().toISOString(),
            fileKey,
            provider,
            success: true,
            duration,
            statusCode: 302,
            redirectUrl,
        };

        this.logAccess(log);
    }

    /**
     * 记录文件代理访问失败
     * @param requestId 请求ID
     * @param fileKey 文件键名
     * @param provider 存储提供商
     * @param duration 处理时间
     * @param error 错误信息
     * @param statusCode HTTP状态码
     */
    logAccessFailure(
        requestId: string,
        fileKey: string,
        provider: string,
        duration: number,
        error: {
            type: string;
            message: string;
        },
        statusCode: number,
    ): void {
        const log: FileProxyAccessLog = {
            requestId,
            timestamp: new Date().toISOString(),
            fileKey,
            provider,
            success: false,
            duration,
            statusCode,
            errorType: error.type,
            errorMessage: error.message,
        };

        this.logAccess(log);
    }

    /**
     * 获取监控指标
     * @returns 监控指标
     */
    getMetrics(): FileProxyMetrics {
        const totalRequests = this.accessLogs.length;
        const successfulRequests = this.accessLogs.filter((log) => log.success).length;
        const failedRequests = totalRequests - successfulRequests;

        // 计算平均响应时间
        const avgResponseTime =
            totalRequests > 0
                ? Math.round(this.accessLogs.reduce((sum, log) => sum + log.duration, 0) / totalRequests)
                : 0;

        // 按提供商统计
        const providerBreakdown: Record<string, { success: number; failed: number; avgTime: number }> = {};
        this.accessLogs.forEach((log) => {
            if (!providerBreakdown[log.provider]) {
                providerBreakdown[log.provider] = { success: 0, failed: 0, avgTime: 0 };
            }

            if (log.success) {
                providerBreakdown[log.provider].success++;
            } else {
                providerBreakdown[log.provider].failed++;
            }
        });

        // 计算每个提供商的平均响应时间
        Object.keys(providerBreakdown).forEach((provider) => {
            const providerLogs = this.accessLogs.filter((log) => log.provider === provider);
            const avgTime =
                providerLogs.length > 0
                    ? Math.round(providerLogs.reduce((sum, log) => sum + log.duration, 0) / providerLogs.length)
                    : 0;
            providerBreakdown[provider].avgTime = avgTime;
        });

        // 按错误类型统计
        const errorBreakdown: Record<string, number> = {};
        this.accessLogs
            .filter((log) => !log.success && log.errorType)
            .forEach((log) => {
                if (log.errorType) {
                    errorBreakdown[log.errorType] = (errorBreakdown[log.errorType] || 0) + 1;
                }
            });

        return {
            totalRequests,
            successfulRequests,
            failedRequests,
            avgResponseTime,
            providerBreakdown,
            errorBreakdown,
            recentLogs: this.accessLogs.slice(-10), // 最近10条日志
        };
    }

    /**
     * 获取最近的访问日志
     * @param limit 限制数量
     * @returns 访问日志列表
     */
    getRecentLogs(limit = 50): FileProxyAccessLog[] {
        return this.accessLogs.slice(-limit);
    }

    /**
     * 获取失败的访问日志
     * @param limit 限制数量
     * @returns 失败的访问日志列表
     */
    getFailedLogs(limit = 20): FileProxyAccessLog[] {
        return this.accessLogs.filter((log) => !log.success).slice(-limit);
    }

    /**
     * 获取慢请求日志
     * @param threshold 阈值（毫秒）
     * @param limit 限制数量
     * @returns 慢请求日志列表
     */
    getSlowLogs(threshold = 2000, limit = 20): FileProxyAccessLog[] {
        return this.accessLogs.filter((log) => log.duration > threshold).slice(-limit);
    }

    /**
     * 清理旧日志
     * @param olderThanHours 清理多少小时前的日志
     */
    cleanupOldLogs(olderThanHours = 24): void {
        const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
        const initialLength = this.accessLogs.length;

        // 移除旧日志
        let index = 0;
        while (index < this.accessLogs.length) {
            const logTime = new Date(this.accessLogs[index].timestamp);
            if (logTime < cutoffTime) {
                this.accessLogs.splice(index, 1);
            } else {
                index++;
            }
        }

        const removedCount = initialLength - this.accessLogs.length;
        if (removedCount > 0) {
            this.logger.log(`Cleaned up ${removedCount} old file proxy access logs`);
        }
    }
}

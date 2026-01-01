import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap, catchError } from "rxjs/operators";
import { StorageErrorHandler } from "../utils/error-handler";
import { shouldLogOperationStart, shouldLogSuccessfulOperation } from "../../../shared/utils/env.util";

/**
 * 存储操作日志拦截器
 * 记录所有存储相关操作的详细日志和性能指标
 */
@Injectable()
export class StorageLoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(StorageLoggingInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, url, body, query, params } = request;
        const startTime = Date.now();

        // 提取操作信息
        const operation = this.extractOperation(method, url);
        const fileInfo = this.extractFileInfo(body, query, params);

        // 根据环境变量配置决定是否记录操作开始日志
        if (shouldLogOperationStart()) {
            this.logger.log(`Storage operation started: ${operation}`, {
                method,
                url,
                fileInfo,
                userAgent: request.get("User-Agent"),
                ip: request.ip,
                userId: request.user?.id,
            });
        }

        return next.handle().pipe(
            tap((response) => {
                const duration = Date.now() - startTime;

                // 记录成功操作（用于统计，但不一定记录日志）
                StorageErrorHandler.logOperation(
                    operation,
                    fileInfo.fileKey || fileInfo.fileName || "unknown",
                    "current", // 当前存储提供商
                    true,
                    duration,
                );

                // 根据环境变量配置决定是否记录成功操作日志
                // UPLOAD 操作视为重要操作
                const isImportant = operation === "UPLOAD";
                if (shouldLogSuccessfulOperation(duration, isImportant)) {
                    const logData: any = {
                        duration: `${duration}ms`,
                        success: true,
                    };

                    // 只有在非流响应时才计算响应大小，并且确保 response 存在
                    // FILE_ACCESS 和 DOWNLOAD 操作通常返回 void（使用 @Res()），response 可能为 undefined
                    if (response && operation !== "FILE_ACCESS" && operation !== "DOWNLOAD") {
                        logData.responseSize = this.getResponseSize(response);
                    }

                    this.logger.log(`Storage operation completed: ${operation}`, logData);
                }
            }),
            catchError((error) => {
                const duration = Date.now() - startTime;

                // 记录失败操作
                StorageErrorHandler.logOperation(
                    operation,
                    fileInfo.fileKey || fileInfo.fileName || "unknown",
                    "current", // 当前存储提供商
                    false,
                    duration,
                );

                // 错误日志始终记录
                // 安全地访问错误信息，避免访问 undefined 属性
                const errorMessage = error?.message || error?.toString() || "Unknown error";
                this.logger.error(`Storage operation failed: ${operation}`, {
                    duration: `${duration}ms`,
                    error: errorMessage,
                    success: false,
                });

                throw error;
            }),
        );
    }

    /**
     * 从请求中提取操作类型
     * @param method HTTP方法
     * @param url 请求URL
     * @returns 操作类型
     */
    private extractOperation(method: string, url: string): string {
        if (url.includes("/upload")) return "UPLOAD";
        if (url.includes("/download")) return "DOWNLOAD";
        if (url.includes("/file/")) return "FILE_ACCESS"; // 新增文件访问操作
        if (method === "DELETE") return "DELETE";
        if (url.includes("/list")) return "LIST";
        if (url.includes("/health")) return "HEALTH_CHECK";
        if (url.includes("/status")) return "STATUS_CHECK";
        if (url.includes("/test-connection")) return "CONNECTION_TEST";

        return "UNKNOWN";
    }

    /**
     * 从请求中提取文件信息
     * @param body 请求体
     * @param query 查询参数
     * @param params 路径参数
     * @returns 文件信息
     */
    private extractFileInfo(body: any, query: any, params: any): any {
        return {
            fileName: body?.file?.originalname || query?.fileName || params?.fileName,
            fileKey: query?.fileKey || params?.fileKey || params?.id,
            fileSize: body?.file?.size,
            mimeType: body?.file?.mimetype,
            business: body?.business || query?.business,
        };
    }

    /**
     * 获取响应大小（估算）
     * @param response 响应对象
     * @returns 响应大小描述
     */
    private getResponseSize(response: any): string {
        if (!response) return "unknown";

        try {
            // 对于流响应，不尝试序列化
            if (response.pipe || response.readable) {
                return "stream";
            }

            // 对于普通对象响应
            if (typeof response === "object") {
                // 安全地序列化响应对象，避免循环引用和访问器错误
                try {
                    const safeResponse = this.createSafeResponseObject(response);
                    const size = JSON.stringify(safeResponse).length;
                    if (size < 1024) return `${size}B`;
                    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)}KB`;
                    return `${(size / (1024 * 1024)).toFixed(2)}MB`;
                } catch (serializationError) {
                    // 如果序列化失败，返回对象类型信息
                    return `object(${response.constructor?.name || "unknown"})`;
                }
            }

            return "unknown";
        } catch {
            return "unknown";
        }
    }

    /**
     * 创建安全的响应对象，避免循环引用和访问器错误
     * @param obj 原始对象
     * @returns 安全的对象
     */
    private createSafeResponseObject(obj: any): any {
        if (obj === null || obj === undefined) {
            return obj;
        }

        if (typeof obj !== "object") {
            return obj;
        }

        // 避免循环引用
        const seen = new WeakSet();

        const safeCopy = (value: any, depth = 0): any => {
            // 限制递归深度
            if (depth > 5) {
                return "[Max Depth Reached]";
            }

            if (value === null || value === undefined) {
                return value;
            }

            if (typeof value !== "object") {
                return value;
            }

            if (seen.has(value)) {
                return "[Circular Reference]";
            }

            seen.add(value);

            try {
                if (Array.isArray(value)) {
                    return value.slice(0, 10).map((item) => safeCopy(item, depth + 1)); // 限制数组长度
                }

                const result: any = {};
                const keys = Object.keys(value).slice(0, 20); // 限制属性数量

                for (const key of keys) {
                    try {
                        // 安全地访问属性，避免访问器错误
                        const propValue = value[key];
                        result[key] = safeCopy(propValue, depth + 1);
                    } catch (propError) {
                        result[key] = "[Property Access Error]";
                    }
                }

                return result;
            } catch (error) {
                return "[Object Processing Error]";
            } finally {
                seen.delete(value);
            }
        };

        return safeCopy(obj);
    }
}

/**
 * 存储性能监控拦截器
 * 收集和记录存储操作的性能指标
 */
@Injectable()
export class StoragePerformanceInterceptor implements NestInterceptor {
    private readonly logger = new Logger(StoragePerformanceInterceptor.name);
    private readonly performanceMetrics = new Map<string, number[]>();

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const operation = this.extractOperation(request.method, request.url);
        const startTime = Date.now();

        return next.handle().pipe(
            tap(() => {
                const duration = Date.now() - startTime;
                this.recordMetric(operation, duration);

                // 如果操作耗时超过阈值，记录警告
                if (duration > this.getThreshold(operation)) {
                    this.logger.warn(`Slow storage operation detected: ${operation}`, {
                        duration: `${duration}ms`,
                        threshold: `${this.getThreshold(operation)}ms`,
                    });
                }
            }),
            catchError((error) => {
                const duration = Date.now() - startTime;
                this.recordMetric(`${operation}_ERROR`, duration);
                throw error;
            }),
        );
    }

    /**
     * 记录性能指标
     * @param operation 操作类型
     * @param duration 耗时
     */
    private recordMetric(operation: string, duration: number): void {
        if (!this.performanceMetrics.has(operation)) {
            this.performanceMetrics.set(operation, []);
        }

        const metrics = this.performanceMetrics.get(operation);
        if (!metrics) {
            return;
        }
        metrics.push(duration);

        // 只保留最近100次记录
        if (metrics.length > 100) {
            metrics.shift();
        }
    }

    /**
     * 获取操作的性能阈值
     * @param operation 操作类型
     * @returns 阈值（毫秒）
     */
    private getThreshold(operation: string): number {
        const thresholds = {
            UPLOAD: 10000, // 10秒
            DOWNLOAD: 5000, // 5秒
            DELETE: 2000, // 2秒
            LIST: 1000, // 1秒
            HEALTH_CHECK: 500, // 0.5秒
        };

        return thresholds[operation] || 3000; // 默认3秒
    }

    /**
     * 从请求中提取操作类型
     * @param method HTTP方法
     * @param url 请求URL
     * @returns 操作类型
     */
    private extractOperation(method: string, url: string): string {
        if (url.includes("/upload")) return "UPLOAD";
        if (url.includes("/download")) return "DOWNLOAD";
        if (method === "DELETE") return "DELETE";
        if (url.includes("/list")) return "LIST";
        if (url.includes("/health")) return "HEALTH_CHECK";

        return "UNKNOWN";
    }

    /**
     * 获取性能统计信息
     * @returns 性能统计
     */
    getPerformanceStats(): Record<string, any> {
        const stats = {};

        for (const [operation, durations] of this.performanceMetrics.entries()) {
            if (durations.length === 0) continue;

            const sorted = [...durations].sort((a, b) => a - b);
            stats[operation] = {
                count: durations.length,
                avg: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
                min: Math.min(...durations),
                max: Math.max(...durations),
                p50: sorted[Math.floor(sorted.length * 0.5)],
                p95: sorted[Math.floor(sorted.length * 0.95)],
                p99: sorted[Math.floor(sorted.length * 0.99)],
            };
        }

        return stats;
    }
}

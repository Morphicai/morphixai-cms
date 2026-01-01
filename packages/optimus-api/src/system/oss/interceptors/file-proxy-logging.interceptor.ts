import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap, catchError } from "rxjs/operators";
import { Request, Response } from "express";
import {
    shouldLogOperationStart,
    shouldLogSuccessfulOperation,
    shouldLogPerformanceMetrics,
} from "../../../shared/utils/env.util";

/**
 * 文件代理访问日志拦截器
 * 专门记录文件代理访问的详细日志和性能指标
 */
@Injectable()
export class FileProxyLoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(FileProxyLoggingInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest<Request>();
        const response = context.switchToHttp().getResponse<Response>();
        const startTime = Date.now();

        // 生成请求追踪ID
        const requestId = this.generateRequestId();

        // 提取请求信息
        const requestInfo = this.extractRequestInfo(request, requestId);

        // 根据环境变量配置决定是否记录请求开始日志
        if (shouldLogOperationStart()) {
            this.logger.log("File proxy access started", requestInfo);
        }

        return next.handle().pipe(
            tap((result) => {
                const duration = Date.now() - startTime;
                const responseInfo = this.extractResponseInfo(response, result, duration, requestId);

                // 根据环境变量配置决定是否记录成功操作日志
                if (shouldLogSuccessfulOperation(duration)) {
                    this.logger.log("File proxy access completed successfully", {
                        ...requestInfo,
                        ...responseInfo,
                        success: true,
                    });
                }

                // 记录性能指标（根据环境变量配置）
                if (shouldLogSuccessfulOperation(duration)) {
                    this.recordPerformanceMetrics(requestInfo.fileKey, requestInfo.provider, duration, true);
                }
            }),
            catchError((error) => {
                const duration = Date.now() - startTime;

                // 错误日志始终记录
                this.logger.error("File proxy access failed", {
                    ...requestInfo,
                    duration: `${duration}ms`,
                    success: false,
                    error: {
                        name: error.name,
                        message: error.message,
                        type: error.type || "UNKNOWN",
                        statusCode: error.statusCode || 500,
                    },
                });

                // 记录性能指标
                this.recordPerformanceMetrics(requestInfo.fileKey, requestInfo.provider, duration, false);

                throw error;
            }),
        );
    }

    /**
     * 提取请求信息
     * @param request 请求对象
     * @param requestId 请求追踪ID
     * @returns 请求信息
     */
    private extractRequestInfo(request: Request, requestId: string) {
        return {
            requestId,
            timestamp: new Date().toISOString(),
            method: request.method,
            url: request.url,
            fileKey: request.params.fileKey,
            provider: (request.query.provider as string) || "default",
            userAgent: request.get("User-Agent"),
            ip: request.ip || request.connection.remoteAddress,
            referer: request.get("Referer"),
            userId: (request as any).user?.id,
            sessionId: (request as any).session?.id,
        };
    }

    /**
     * 提取响应信息
     * @param response 响应对象
     * @param result 处理结果
     * @param duration 处理耗时
     * @param requestId 请求追踪ID
     * @returns 响应信息
     */
    private extractResponseInfo(response: Response, result: any, duration: number, requestId: string) {
        // 安全地提取结果信息，避免访问undefined的属性
        const safeResult = result || {};

        return {
            duration: `${duration}ms`,
            statusCode: response.statusCode,
            redirectUrl: safeResult.redirectUrl || response.get("Location"),
            provider: safeResult.provider || response.get("X-Proxy-Provider"),
            expiresAt: safeResult.expiresAt || response.get("X-Proxy-Expires-At"),
            responseHeaders: {
                "X-Request-ID": requestId,
                "X-Proxy-Provider": safeResult.provider || response.get("X-Proxy-Provider"),
                "X-Proxy-Expires-At": safeResult.expiresAt || response.get("X-Proxy-Expires-At"),
            },
        };
    }

    /**
     * 记录性能指标
     * @param fileKey 文件键名
     * @param provider 存储提供商
     * @param duration 耗时
     * @param success 是否成功
     */
    private recordPerformanceMetrics(fileKey: string, provider: string, duration: number, success: boolean) {
        const metrics = {
            operation: "FILE_PROXY_ACCESS",
            fileKey,
            provider,
            duration,
            success,
            timestamp: new Date().toISOString(),
        };

        // 如果耗时超过阈值，记录警告
        const threshold = 2000; // 2秒阈值
        if (duration > threshold) {
            this.logger.warn("Slow file proxy access detected", {
                ...metrics,
                threshold: `${threshold}ms`,
                performance: "SLOW",
            });
        }

        // 根据环境变量配置决定是否记录性能指标（DEBUG 级别）
        if (shouldLogPerformanceMetrics()) {
            this.logger.debug("File proxy performance metrics", metrics);
        }
    }

    /**
     * 生成请求追踪ID
     * @returns 请求追踪ID
     */
    private generateRequestId(): string {
        return `fp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

/**
 * 文件代理访问统计拦截器
 * 收集和统计文件代理访问的各种指标
 */
@Injectable()
export class FileProxyStatsInterceptor implements NestInterceptor {
    private readonly logger = new Logger(FileProxyStatsInterceptor.name);
    private readonly stats = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        providerStats: new Map<string, { success: number; failed: number }>(),
        responseTimeStats: [] as number[],
        errorStats: new Map<string, number>(),
    };

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest<Request>();
        const startTime = Date.now();
        const provider = (request.query.provider as string) || "default";

        // 增加总请求数
        this.stats.totalRequests++;

        return next.handle().pipe(
            tap(() => {
                const duration = Date.now() - startTime;

                // 记录成功统计
                this.stats.successfulRequests++;
                this.updateProviderStats(provider, true);
                this.updateResponseTimeStats(duration);

                // 每100次请求输出一次统计信息
                if (this.stats.totalRequests % 100 === 0) {
                    this.logStatistics();
                }
            }),
            catchError((error) => {
                const duration = Date.now() - startTime;

                // 记录失败统计
                this.stats.failedRequests++;
                this.updateProviderStats(provider, false);
                this.updateResponseTimeStats(duration);
                this.updateErrorStats(error.type || error.name || "UNKNOWN");

                throw error;
            }),
        );
    }

    /**
     * 更新存储提供商统计
     * @param provider 存储提供商
     * @param success 是否成功
     */
    private updateProviderStats(provider: string, success: boolean) {
        if (!this.stats.providerStats.has(provider)) {
            this.stats.providerStats.set(provider, { success: 0, failed: 0 });
        }

        const providerStat = this.stats.providerStats.get(provider);
        if (!providerStat) {
            return;
        }
        if (success) {
            providerStat.success++;
        } else {
            providerStat.failed++;
        }
    }

    /**
     * 更新响应时间统计
     * @param duration 响应时间
     */
    private updateResponseTimeStats(duration: number) {
        this.stats.responseTimeStats.push(duration);

        // 只保留最近1000次记录
        if (this.stats.responseTimeStats.length > 1000) {
            this.stats.responseTimeStats.shift();
        }
    }

    /**
     * 更新错误统计
     * @param errorType 错误类型
     */
    private updateErrorStats(errorType: string) {
        const count = this.stats.errorStats.get(errorType) || 0;
        this.stats.errorStats.set(errorType, count + 1);
    }

    /**
     * 输出统计信息
     */
    private logStatistics() {
        const successRate = ((this.stats.successfulRequests / this.stats.totalRequests) * 100).toFixed(2);
        const avgResponseTime =
            this.stats.responseTimeStats.length > 0
                ? Math.round(
                      this.stats.responseTimeStats.reduce((a, b) => a + b, 0) / this.stats.responseTimeStats.length,
                  )
                : 0;

        this.logger.log("File proxy access statistics", {
            totalRequests: this.stats.totalRequests,
            successfulRequests: this.stats.successfulRequests,
            failedRequests: this.stats.failedRequests,
            successRate: `${successRate}%`,
            avgResponseTime: `${avgResponseTime}ms`,
            providerStats: Object.fromEntries(this.stats.providerStats),
            topErrors: this.getTopErrors(),
        });
    }

    /**
     * 获取最常见的错误类型
     * @returns 错误统计
     */
    private getTopErrors(): Record<string, number> {
        const sortedErrors = Array.from(this.stats.errorStats.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

        return Object.fromEntries(sortedErrors);
    }

    /**
     * 获取完整统计信息
     * @returns 统计信息
     */
    getStats() {
        return {
            ...this.stats,
            providerStats: Object.fromEntries(this.stats.providerStats),
            errorStats: Object.fromEntries(this.stats.errorStats),
        };
    }
}

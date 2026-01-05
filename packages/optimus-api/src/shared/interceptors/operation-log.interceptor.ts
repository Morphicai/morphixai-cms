import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, throwError } from "rxjs";
import { tap, catchError } from "rxjs/operators";
import { OperationLogService } from "../services/operation-log.service";
import { OPERATION_LOG_KEY, OperationLogOptions } from "../decorators/operation-log.decorator";

/**
 * 操作日志拦截器
 * 自动记录带有 @OperationLog 装饰器的方法的操作日志
 */
@Injectable()
export class OperationLogInterceptor implements NestInterceptor {
    private readonly logger = new Logger(OperationLogInterceptor.name);

    constructor(private reflector: Reflector, private operationLogService: OperationLogService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        // 获取装饰器配置
        const logOptions = this.reflector.get<OperationLogOptions>(OPERATION_LOG_KEY, context.getHandler());

        // 如果没有配置日志装饰器，直接放行
        if (!logOptions) {
            return next.handle();
        }

        const request = context.switchToHttp().getRequest();
        const { user, body, params, query, method, url, ip, headers } = request;

        const startTime = Date.now();

        // 记录操作前数据
        const beforeData = logOptions.recordParams !== false ? { ...body, ...params, ...query } : undefined;

        // 获取用户ID：优先使用 JWT 认证的 user.id，其次使用客户端用户认证的 clientUser.userId
        const getUserId = (): string | undefined => {
            if (user?.id) {
                return user.id;
            }
            const clientUser = (request as any).clientUser;
            if (clientUser?.userId) {
                return clientUser.userId;
            }
            return undefined;
        };

        return next.handle().pipe(
            tap(async (response) => {
                try {
                    const duration = Date.now() - startTime;

                    // 提取响应数据
                    let afterData = undefined;
                    if (logOptions.recordResponse !== false) {
                        // 如果响应是 ResultData 格式，提取 data 字段
                        afterData = response?.data || response;
                    }

                    // 生成描述
                    const description = this.generateDescription(logOptions, params, body);

                    // 记录成功日志
                    await this.operationLogService.createLog({
                        module: logOptions.module,
                        action: logOptions.action,
                        description,
                        userId: getUserId(),
                        beforeData,
                        afterData,
                        status: "success",
                        duration,
                        ip: this.getClientIp(request),
                        userAgent: headers["user-agent"],
                        method,
                        path: url,
                    });
                } catch (error) {
                    this.logger.error(`Failed to log operation: ${error.message}`, error.stack);
                }
            }),
            catchError((error) => {
                // 异步记录失败日志，不阻塞错误抛出
                setImmediate(async () => {
                    try {
                        const duration = Date.now() - startTime;
                        const description = this.generateDescription(logOptions, params, body);

                        // 获取用户ID（需要在闭包中重新获取，因为 user 可能已变化）
                        const userId = (() => {
                            const req = context.switchToHttp().getRequest();
                            if (req.user?.id) {
                                return req.user.id;
                            }
                            const clientUser = (req as any).clientUser;
                            if (clientUser?.userId) {
                                return clientUser.userId;
                            }
                            return undefined;
                        })();

                        await this.operationLogService.createLog({
                            module: logOptions.module,
                            action: logOptions.action,
                            description,
                            userId,
                            beforeData,
                            status: "failed",
                            errorMessage: error.message || error.toString(),
                            duration,
                            ip: this.getClientIp(request),
                            userAgent: headers["user-agent"],
                            method,
                            path: url,
                        });
                    } catch (logError) {
                        this.logger.error(`Failed to log error operation: ${logError.message}`, logError.stack);
                    }
                });

                return throwError(() => error);
            }),
        );
    }

    /**
     * 生成操作描述
     * 支持模板变量替换，如：'更新用户 {id}'
     */
    private generateDescription(options: OperationLogOptions, params: any, body: any): string {
        let description = options.description || `${options.action} ${options.module}`;

        // 替换模板变量
        if (description.includes("{")) {
            const allData = { ...params, ...body };
            description = description.replace(/\{(\w+)\}/g, (match, key) => {
                return allData[key] !== undefined ? allData[key] : match;
            });
        }

        return description;
    }

    /**
     * 获取客户端真实IP
     * 考虑代理和负载均衡的情况
     */
    private getClientIp(request: any): string {
        return (
            request.headers["x-forwarded-for"]?.split(",")[0] ||
            request.headers["x-real-ip"] ||
            request.connection?.remoteAddress ||
            request.socket?.remoteAddress ||
            request.ip ||
            "unknown"
        );
    }
}

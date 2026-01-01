import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Request, Response } from "express";
import { SentryExceptionCaptured } from "@sentry/nestjs";

/**
 * 全局异常过滤器
 * 捕获所有未处理的异常，防止应用崩溃，确保其他接口正常工作
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    @SentryExceptionCaptured()
    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        // 确定HTTP状态码
        const status = this.getHttpStatus(exception);

        // 提取错误信息
        const errorInfo = this.extractErrorInfo(exception);

        // 生成错误响应
        const errorResponse = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            message: errorInfo.message,
            error: errorInfo.error,
            requestId: this.generateRequestId(),
        };

        // 记录错误日志
        this.logError(exception, request, errorResponse);

        // 发送错误响应（如果响应未发送）
        this.sendErrorResponse(response, status, errorResponse);
    }

    /**
     * 获取HTTP状态码
     * @param exception 异常对象
     * @returns HTTP状态码
     */
    private getHttpStatus(exception: unknown): number {
        if (exception instanceof HttpException) {
            return exception.getStatus();
        }

        // 根据错误类型返回适当的状态码
        if (exception instanceof Error) {
            const message = exception.message.toLowerCase();

            if (message.includes("not found") || message.includes("file not found")) {
                return HttpStatus.NOT_FOUND;
            }

            if (message.includes("unauthorized") || message.includes("access denied")) {
                return HttpStatus.UNAUTHORIZED;
            }

            if (message.includes("forbidden")) {
                return HttpStatus.FORBIDDEN;
            }

            if (message.includes("bad request") || message.includes("invalid")) {
                return HttpStatus.BAD_REQUEST;
            }

            if (message.includes("timeout") || message.includes("connection")) {
                return HttpStatus.REQUEST_TIMEOUT;
            }
        }

        return HttpStatus.INTERNAL_SERVER_ERROR;
    }

    /**
     * 提取错误信息
     * @param exception 异常对象
     * @returns 错误信息
     */
    private extractErrorInfo(exception: unknown): { message: string; error: string } {
        if (exception instanceof HttpException) {
            const response = exception.getResponse();
            return {
                message: typeof response === "string" ? response : (response as any).message || exception.message,
                error: exception.name,
            };
        }

        if (exception instanceof Error) {
            return {
                message: exception.message || "Internal server error",
                error: exception.name || "Error",
            };
        }

        return {
            message: "Unknown error occurred",
            error: "UnknownError",
        };
    }

    /**
     * 记录错误日志
     * @param exception 异常对象
     * @param request 请求对象
     * @param errorResponse 错误响应
     */
    private logError(exception: unknown, request: Request, errorResponse: any): void {
        const { method, url, ip, headers } = request;
        const userAgent = headers["user-agent"] || "";

        const logContext = {
            requestId: errorResponse.requestId,
            method,
            url,
            ip,
            userAgent,
            statusCode: errorResponse.statusCode,
            timestamp: errorResponse.timestamp,
        };

        // 根据错误严重程度选择日志级别
        if (errorResponse.statusCode >= 500) {
            this.logger.error(`Server Error: ${errorResponse.message}`, {
                ...logContext,
                stack: exception instanceof Error ? exception.stack : undefined,
                exception: exception instanceof Error ? exception.name : typeof exception,
            });
        } else if (errorResponse.statusCode >= 400) {
            this.logger.warn(`Client Error: ${errorResponse.message}`, logContext);
        } else {
            this.logger.log(
                `Request processed with status ${errorResponse.statusCode}: ${errorResponse.message}`,
                logContext,
            );
        }
    }

    /**
     * 发送错误响应
     * @param response 响应对象
     * @param status HTTP状态码
     * @param errorResponse 错误响应数据
     */
    private sendErrorResponse(response: Response, status: number, errorResponse: any): void {
        try {
            // 检查响应是否已经发送
            if (response.headersSent) {
                this.logger.warn(
                    `Cannot send error response, headers already sent for request ${errorResponse.requestId}`,
                );
                return;
            }

            // 设置安全响应头
            response.set({
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": "DENY",
                "X-XSS-Protection": "1; mode=block",
                "X-Request-ID": errorResponse.requestId,
            });

            // 发送JSON错误响应
            response.status(status).json(errorResponse);
        } catch (responseError) {
            // 如果发送响应失败，记录错误但不抛出异常
            this.logger.error(`Failed to send error response for request ${errorResponse.requestId}`, responseError);
        }
    }

    /**
     * 生成请求ID
     * @returns 请求ID
     */
    private generateRequestId(): string {
        return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

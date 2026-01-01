import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from "@nestjs/common";
import { Response } from "express";
import {
    FileProxyException,
    FileProxyErrorType,
    FileNotFoundProxyException,
    InvalidProviderException,
    StorageServiceException,
    SigningErrorException,
    InvalidFileKeyException,
    AccessDeniedException,
} from "../exceptions/file-proxy.exception";
import { ResultData } from "../../../shared/utils/result";

/**
 * 文件代理异常过滤器
 * 统一处理文件代理相关的异常并返回标准化的响应格式
 */
@Catch(
    FileProxyException,
    FileNotFoundProxyException,
    InvalidProviderException,
    StorageServiceException,
    SigningErrorException,
    InvalidFileKeyException,
    AccessDeniedException,
)
export class FileProxyExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(FileProxyExceptionFilter.name);

    catch(exception: FileProxyException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest();

        // 生成请求追踪ID
        const requestId = this.generateRequestId();

        // 记录异常信息
        this.logger.error(`File proxy exception occurred: ${exception.message}`, {
            requestId,
            url: request.url,
            method: request.method,
            userAgent: request.get("User-Agent"),
            ip: request.ip,
            type: exception.type,
            statusCode: exception.statusCode,
            stack: exception.stack,
            originalError: exception.originalError?.message,
        });

        // 处理异常并生成错误响应
        const errorResponse = this.handleException(exception, requestId);
        const httpStatus = exception.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;

        // 设置响应头
        response.setHeader("X-Request-ID", requestId);
        response.setHeader("X-Error-Type", exception.type);

        // 返回标准化的错误响应
        response.status(httpStatus).json(
            ResultData.fail(httpStatus, errorResponse.message, {
                code: errorResponse.code,
                type: exception.type,
                details: errorResponse.details,
                timestamp: errorResponse.timestamp,
                requestId: requestId,
            }),
        );
    }

    /**
     * 处理异常并生成错误响应
     * @param exception 异常对象
     * @param requestId 请求追踪ID
     * @returns 错误响应
     */
    private handleException(exception: FileProxyException, requestId: string) {
        const baseResponse = {
            timestamp: new Date().toISOString(),
            requestId,
        };

        switch (exception.type) {
            case FileProxyErrorType.FILE_NOT_FOUND:
                return {
                    ...baseResponse,
                    code: "FILE_NOT_FOUND",
                    message: "文件不存在",
                    details: exception.message,
                };

            case FileProxyErrorType.INVALID_PROVIDER:
                return {
                    ...baseResponse,
                    code: "INVALID_PROVIDER",
                    message: "无效的存储提供商",
                    details: exception.message,
                };

            case FileProxyErrorType.STORAGE_ERROR:
                return {
                    ...baseResponse,
                    code: "STORAGE_SERVICE_ERROR",
                    message: "存储服务错误",
                    details: exception.message,
                };

            case FileProxyErrorType.SIGNING_ERROR:
                return {
                    ...baseResponse,
                    code: "URL_SIGNING_ERROR",
                    message: "URL签名生成失败",
                    details: exception.message,
                };

            case FileProxyErrorType.INVALID_FILE_KEY:
                return {
                    ...baseResponse,
                    code: "INVALID_FILE_KEY",
                    message: "无效的文件键名",
                    details: exception.message,
                };

            case FileProxyErrorType.ACCESS_DENIED:
                return {
                    ...baseResponse,
                    code: "ACCESS_DENIED",
                    message: "访问被拒绝",
                    details: exception.message,
                };

            case FileProxyErrorType.SERVICE_UNAVAILABLE:
                return {
                    ...baseResponse,
                    code: "SERVICE_UNAVAILABLE",
                    message: "服务暂时不可用",
                    details: exception.message,
                };

            default:
                return {
                    ...baseResponse,
                    code: "UNKNOWN_ERROR",
                    message: "未知错误",
                    details: exception.message,
                };
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

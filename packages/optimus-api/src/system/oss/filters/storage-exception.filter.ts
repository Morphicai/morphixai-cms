import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from "@nestjs/common";
import { Response } from "express";
import { StorageException, StorageErrorType, ConfigurationException } from "../exceptions/storage.exception";
import { ResultData } from "../../../shared/utils/result";
import { StorageErrorHandler } from "../utils/error-handler";

/**
 * 存储异常过滤器
 * 统一处理存储相关的异常并返回标准化的响应格式
 */
@Catch(StorageException, ConfigurationException)
export class StorageExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(StorageExceptionFilter.name);

    catch(exception: StorageException | ConfigurationException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest();

        // 记录异常信息
        this.logger.error(`Storage exception occurred: ${exception.message}`, {
            url: request.url,
            method: request.method,
            userAgent: request.get("User-Agent"),
            ip: request.ip,
            stack: exception.stack,
        });

        // 处理异常并生成错误响应
        const errorResponse = this.handleException(exception);
        const httpStatus = this.getHttpStatus(exception);

        // 返回标准化的错误响应
        response.status(httpStatus).json(
            ResultData.fail(httpStatus, errorResponse.message, {
                code: errorResponse.code,
                details: errorResponse.details,
                timestamp: errorResponse.timestamp,
            }),
        );
    }

    /**
     * 处理异常并生成错误响应
     * @param exception 异常对象
     * @returns 错误响应
     */
    private handleException(exception: StorageException | ConfigurationException) {
        // ConfigurationException extends StorageException, so check for it first
        if (exception.name === "ConfigurationException") {
            return {
                code: "STORAGE_CONFIG_ERROR",
                message: "存储配置错误",
                details: exception.message,
                timestamp: new Date().toISOString(),
            };
        }

        if (exception instanceof StorageException) {
            return StorageErrorHandler.handle(exception);
        }

        return StorageErrorHandler.handleGenericError(exception as Error);
    }

    /**
     * 根据异常类型获取HTTP状态码
     * @param exception 异常对象
     * @returns HTTP状态码
     */
    private getHttpStatus(exception: StorageException | ConfigurationException): number {
        // ConfigurationException extends StorageException, so check for it first
        if (exception.name === "ConfigurationException") {
            return HttpStatus.INTERNAL_SERVER_ERROR;
        }

        if (exception instanceof StorageException) {
            switch (exception.type) {
                case StorageErrorType.CONFIG_ERROR:
                    return HttpStatus.INTERNAL_SERVER_ERROR;
                case StorageErrorType.PERMISSION_ERROR:
                    return HttpStatus.FORBIDDEN;
                case StorageErrorType.FILE_NOT_FOUND:
                    return HttpStatus.NOT_FOUND;
                case StorageErrorType.INVALID_FILE:
                    return HttpStatus.BAD_REQUEST;
                case StorageErrorType.CONNECTION_ERROR:
                    return HttpStatus.SERVICE_UNAVAILABLE;
                case StorageErrorType.UPLOAD_ERROR:
                case StorageErrorType.DOWNLOAD_ERROR:
                case StorageErrorType.DELETE_ERROR:
                case StorageErrorType.BUCKET_ERROR:
                    return HttpStatus.INTERNAL_SERVER_ERROR;
                default:
                    return HttpStatus.INTERNAL_SERVER_ERROR;
            }
        }

        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
}

import { Logger } from "@nestjs/common";
import { StorageException, StorageErrorType } from "../exceptions/storage.exception";

/**
 * 错误响应接口
 */
export interface ErrorResponse {
    code: string;
    message: string;
    details?: string;
    timestamp?: string;
}

/**
 * 存储错误处理器
 */
export class StorageErrorHandler {
    private static readonly logger = new Logger(StorageErrorHandler.name);

    /**
     * 处理存储异常
     * @param error 存储异常
     * @returns 错误响应
     */
    static handle(error: StorageException): ErrorResponse {
        this.logger.error(`Storage error occurred: ${error.message}`, error.stack);

        const response: ErrorResponse = {
            code: "",
            message: "",
            timestamp: new Date().toISOString(),
        };

        switch (error.type) {
            case StorageErrorType.CONFIG_ERROR:
                response.code = "STORAGE_CONFIG_ERROR";
                response.message = "存储配置错误";
                response.details = error.message;
                break;

            case StorageErrorType.UPLOAD_ERROR:
                response.code = "STORAGE_UPLOAD_ERROR";
                response.message = "文件上传失败";
                response.details = error.message;
                break;

            case StorageErrorType.DOWNLOAD_ERROR:
                response.code = "STORAGE_DOWNLOAD_ERROR";
                response.message = "文件下载失败";
                response.details = error.message;
                break;

            case StorageErrorType.DELETE_ERROR:
                response.code = "STORAGE_DELETE_ERROR";
                response.message = "文件删除失败";
                response.details = error.message;
                break;

            case StorageErrorType.CONNECTION_ERROR:
                response.code = "STORAGE_CONNECTION_ERROR";
                response.message = "存储服务连接失败";
                response.details = error.message;
                break;

            case StorageErrorType.PERMISSION_ERROR:
                response.code = "STORAGE_PERMISSION_ERROR";
                response.message = "存储权限不足";
                response.details = error.message;
                break;

            case StorageErrorType.FILE_NOT_FOUND:
                response.code = "STORAGE_FILE_NOT_FOUND";
                response.message = "文件不存在";
                response.details = error.message;
                break;

            case StorageErrorType.INVALID_FILE:
                response.code = "STORAGE_INVALID_FILE";
                response.message = "无效的文件";
                response.details = error.message;
                break;

            case StorageErrorType.BUCKET_ERROR:
                response.code = "STORAGE_BUCKET_ERROR";
                response.message = "存储桶操作失败";
                response.details = error.message;
                break;

            default:
                response.code = "STORAGE_UNKNOWN_ERROR";
                response.message = "存储服务未知错误";
                response.details = error.message;
                break;
        }

        return response;
    }

    /**
     * 处理通用错误
     * @param error 错误对象
     * @returns 错误响应
     */
    static handleGenericError(error: Error): ErrorResponse {
        this.logger.error(`Generic error occurred: ${error.message}`, error.stack);

        return {
            code: "INTERNAL_SERVER_ERROR",
            message: "服务器内部错误",
            details: error.message,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * 记录操作日志
     * @param operation 操作类型
     * @param fileKey 文件键名
     * @param provider 存储提供商
     * @param success 是否成功
     * @param duration 操作耗时（毫秒）
     */
    static logOperation(
        operation: string,
        fileKey: string,
        provider: string,
        success: boolean,
        duration?: number,
    ): void {
        const logData = {
            operation,
            fileKey,
            provider,
            success,
            duration: duration ? `${duration}ms` : undefined,
            timestamp: new Date().toISOString(),
        };

        if (success) {
            this.logger.log(`Storage operation completed: ${operation}`, logData);
        } else {
            this.logger.warn(`Storage operation failed: ${operation}`, logData);
        }
    }
}

/**
 * 重试处理器
 */
export class RetryHandler {
    private static readonly logger = new Logger(RetryHandler.name);

    /**
     * 带重试的操作执行
     * @param operation 操作函数
     * @param maxRetries 最大重试次数
     * @param delay 重试延迟（毫秒）
     * @param backoff 是否使用指数退避
     * @returns 操作结果
     */
    static async withRetry<T>(operation: () => Promise<T>, maxRetries = 3, delay = 1000, backoff = true): Promise<T> {
        let lastError: Error;
        let currentDelay = delay;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const result = await operation();

                if (attempt > 0) {
                    this.logger.log(`Operation succeeded after ${attempt} retries`);
                }

                return result;
            } catch (error) {
                lastError = error;

                if (attempt < maxRetries) {
                    this.logger.warn(
                        `Operation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${currentDelay}ms`,
                        error.message,
                    );

                    await new Promise((resolve) => setTimeout(resolve, currentDelay));

                    if (backoff) {
                        currentDelay *= 2; // 指数退避
                    }
                }
            }
        }

        this.logger.error(`Operation failed after ${maxRetries + 1} attempts`, lastError);
        throw lastError;
    }

    /**
     * 检查错误是否可重试
     * @param error 错误对象
     * @returns 是否可重试
     */
    static isRetryableError(error: Error): boolean {
        if (error instanceof StorageException) {
            // 配置错误和权限错误通常不可重试
            return ![
                StorageErrorType.CONFIG_ERROR,
                StorageErrorType.PERMISSION_ERROR,
                StorageErrorType.INVALID_FILE,
            ].includes(error.type);
        }

        // 网络相关错误通常可重试
        const retryableMessages = ["ECONNRESET", "ENOTFOUND", "ECONNREFUSED", "ETIMEDOUT", "timeout", "network"];

        return retryableMessages.some((msg) => error.message.toLowerCase().includes(msg.toLowerCase()));
    }
}

/**
 * 文件代理错误类型枚举
 */
export enum FileProxyErrorType {
    FILE_NOT_FOUND = "FILE_NOT_FOUND",
    INVALID_PROVIDER = "INVALID_PROVIDER",
    STORAGE_ERROR = "STORAGE_ERROR",
    SIGNING_ERROR = "SIGNING_ERROR",
    INVALID_FILE_KEY = "INVALID_FILE_KEY",
    ACCESS_DENIED = "ACCESS_DENIED",
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
}

/**
 * 文件代理异常类
 */
export class FileProxyException extends Error {
    constructor(
        public readonly type: FileProxyErrorType,
        public readonly message: string,
        public readonly statusCode: number = 500,
        public readonly originalError?: Error,
    ) {
        super(message);
        this.name = "FileProxyException";

        // 保持错误堆栈跟踪
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, FileProxyException);
        }
    }

    /**
     * 获取错误详情
     * @returns 错误详情对象
     */
    getErrorDetails() {
        return {
            type: this.type,
            message: this.message,
            statusCode: this.statusCode,
            originalError: this.originalError?.message,
            stack: this.stack,
        };
    }

    /**
     * 转换为JSON格式
     * @returns JSON对象
     */
    toJSON() {
        return {
            name: this.name,
            type: this.type,
            message: this.message,
            statusCode: this.statusCode,
            originalError: this.originalError?.message,
        };
    }
}

/**
 * 文件未找到异常
 */
export class FileNotFoundProxyException extends FileProxyException {
    constructor(fileKey: string, originalError?: Error) {
        super(FileProxyErrorType.FILE_NOT_FOUND, `File not found: ${fileKey}`, 404, originalError);
        this.name = "FileNotFoundProxyException";
    }
}

/**
 * 无效存储提供商异常
 */
export class InvalidProviderException extends FileProxyException {
    constructor(provider: string, originalError?: Error) {
        super(FileProxyErrorType.INVALID_PROVIDER, `Invalid storage provider: ${provider}`, 400, originalError);
        this.name = "InvalidProviderException";
    }
}

/**
 * 存储服务错误异常
 */
export class StorageServiceException extends FileProxyException {
    constructor(message: string, originalError?: Error) {
        super(FileProxyErrorType.STORAGE_ERROR, message, 503, originalError);
        this.name = "StorageServiceException";
    }
}

/**
 * URL签名错误异常
 */
export class SigningErrorException extends FileProxyException {
    constructor(message: string, originalError?: Error) {
        super(FileProxyErrorType.SIGNING_ERROR, `URL signing failed: ${message}`, 500, originalError);
        this.name = "SigningErrorException";
    }
}

/**
 * 无效文件键异常
 */
export class InvalidFileKeyException extends FileProxyException {
    constructor(fileKey: string, originalError?: Error) {
        super(FileProxyErrorType.INVALID_FILE_KEY, `Invalid file key format: ${fileKey}`, 400, originalError);
        this.name = "InvalidFileKeyException";
    }
}

/**
 * 访问拒绝异常
 */
export class AccessDeniedException extends FileProxyException {
    constructor(fileKey: string, originalError?: Error) {
        super(FileProxyErrorType.ACCESS_DENIED, `Access denied for file: ${fileKey}`, 403, originalError);
        this.name = "AccessDeniedException";
    }
}

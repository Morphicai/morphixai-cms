/**
 * 存储错误类型枚举
 */
export enum StorageErrorType {
    CONFIG_ERROR = "CONFIG_ERROR",
    UPLOAD_ERROR = "UPLOAD_ERROR",
    DOWNLOAD_ERROR = "DOWNLOAD_ERROR",
    DELETE_ERROR = "DELETE_ERROR",
    CONNECTION_ERROR = "CONNECTION_ERROR",
    PERMISSION_ERROR = "PERMISSION_ERROR",
    FILE_NOT_FOUND = "FILE_NOT_FOUND",
    INVALID_FILE = "INVALID_FILE",
    BUCKET_ERROR = "BUCKET_ERROR",
    SIGNING_ERROR = "SIGNING_ERROR",
    UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * 存储异常类
 */
export class StorageException extends Error {
    constructor(
        public readonly type: StorageErrorType,
        public readonly message: string,
        public readonly originalError?: Error,
    ) {
        super(message);
        this.name = "StorageException";

        // 保持错误堆栈跟踪
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, StorageException);
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
            originalError: this.originalError?.message,
        };
    }
}

/**
 * 配置错误异常
 */
export class ConfigurationException extends StorageException {
    constructor(message: string, originalError?: Error) {
        super(StorageErrorType.CONFIG_ERROR, message, originalError);
        this.name = "ConfigurationException";
    }
}

/**
 * 文件上传错误异常
 */
export class UploadException extends StorageException {
    constructor(message: string, originalError?: Error) {
        super(StorageErrorType.UPLOAD_ERROR, message, originalError);
        this.name = "UploadException";
    }
}

/**
 * 文件下载错误异常
 */
export class DownloadException extends StorageException {
    constructor(message: string, originalError?: Error) {
        super(StorageErrorType.DOWNLOAD_ERROR, message, originalError);
        this.name = "DownloadException";
    }
}

/**
 * 文件删除错误异常
 */
export class DeleteException extends StorageException {
    constructor(message: string, originalError?: Error) {
        super(StorageErrorType.DELETE_ERROR, message, originalError);
        this.name = "DeleteException";
    }
}

/**
 * 连接错误异常
 */
export class ConnectionException extends StorageException {
    constructor(message: string, originalError?: Error) {
        super(StorageErrorType.CONNECTION_ERROR, message, originalError);
        this.name = "ConnectionException";
    }
}

/**
 * 权限错误异常
 */
export class PermissionException extends StorageException {
    constructor(message: string, originalError?: Error) {
        super(StorageErrorType.PERMISSION_ERROR, message, originalError);
        this.name = "PermissionException";
    }
}

/**
 * 文件未找到异常
 */
export class FileNotFoundException extends StorageException {
    constructor(fileKey: string, originalError?: Error) {
        super(StorageErrorType.FILE_NOT_FOUND, `File not found: ${fileKey}`, originalError);
        this.name = "FileNotFoundException";
    }
}

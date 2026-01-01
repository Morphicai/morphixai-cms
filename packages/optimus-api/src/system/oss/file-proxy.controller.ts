import {
    Controller,
    Get,
    Param,
    Query,
    Res,
    Logger,
    HttpStatus,
    BadRequestException,
    NotFoundException,
    ServiceUnavailableException,
    InternalServerErrorException,
    UseFilters,
    UseInterceptors,
} from "@nestjs/common";
import { Response } from "express";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { TemporaryUrlService } from "./services/temporary-url.service";
import { FileProxyLoggerService } from "./services/file-proxy-logger.service";
import { FileCacheService } from "./services/file-cache.service";
import { StorageException, StorageErrorType, ConfigurationException } from "./exceptions/storage.exception";
import {
    FileProxyException,
    FileProxyErrorType,
    FileNotFoundProxyException,
    InvalidProviderException,
    InvalidFileKeyException,
    StorageServiceException,
    SigningErrorException,
} from "./exceptions/file-proxy.exception";
import { FileProxyExceptionFilter } from "./filters/file-proxy-exception.filter";
import { FileProxyLoggingInterceptor, FileProxyStatsInterceptor } from "./interceptors/file-proxy-logging.interceptor";
import { AllowAnonymous } from "../../shared/decorators/allow-anonymous.decorator";

/**
 * 文件代理控制器
 * 提供统一的文件访问代理接口，通过流式传输方式代理 OSS 文件
 */
@Controller("proxy")
@UseFilters(FileProxyExceptionFilter)
@UseInterceptors(FileProxyLoggingInterceptor, FileProxyStatsInterceptor)
export class FileProxyController {
    private readonly logger = new Logger(FileProxyController.name);

    constructor(
        private readonly temporaryUrlService: TemporaryUrlService,
        private readonly fileProxyLogger: FileProxyLoggerService,
        private readonly fileCacheService: FileCacheService,
    ) {}

    /**
     * 代理文件访问（流式传输）
     * @param fileKey 文件键名
     * @param provider 存储提供商（可选）
     * @param res Express 响应对象
     */
    @Get("file/:fileKey(*)")
    @AllowAnonymous() // 允许匿名访问，便于直接链接
    async proxyFileAccess(
        @Param("fileKey") fileKey: string,
        @Res() res: Response,
        @Query("provider") provider?: string,
    ): Promise<void> {
        const requestId = uuidv4();
        const startTime = Date.now();

        this.logger.log(
            `[${requestId}] Proxy access request (streaming) - fileKey: ${fileKey}, provider: ${provider || "default"}`,
        );

        try {
            // 检查响应是否已经发送
            if (res.headersSent) {
                this.logger.warn(`[${requestId}] Response already sent, aborting proxy access`);
                return;
            }

            // 参数验证和安全检查
            this.validateParameters(fileKey, provider);

            // 生成临时 URL
            const temporaryUrlResponse = await this.temporaryUrlService.generateTemporaryUrl(fileKey, {
                provider,
            });

            // 再次检查响应是否已经发送
            if (res.headersSent) {
                this.logger.warn(`[${requestId}] Response sent during processing, cannot stream`);
                return;
            }

            // 执行缓存代理传输
            await this.performStreamProxy(res, temporaryUrlResponse, requestId, fileKey);

            const duration = Date.now() - startTime;
            this.logger.log(
                `[${requestId}] Proxy access successful (streaming) - fileKey: ${fileKey}, provider: ${temporaryUrlResponse.provider}, duration: ${duration}ms`,
            );
        } catch (error) {
            const duration = Date.now() - startTime;

            // 只有在响应未发送时才处理错误
            if (!res.headersSent) {
                this.handleError(error, fileKey, requestId, duration, res);
            } else {
                this.logger.error(
                    `[${requestId}] Error occurred after response sent - fileKey: ${fileKey}, duration: ${duration}ms`,
                    error,
                );
            }
        }
    }

    /**
     * 验证请求参数
     * @param fileKey 文件键名
     * @param provider 存储提供商
     */
    private validateParameters(fileKey: string, provider?: string): void {
        // 验证 fileKey
        if (!fileKey || typeof fileKey !== "string") {
            throw new InvalidFileKeyException("File key is required and must be a string");
        }

        // 验证 fileKey 格式（防止路径遍历攻击）
        if (fileKey.includes("..") || fileKey.includes("//")) {
            throw new InvalidFileKeyException("Path traversal detected in file key");
        }

        // 检查真正危险的字符（移除双引号，因为双引号在文件系统中通常是安全的，且已有数据中包含JSON字符串）
        // 保留对控制字符、路径分隔符等的检查
        const dangerousChars = /[<>|?*\x00-\x1f]/;
        if (dangerousChars.test(fileKey)) {
            throw new InvalidFileKeyException("File key contains dangerous characters");
        }

        // 验证 provider（如果提供）
        if (provider && !["aliyun", "minio"].includes(provider)) {
            throw new InvalidProviderException(provider);
        }

        // 检查文件键名长度
        if (fileKey.length > 1024) {
            throw new InvalidFileKeyException("File key is too long (max 1024 characters)");
        }
    }

    /**
     * 执行缓存代理传输
     * @param res Express 响应对象
     * @param temporaryUrlResponse 临时 URL 响应
     * @param requestId 请求追踪 ID
     * @param fileKey 文件键名
     */
    private async performStreamProxy(
        res: Response,
        temporaryUrlResponse: any,
        requestId: string,
        fileKey: string,
    ): Promise<void> {
        try {
            // 检查响应是否已经发送
            if (res.headersSent) {
                this.logger.warn(`[${requestId}] Cannot set headers, response already sent`);
                return;
            }

            // 验证临时URL是否有效
            if (!temporaryUrlResponse?.temporaryUrl) {
                throw new Error("Invalid temporary URL response");
            }

            const provider = temporaryUrlResponse.provider || "unknown";

            // 先尝试从缓存获取
            let cachedFile = await this.fileCacheService.get(fileKey, provider);

            // 如果缓存未命中，从 OSS 获取并缓存
            if (!cachedFile) {
                cachedFile = await this.fileCacheService.fetchAndCache(
                    fileKey,
                    provider,
                    temporaryUrlResponse.temporaryUrl,
                    requestId,
                );
            }

            // 再次检查响应是否已经发送
            if (res.headersSent) {
                this.logger.warn(`[${requestId}] Response already sent, cannot send cached file`);
                return;
            }

            // 设置响应头
            const headers: Record<string, string> = {
                "X-Request-ID": requestId,
                "X-Proxy-Provider": provider,
                "Cache-Control": "public, max-age=31536000, immutable", // 文件内容不变，可长期缓存
                "Content-Type": cachedFile.contentType,
                "Content-Length": String(cachedFile.size),
            };

            // 添加其他响应头
            if (cachedFile.headers["last-modified"]) {
                headers["Last-Modified"] = cachedFile.headers["last-modified"];
            }

            if (cachedFile.headers.etag) {
                headers["ETag"] = cachedFile.headers.etag;
            }

            if (cachedFile.headers["content-disposition"]) {
                headers["Content-Disposition"] = cachedFile.headers["content-disposition"];
            }

            res.set(headers);
            res.status(200);

            // 直接发送缓存的 Buffer
            this.logger.debug(`[${requestId}] Sending cached file to client, size: ${cachedFile.size} bytes`);
            res.end(cachedFile.buffer);

            this.logger.debug(`[${requestId}] File sent successfully`);
        } catch (error) {
            this.logger.error(`[${requestId}] Failed to perform cached proxy`, error);

            // 如果传输失败且响应未发送，发送错误响应
            if (!res.headersSent) {
                // 检查是否是 404 错误
                if (axios.isAxiosError(error) && error.response?.status === 404) {
                    res.status(404).json({
                        error: "File not found",
                        requestId,
                        message: "The requested file does not exist",
                    });
                } else if (axios.isAxiosError(error) && error.code === "ECONNABORTED") {
                    res.status(504).json({
                        error: "Gateway timeout",
                        requestId,
                        message: "Timeout while fetching file from storage",
                    });
                } else {
                    res.status(500).json({
                        error: "Failed to proxy file",
                        requestId,
                        message: error.message,
                    });
                }
            }
        }
    }

    /**
     * 处理错误
     * @param error 错误对象
     * @param fileKey 文件键名
     * @param requestId 请求追踪 ID
     * @param duration 请求耗时
     * @param res Express 响应对象
     */
    private handleError(error: any, fileKey: string, requestId: string, duration: number, res: Response): void {
        // 记录错误日志
        this.logger.error(
            `[${requestId}] File proxy access failed - fileKey: ${fileKey}, duration: ${duration}ms`,
            error,
        );

        // 检查响应是否已经发送，避免重复设置响应头
        if (res.headersSent) {
            this.logger.warn(`[${requestId}] Response headers already sent, cannot send error response`);
            return;
        }

        // 转换存储异常为文件代理异常
        if (error instanceof StorageException) {
            switch (error.type) {
                case StorageErrorType.FILE_NOT_FOUND:
                    throw new FileNotFoundProxyException(fileKey, error);
                case StorageErrorType.CONNECTION_ERROR:
                    throw new StorageServiceException("Storage service connection failed", error);
                case StorageErrorType.SIGNING_ERROR:
                    throw new SigningErrorException("Failed to generate signed URL", error);
                case StorageErrorType.CONFIG_ERROR:
                    throw new StorageServiceException("Storage configuration error", error);
                default:
                    throw new StorageServiceException(error.message, error);
            }
        }

        if (error instanceof ConfigurationException) {
            throw new StorageServiceException("Storage configuration error", error);
        }

        // 如果已经是文件代理异常，直接抛出
        if (error instanceof FileProxyException) {
            throw error;
        }

        // 其他未知错误
        throw new FileProxyException(
            FileProxyErrorType.STORAGE_ERROR,
            "Unknown error occurred during file proxy access",
            500,
            error,
        );
    }
}

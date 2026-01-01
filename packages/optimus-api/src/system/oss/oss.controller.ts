import {
    Controller,
    Get,
    Post,
    UploadedFile,
    UseInterceptors,
    Query,
    HttpCode,
    Body,
    Req,
    Delete,
    Param,
    Res,
    Logger,
    UseFilters,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody, ApiExtraModels } from "@nestjs/swagger";
import { Response } from "express";

import { ResultData } from "../../shared/utils/result";
import { AllowAnonymous } from "../../shared/decorators/allow-anonymous.decorator";

import { OssService } from "./oss.service";
import { FindOssDto } from "./dto/find-oss.dto";
import { UploadExtraParamsDto } from "./dto/upload-file-oss.dto";
import { FileHashCheckDto } from "./dto/large-uploadfile.dto";
import { ApiResult } from "../../shared/decorators/api-result.decorator";
import { OssEntity } from "./oss.entity";
import { StorageFactory } from "./factory/storage.factory";
import { IStorageService } from "./interfaces/storage.interface";
import { FileMetadataService } from "./file-metadata.service";
import { StorageException, StorageErrorType } from "./exceptions/storage.exception";
import { StorageConfigService } from "./storage-config.service";
import { StorageExceptionFilter } from "./filters/storage-exception.filter";
import { StorageLoggingInterceptor, StoragePerformanceInterceptor } from "./interceptors/storage-logging.interceptor";
import { RetryHandler } from "./utils/error-handler";
import { TemporaryUrlService } from "./services/temporary-url.service";
import { StoragePathUtils } from "./utils/storage-path.utils";
import { OssProxyUrlUtils } from "./utils/oss-proxy-url.utils";

@ApiTags("文件存储相关")
@ApiBearerAuth()
@Controller("files")
@ApiExtraModels(ResultData, OssEntity)
@UseFilters(StorageExceptionFilter)
@UseInterceptors(StorageLoggingInterceptor, StoragePerformanceInterceptor)
export class OssController {
    private readonly logger = new Logger(OssController.name);
    private storageService: IStorageService;

    constructor(
        private readonly ossService: OssService,
        private readonly storageFactory: StorageFactory,
        private readonly fileMetadataService: FileMetadataService,
        private readonly storageConfigService: StorageConfigService,
        private readonly temporaryUrlService: TemporaryUrlService,
    ) {
        // 使用配置服务获取存储服务
        try {
            this.storageService = this.storageConfigService.getStorageService();
            this.logger.log(`Storage service initialized with provider: ${this.storageFactory.getStorageProvider()}`);
        } catch (error) {
            this.logger.warn("Storage service not yet initialized, will retry on first request");
        }
    }

    /**
     * 确保存储服务已初始化
     * @returns 存储服务实例
     */
    private ensureStorageService(): IStorageService {
        if (!this.storageService) {
            this.storageService = this.storageConfigService.getStorageService();
            this.logger.log("Storage service initialized on demand");
        }
        return this.storageService;
    }

    /**
     * 获取服务器基础 URL（包含 API 前缀）
     * @returns 服务器基础 URL
     */
    private getServerBaseUrl(): string {
        // 从环境变量获取文件域名
        const fileDomain = process.env.SITE_DOMAIN;
        let baseUrl: string;

        if (fileDomain) {
            baseUrl = fileDomain;
        } else {
            // 如果没有配置 SITE_DOMAIN，尝试从其他环境变量构建
            const port = process.env.APP_PORT || 8084;
            const host = process.env.APP_HOST || "localhost";
            const protocol = process.env.APP_PROTOCOL || "http";
            baseUrl = `${protocol}://${host}:${port}`;
        }

        // 确保包含 API 前缀
        return `${baseUrl}/api`;
    }

    /**
     * 生成代理访问 URL
     * @param fileKeyOrUrl 文件键名或包含代理前缀的URL
     * @returns 代理访问 URL（相对路径格式）
     */
    private generateProxyUrl(fileKeyOrUrl: string): string {
        const provider = this.storageFactory.getStorageProvider();

        return OssProxyUrlUtils.generateProxyUrl(fileKeyOrUrl, {
            provider,
            logger: this.logger,
        });
    }

    @Post("upload")
    @ApiOperation({ summary: "文件上传,返回 url 地址" })
    @ApiConsumes("multipart/form-data")
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                file: {
                    description: "文件",
                    type: "string",
                    format: "binary",
                },
                business: {
                    description: "上传文件描述，可以是纯字符串，也可以是JSON字符串",
                    type: "string",
                    format: "text",
                },
                needThumbnail: {
                    description: "是不否需要缩略图",
                    type: "boolean",
                    format: "boolean",
                    default: false,
                },
                width: {
                    description: "缩略图宽",
                    type: "number",
                    format: "number",
                },
                height: {
                    description: "缩略图高",
                    type: "number",
                    format: "number",
                },
                quality: {
                    description: "缩略图质量",
                    type: "number",
                    format: "number",
                },
            },
        },
    })
    @HttpCode(200)
    @UseInterceptors(FileInterceptor("file"))
    @ApiResult(OssEntity)
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Body() params: UploadExtraParamsDto,
        @Req() req,
    ): Promise<ResultData> {
        try {
            this.logger.log(`Uploading file: ${file.originalname}, size: ${file.size}`);

            // 确保存储服务已初始化
            const storageService = this.ensureStorageService();

            // 使用新的存储服务上传文件
            const uploadOptions = {
                business: params.business,
                generateThumbnail: params.needThumbnail,
                thumbnailOptions: {
                    width: params.width,
                    height: params.height,
                    quality: params.quality,
                },
            };

            // 使用重试机制上传文件
            const fileResult = await RetryHandler.withRetry(
                () => storageService.uploadFile(file, uploadOptions),
                3, // 最大重试3次
                1000, // 初始延迟1秒
                true, // 使用指数退避
            );

            // 存储服务已经返回了 /OSS_FILE_PROXY/ 格式的URL，直接存储到数据库
            const fileKey = fileResult.fileKey || fileResult.fileName;

            // 创建文件元数据记录
            const fileMetadata = await this.fileMetadataService.createFileRecord(
                {
                    fileName: fileResult.fileName,
                    originalName: file.originalname,
                    url: fileResult.url, // 直接使用存储服务返回的 /OSS_FILE_PROXY/ 格式URL
                    thumbnailUrl: fileResult.thumbnailUrl, // 直接使用存储服务返回的缩略图URL
                    size: fileResult.size,
                    mimeType: fileResult.mimeType,
                    fileKey: fileKey,
                },
                {
                    id: req.user?.id || "",
                    account: req.user?.account || "",
                },
                this.storageFactory.getStorageProvider() as any,
                params.business,
            );

            this.logger.log(`File uploaded successfully: ${fileResult.fileName}`);
            return ResultData.ok([fileMetadata]);
        } catch (error) {
            this.logger.error("File upload failed", error);

            // 异常会被 StorageExceptionFilter 统一处理
            throw error;
        }
    }

    @Get("list")
    @ApiOperation({ summary: "查询文件上传列表" })
    @ApiResult(OssEntity, true, true)
    async findList(@Query() search: FindOssDto, @Req() req: any): Promise<ResultData> {
        const result = await this.ossService.findList(search);
        // 直接返回数据库中的 /OSS_FILE_PROXY/ 格式 URL
        return ResultData.ok(result.data, result.msg);
    }

    // @Deprecated - 已废弃：该路由不接受 provider 参数，无法确定存储提供商
    // 请使用 FileProxyController 的 /api/proxy/file/{fileKey}?provider={provider} 路由
    // 或使用临时URL访问文件

    @Get("secure/:fileKey")
    @ApiOperation({ summary: "安全文件访问（需要身份验证）" })
    async getSecureFile(
        @Param("fileKey") fileKey: string,
        @Query("download") download: string,
        @Query("inline") inline: string,
        @Req() req: any,
        @Res() res: Response,
    ): Promise<void> {
        try {
            this.logger.log(`Secure access to file: ${fileKey} by user: ${req.user?.account || "unknown"}`);

            // 确保存储服务已初始化
            this.ensureStorageService();

            // 可以在这里添加额外的权限检查
            // 例如：检查用户是否有权限访问特定文件
            const hasPermission = await this.checkFilePermission(fileKey, req.user);
            if (!hasPermission) {
                this.logger.warn(`Access denied for user ${req.user?.account} to file: ${fileKey}`);
                res.status(403).json({ message: "Access denied", code: 403 });
                return;
            }

            // 使用私有方法访问文件
            await this.serveFilePrivately(fileKey, download, inline, res);
        } catch (error) {
            this.logger.error("Secure file access failed", error);

            if (!res.headersSent) {
                if (error instanceof StorageException && error.type === StorageErrorType.FILE_NOT_FOUND) {
                    res.status(404).json({ message: "File not found", code: 404 });
                } else {
                    res.status(500).json({ message: "File access failed", code: 500 });
                }
            }
        }
    }

    /**
     * 私有方法：通过后端安全地提供文件访问
     * @param fileKey 文件键名
     * @param download 是否下载
     * @param inline 是否内联显示
     * @param res 响应对象
     */
    private async serveFilePrivately(fileKey: string, download: string, inline: string, res: Response): Promise<void> {
        this.logger.log(`Serving file privately: ${fileKey}`);

        // 确保存储服务已初始化
        const storageService = this.ensureStorageService();

        // 1. 验证文件键名格式（防止路径遍历攻击）
        if (!this.isValidFileKey(fileKey)) {
            this.logger.warn(`Invalid file key format: ${fileKey}`);
            res.status(400).json({ message: "Invalid file key format", code: 400 });
            return;
        }

        // 2. 检查文件是否存在
        const fileExists = await storageService.fileExists(fileKey);
        if (!fileExists) {
            this.logger.warn(`File not found: ${fileKey}`);
            res.status(404).json({ message: "File not found", code: 404 });
            return;
        }

        // 3. 获取文件信息
        let fileInfo;
        try {
            fileInfo = await storageService.getFileInfo(fileKey);
            this.logger.debug(`File info retrieved: ${fileKey}, size: ${fileInfo.size}, type: ${fileInfo.mimeType}`);
        } catch (error) {
            this.logger.warn(`Could not get file info for ${fileKey}:`, error.message);
            // 如果是文件不存在错误，直接返回404
            if (error instanceof StorageException && error.type === StorageErrorType.FILE_NOT_FOUND) {
                if (!res.headersSent) {
                    res.status(404).json({ message: "File not found", code: 404 });
                }
                return;
            }
            // 其他错误继续处理，即使没有文件信息
        }

        // 4. 设置安全响应头
        this.setSecurityHeaders(res);

        // 5. 设置内容类型和缓存头
        if (fileInfo) {
            res.setHeader("Content-Type", fileInfo.mimeType || "application/octet-stream");
            if (fileInfo.size) {
                res.setHeader("Content-Length", fileInfo.size.toString());
            }

            // 设置缓存头（根据文件类型）
            if (this.isCacheableFile(fileInfo.mimeType)) {
                res.setHeader("Cache-Control", "public, max-age=31536000"); // 1年缓存
                res.setHeader("ETag", `"${fileKey}-${fileInfo.size}"`);
            } else {
                res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
            }
        }

        // 6. 设置内容处置头
        const fileName = this.extractFileName(fileKey, fileInfo);
        if (download === "true") {
            res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
        } else if (inline === "true" || this.isInlineDisplayable(fileInfo?.mimeType)) {
            res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(fileName)}"`);
        }

        // 7. 获取并传输文件流
        try {
            const fileStream = await storageService.downloadFile(fileKey);

            // 处理流错误
            fileStream.on("error", (streamError) => {
                this.logger.error("File stream error:", streamError);
                if (!res.headersSent && !res.destroyed) {
                    try {
                        res.status(500).json({ message: "File stream error", code: 500 });
                    } catch (err) {
                        this.logger.error("Failed to send stream error response:", err);
                    }
                }
            });

            // 处理客户端断开连接
            res.on("close", () => {
                this.logger.debug(`Client disconnected while serving file: ${fileKey}`);
                if (fileStream && typeof fileStream.destroy === "function") {
                    fileStream.destroy();
                }
            });

            // 处理响应完成
            res.on("finish", () => {
                this.logger.log(`File served successfully: ${fileKey}`);
            });

            // 将文件流传输到响应
            fileStream.pipe(res);
        } catch (streamError) {
            this.logger.error("Failed to get file stream:", streamError);
            if (!res.headersSent && !res.destroyed) {
                try {
                    if (
                        streamError instanceof StorageException &&
                        streamError.type === StorageErrorType.FILE_NOT_FOUND
                    ) {
                        res.status(404).json({ message: "File not found", code: 404 });
                    } else {
                        res.status(500).json({ message: "Failed to retrieve file", code: 500 });
                    }
                } catch (err) {
                    this.logger.error("Failed to send error response:", err);
                }
            }
        }
    }

    /**
     * 验证文件键名格式（防止路径遍历攻击）
     * @param fileKey 文件键名
     * @returns 是否有效
     */
    private isValidFileKey(fileKey: string): boolean {
        // 检查是否包含危险字符
        const dangerousPatterns = [
            "../", // 路径遍历
            "..\\", // Windows路径遍历
            "//", // 双斜杠
            "\\\\", // 双反斜杠
            "\0", // 空字节
            "\r", // 回车符
            "\n", // 换行符
        ];

        for (const pattern of dangerousPatterns) {
            if (fileKey.includes(pattern)) {
                return false;
            }
        }

        // 检查文件键名长度
        if (fileKey.length > 1024) {
            return false;
        }

        // 检查是否为空或只包含空白字符
        if (!fileKey.trim()) {
            return false;
        }

        return true;
    }

    /**
     * 设置安全响应头
     * @param res 响应对象
     */
    private setSecurityHeaders(res: Response): void {
        // 防止点击劫持
        res.setHeader("X-Frame-Options", "SAMEORIGIN");

        // 防止MIME类型嗅探
        res.setHeader("X-Content-Type-Options", "nosniff");

        // XSS保护
        res.setHeader("X-XSS-Protection", "1; mode=block");

        // 引用者策略
        res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    }

    /**
     * 判断文件是否可缓存
     * @param mimeType MIME类型
     * @returns 是否可缓存
     */
    private isCacheableFile(mimeType?: string): boolean {
        if (!mimeType) return false;

        const cacheableTypes = [
            "image/",
            "video/",
            "audio/",
            "application/pdf",
            "text/css",
            "text/javascript",
            "application/javascript",
        ];

        return cacheableTypes.some((type) => mimeType.startsWith(type));
    }

    /**
     * 判断文件是否可内联显示
     * @param mimeType MIME类型
     * @returns 是否可内联显示
     */
    private isInlineDisplayable(mimeType?: string): boolean {
        if (!mimeType) return false;

        const inlineTypes = ["image/", "text/", "application/pdf", "video/", "audio/"];

        return inlineTypes.some((type) => mimeType.startsWith(type));
    }

    /**
     * 提取文件名
     * @param fileKey 文件键名
     * @param fileInfo 文件信息
     * @returns 文件名
     */
    private extractFileName(fileKey: string, fileInfo?: any): string {
        // 优先使用原始文件名
        if (fileInfo?.tags?.["original-name"]) {
            try {
                return decodeURIComponent(fileInfo.tags["original-name"]);
            } catch {
                // 解码失败，继续使用其他方法
            }
        }

        // 从文件键名中提取文件名
        const parts = fileKey.split("/");
        return parts[parts.length - 1] || fileKey;
    }

    @Delete(":id")
    @ApiOperation({ summary: "删除文件" })
    @ApiResult()
    async deleteFile(@Param("id") id: number): Promise<ResultData> {
        try {
            this.logger.log(`Deleting file with id: ${id}`);

            // 确保存储服务已初始化
            const storageService = this.ensureStorageService();

            // 获取文件元数据
            const fileRecord = await this.fileMetadataService.getFileRecord(id);
            if (!fileRecord) {
                return ResultData.fail(404, "文件不存在");
            }

            // 使用存储服务删除文件
            await storageService.deleteFile(fileRecord.fileKey);

            // 删除缩略图（如果存在）
            if (fileRecord.thumbnail_url) {
                try {
                    // 从缩略图URL中提取文件键名
                    const thumbnailKey = this.extractFileKeyFromUrl(fileRecord.thumbnail_url);
                    if (thumbnailKey) {
                        await storageService.deleteFile(thumbnailKey);
                    }
                } catch (error) {
                    this.logger.warn(`Failed to delete thumbnail: ${error.message}`);
                }
            }

            // 删除数据库记录
            await this.fileMetadataService.deleteFileRecord(id);

            this.logger.log(`File deleted successfully: ${fileRecord.ossKey}`);
            return ResultData.ok({ message: "文件删除成功" });
        } catch (error) {
            this.logger.error("File deletion failed", error);

            // 异常会被 StorageExceptionFilter 统一处理
            throw error;
        }
    }

    @Get("health")
    @ApiOperation({ summary: "存储服务健康检查" })
    @AllowAnonymous()
    @ApiResult()
    async healthCheck(): Promise<ResultData> {
        try {
            const healthStatus = await this.storageConfigService.healthCheck();

            if (healthStatus.healthy) {
                return ResultData.ok(healthStatus);
            } else {
                return ResultData.fail(503, "存储服务不健康", healthStatus);
            }
        } catch (error) {
            this.logger.error("Health check failed", error);
            return ResultData.fail(503, "健康检查失败");
        }
    }

    @Get("env-check")
    @ApiOperation({ summary: "检查环境变量配置（调试用）" })
    @AllowAnonymous()
    @ApiResult()
    async checkEnvironmentVariable(): Promise<ResultData> {
        const envVarName = "REACT_APP_FILE_API_PREFIX";
        const envValue = process.env[envVarName];
        const nodeEnv = process.env.NODE_ENV;

        // 检查所有相关的环境变量
        const allRelatedEnvVars = Object.keys(process.env)
            .filter((k) => k.includes("FILE_API") || k.includes("PROXY") || k.includes("REACT_APP"))
            .reduce((acc, key) => {
                acc[key] = process.env[key];
                return acc;
            }, {} as Record<string, string>);

        const envStatus = OssProxyUrlUtils.checkEnvironmentVariable();
        const currentProxyPath = OssProxyUrlUtils.getApiProxyPath();

        return ResultData.ok({
            nodeEnv,
            envVarName,
            envValue: envValue || "(未设置)",
            envValueType: typeof envValue,
            allRelatedEnvVars,
            toolClassStatus: envStatus,
            currentProxyPath,
            note: "如果 envValue 为未设置，说明环境变量没有被正确加载",
        });
    }

    @Get("status")
    @ApiOperation({ summary: "获取存储服务状态" })
    @ApiResult()
    async getStorageStatus(): Promise<ResultData> {
        try {
            const stats = this.storageConfigService.getStorageStats();
            const healthStatus = this.storageConfigService.getHealthStatus();

            return ResultData.ok({
                ...stats,
                health: healthStatus,
            });
        } catch (error) {
            this.logger.error("Failed to get storage status", error);
            return ResultData.fail(500, "获取存储状态失败");
        }
    }

    @Post("test-connection")
    @ApiOperation({ summary: "测试存储连接" })
    @ApiResult()
    async testConnection(): Promise<ResultData> {
        try {
            const result = await this.storageConfigService.testConnection();

            if (result.success) {
                return ResultData.ok(result);
            } else {
                return ResultData.fail(500, result.message, result);
            }
        } catch (error) {
            this.logger.error("Connection test failed", error);
            return ResultData.fail(500, "连接测试失败");
        }
    }

    @Get("performance")
    @ApiOperation({ summary: "获取存储性能统计" })
    @ApiResult()
    async getPerformanceStats(): Promise<ResultData> {
        try {
            const stats = {
                message: "性能统计功能需要通过监控系统查看",
                note: "详细的性能指标已记录在日志中",
                storageProvider: this.storageFactory.getStorageProvider(),
                healthStatus: this.storageConfigService.getHealthStatus(),
            };

            return ResultData.ok(stats);
        } catch (error) {
            this.logger.error("Failed to get performance stats", error);
            return ResultData.fail(500, "获取性能统计失败");
        }
    }

    @Get("checkFileExisting")
    @HttpCode(200)
    @ApiOperation({
        summary: "校验是否有分片文件存在，主要用于断点续传",
        description: " 2(文件已上传过) 1(断点续传) 0(从未上传) 3(请直接触发merge操作)",
    })
    @AllowAnonymous()
    @ApiResult()
    checkFileExisting(@Query() file: FileHashCheckDto): ResultData {
        return this.ossService.checkFileExisting(file);
    }

    /**
     * 检查用户是否有权限访问文件
     * @param fileKey 文件键名
     * @param user 用户信息
     * @returns 是否有权限
     */
    private async checkFilePermission(fileKey: string, user: any): Promise<boolean> {
        try {
            // 如果没有用户信息，拒绝访问
            if (!user || !user.id) {
                return false;
            }

            // 查询文件记录
            const fileRecord = await this.fileMetadataService.getFileRecordByKey(fileKey);
            if (!fileRecord) {
                // 文件记录不存在，但文件可能存在，根据业务需求决定是否允许访问
                this.logger.warn(`No file record found for key: ${fileKey}`);
                return true; // 或者返回 false，根据安全策略决定
            }

            // 检查文件所有者
            if (fileRecord.userId === user.id) {
                return true;
            }

            // 检查管理员权限
            if (user.roles && user.roles.some((role: any) => role.name === "admin")) {
                return true;
            }

            // 检查业务权限（根据文件的 business 字段）
            if (fileRecord.business) {
                // 这里可以根据业务逻辑添加更复杂的权限检查
                // 例如：检查用户是否属于特定的项目或部门
            }

            // 默认拒绝访问
            return false;
        } catch (error) {
            this.logger.error("Permission check failed:", error);
            return false; // 出错时拒绝访问
        }
    }

    /**
     * @deprecated 已废弃 - 不再使用永久URL，请使用临时URL
     * 生成完整的文件访问 URL（使用代理访问）
     * @param fileKey 文件键名
     * @returns 完整的文件 URL
     */
    private async generateCompleteFileUrl(fileKey: string): Promise<string> {
        this.logger.warn("generateCompleteFileUrl is deprecated, use temporary URL instead");

        // 返回临时URL作为降级方案
        const temporaryUrlResponse = await this.temporaryUrlService.generateTemporaryUrl(fileKey, {
            expiresIn: 3600, // 1小时
        });
        return temporaryUrlResponse.temporaryUrl;
    }

    /**
     * @deprecated 已废弃 - 不再使用永久URL，请使用临时URL
     * 生成完整的缩略图 URL（使用代理访问）
     * @param fileKey 原始文件键名
     * @returns 完整的缩略图 URL
     */
    private async generateCompleteThumbnailUrl(fileKey: string): Promise<string> {
        this.logger.warn("generateCompleteThumbnailUrl is deprecated, use temporary URL instead");

        try {
            const thumbnailKey = this.generateThumbnailKey(fileKey);
            const temporaryUrlResponse = await this.temporaryUrlService.generateTemporaryUrl(thumbnailKey, {
                expiresIn: 3600, // 1小时
            });
            return temporaryUrlResponse.temporaryUrl;
        } catch (error) {
            this.logger.error(`Failed to generate temporary thumbnail URL: ${error.message}`);
            throw error;
        }
    }

    /**
     * 生成缩略图键名
     * @param originalFileKey 原始文件键名
     * @returns 缩略图键名
     */
    private generateThumbnailKey(originalFileKey: string): string {
        return StoragePathUtils.generateThumbnailPath(originalFileKey);
    }

    /**
     * 从URL中提取文件键名
     * @param url 文件URL
     * @returns 文件键名
     */
    private extractFileKeyFromUrl(url: string): string | null {
        return OssProxyUrlUtils.extractFileKeyFromUrl(url, this.logger);
    }
}

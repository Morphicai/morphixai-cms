import { Injectable } from "@nestjs/common";
import OSS from "ali-oss";
import { v4 as uuidv4 } from "uuid";
import mime from "mime-types";
import * as Jimp from "jimp";
import { Readable } from "stream";
import {
    IStorageService,
    UploadOptions,
    FileResult,
    FileInfo,
    TemporaryUrlOptions,
} from "./interfaces/storage.interface";
import { AliyunOssConfig } from "./interfaces/config.interface";
import {
    StorageException,
    StorageErrorType,
    ConfigurationException,
    UploadException,
    DownloadException,
    DeleteException,
    ConnectionException,
    FileNotFoundException,
} from "./exceptions/storage.exception";
import { UrlSigningUtils } from "./utils/url-signing.utils";
import { StoragePathUtils, AccessType } from "./utils/storage-path.utils";
import { OssProxyUrlUtils } from "./utils/oss-proxy-url.utils";

@Injectable()
export class AliyunOssService implements IStorageService {
    private ossClient: OSS;
    private config: AliyunOssConfig;

    constructor(config: AliyunOssConfig, skipInitialization = false) {
        this.validateConfig(config);
        this.config = config;
        this.initializeClient();

        if (!skipInitialization) {
            // Initialize buckets asynchronously to avoid blocking constructor
            this.initializeBuckets().catch((error) => {
                console.error("Failed to initialize Aliyun OSS buckets:", error.message);
            });
        }
    }

    /**
     * 验证配置参数
     */
    private validateConfig(config: AliyunOssConfig): void {
        const requiredFields = ["region", "accessKeyId", "accessKeySecret", "bucket", "thumbnailBucket"];

        for (const field of requiredFields) {
            if (!config[field]) {
                throw new ConfigurationException(`Missing required configuration field: ${field}`);
            }
        }
    }

    /**
     * 初始化阿里云 OSS 客户端
     */
    private initializeClient(): void {
        try {
            const clientConfig: OSS.Options = {
                region: this.config.region,
                accessKeyId: this.config.accessKeyId,
                accessKeySecret: this.config.accessKeySecret,
                bucket: this.config.bucket,
            };

            // 如果配置了自定义端点，使用自定义端点
            if (this.config.endpoint) {
                clientConfig.endpoint = this.config.endpoint;
            }

            this.ossClient = new OSS(clientConfig);
        } catch (error) {
            throw new ConfigurationException(`Failed to initialize Aliyun OSS client: ${error.message}`, error);
        }
    }

    /**
     * 手动初始化存储桶（用于生产环境）
     */
    async initialize(): Promise<void> {
        return this.initializeBuckets();
    }

    /**
     * 初始化存储桶
     */
    private async initializeBuckets(): Promise<void> {
        try {
            // 检查主存储桶是否存在
            await this.ensureBucketExists(this.config.bucket);

            // 检查缩略图存储桶是否存在
            await this.ensureBucketExists(this.config.thumbnailBucket);

            console.log("Aliyun OSS buckets initialized successfully");
        } catch (error) {
            throw new ConnectionException(`Failed to initialize Aliyun OSS buckets: ${error.message}`, error);
        }
    }

    /**
     * 确保存储桶存在
     */
    private async ensureBucketExists(bucketName: string): Promise<void> {
        try {
            // 尝试获取存储桶信息来检查是否存在
            await this.ossClient.getBucketInfo(bucketName);
        } catch (error) {
            if (error.code === "NoSuchBucket") {
                // 存储桶不存在，但阿里云 OSS 通常需要通过控制台创建
                // 这里只记录警告，不自动创建
                console.warn(`Bucket ${bucketName} does not exist. Please create it in Aliyun OSS console.`);
            } else {
                throw new ConnectionException(`Failed to check bucket ${bucketName}: ${error.message}`, error);
            }
        }
    }

    /**
     * 上传文件
     * @param file 文件对象
     * @param options 上传选项
     * @returns 文件上传结果
     */
    async uploadFile(file: Express.Multer.File, options?: UploadOptions): Promise<FileResult> {
        try {
            // 生成唯一文件名
            const fileExtension = mime.extension(file.mimetype) || "bin";
            const fileName = `${uuidv4().replace(/-/g, "")}.${fileExtension}`;

            // 使用新的路径结构生成文件路径
            const fileKey = StoragePathUtils.generatePath({
                environment: options?.environment || process.env.NODE_ENV || "dev",
                accessType: (options?.accessType as AccessType) || AccessType.PRIVATE,
                business: options?.business || "common",
                fileName,
                pathPrefix: options?.pathPrefix,
            });

            // 准备元数据
            const headers: Record<string, string> = {
                "Content-Type": file.mimetype,
                "x-oss-storage-class": "Standard", // 明确指定为标准存储，避免归档
            };

            // 准备标签
            const tags: Record<string, string> = {
                "original-name": encodeURIComponent(file.originalname),
                "upload-date": new Date().toISOString(),
                environment: options?.environment || process.env.NODE_ENV || "dev",
                "access-type": options?.accessType || "private",
            };

            if (options?.business) {
                tags["business"] = encodeURIComponent(options.business);
            }

            // 上传文件到阿里云 OSS
            await this.ossClient.put(fileKey, file.buffer, {
                headers,
                meta: tags,
            });

            // 获取文件访问URL
            const url = await this.getFileUrl(fileKey);

            // 生成缩略图（如果需要且是图片）
            let thumbnailUrl: string | undefined;
            if (options?.generateThumbnail && this.isImageFile(file.mimetype)) {
                try {
                    thumbnailUrl = await this.generateAndUploadThumbnail(
                        file.buffer,
                        fileKey, // 传递完整路径以保持路径结构
                        options,
                    );
                } catch (error) {
                    console.warn(`Failed to generate thumbnail for ${fileName}:`, error.message);
                }
            }

            return {
                fileName: fileKey,
                originalName: file.originalname,
                url,
                thumbnailUrl,
                size: file.size,
                mimeType: file.mimetype,
                fileKey,
            };
        } catch (error) {
            throw new UploadException(`Failed to upload file ${file.originalname}: ${error.message}`, error);
        }
    }

    /**
     * 下载文件流
     * @param fileKey 文件键名
     * @returns 文件流
     */
    async downloadFile(fileKey: string): Promise<Readable> {
        try {
            // 阿里云 OSS SDK 的 getStream 方法返回的是一个包含 stream 属性的对象
            // 但有时候可能直接返回流，需要兼容处理
            const result = await this.ossClient.getStream(fileKey);

            // 检查返回结果的类型
            if (result && typeof result === "object") {
                // 如果是对象，尝试获取 stream 属性
                if (result.stream && typeof result.stream.pipe === "function") {
                    return result.stream;
                }
                // 如果对象本身就是流
                if (typeof result.pipe === "function") {
                    return result as Readable;
                }
                // 如果有 content 属性（某些版本的 SDK）
                if (result.content && typeof result.content.pipe === "function") {
                    return result.content;
                }
            }

            // 如果直接返回的是流
            if (result && typeof result.pipe === "function") {
                return result as Readable;
            }

            // 如果都不是，抛出错误
            throw new DownloadException(
                `Failed to get file stream for ${fileKey}: Invalid response structure from OSS`,
                new Error("Invalid OSS response structure"),
            );
        } catch (error) {
            if (error.code === "NoSuchKey" || error.code === "NotFound") {
                throw new FileNotFoundException(fileKey, error);
            }
            throw new DownloadException(`Failed to download file ${fileKey}: ${error.message}`, error);
        }
    }

    /**
     * 删除文件
     * @param fileKey 文件键名
     */
    async deleteFile(fileKey: string): Promise<void> {
        try {
            await this.ossClient.delete(fileKey);
        } catch (error) {
            if (error.code === "NoSuchKey" || error.code === "NotFound") {
                // 文件不存在，认为删除成功
                return;
            }
            throw new DeleteException(`Failed to delete file ${fileKey}: ${error.message}`, error);
        }
    }

    /**
     * @deprecated 已废弃 - 不再使用永久URL，请使用 generateTemporaryUrl 方法
     * 获取文件访问URL
     * @param fileKey 文件键名
     * @returns 文件访问URL
     */
    async getFileUrl(fileKey: string): Promise<string> {
        // 使用环境变量配置的前缀标识这是一个 OSS 文件
        // 前端会将此前缀替换为实际的 API 端点
        const proxyPrefix = OssProxyUrlUtils.getOssProxyPrefix();
        return `${proxyPrefix}${encodeURIComponent(fileKey)}?provider=aliyun`;
    }

    /**
     * 生成临时访问 URL
     * @param fileKey 文件键名
     * @param options 临时 URL 选项
     * @returns 临时访问 URL
     */
    async generateTemporaryUrl(fileKey: string, options?: TemporaryUrlOptions): Promise<string> {
        try {
            return await UrlSigningUtils.generateAliyunSignedUrl(this.config, {
                fileKey,
                expiresIn: options?.expiresIn,
                bucket: options?.bucket,
            });
        } catch (error) {
            throw new StorageException(
                StorageErrorType.SIGNING_ERROR,
                `Failed to generate temporary URL for ${fileKey}: ${error.message}`,
                error,
            );
        }
    }

    /**
     * 检查文件是否存在
     * @param fileKey 文件键名
     * @returns 是否存在
     */
    async fileExists(fileKey: string): Promise<boolean> {
        try {
            await this.ossClient.head(fileKey);
            return true;
        } catch (error) {
            if (error.code === "NoSuchKey" || error.code === "NotFound") {
                return false;
            }
            throw new StorageException(
                StorageErrorType.CONNECTION_ERROR,
                `Failed to check file existence ${fileKey}: ${error.message}`,
                error,
            );
        }
    }

    /**
     * 获取文件信息
     * @param fileKey 文件键名
     * @returns 文件信息
     */
    async getFileInfo(fileKey: string): Promise<FileInfo> {
        try {
            const result = await this.ossClient.head(fileKey);

            // 安全地访问响应数据
            const headers = result?.res?.headers || {};
            const meta = result?.meta || {};

            return {
                fileName: fileKey,
                size: parseInt(headers["content-length"] || "0"),
                mimeType: headers["content-type"] || "application/octet-stream",
                lastModified: headers["last-modified"] ? new Date(headers["last-modified"]) : new Date(),
                tags: this.extractMetadataTags(meta),
            };
        } catch (error) {
            if (error.code === "NoSuchKey" || error.code === "NotFound") {
                throw new FileNotFoundException(fileKey, error);
            }
            throw new StorageException(
                StorageErrorType.CONNECTION_ERROR,
                `Failed to get file info ${fileKey}: ${error.message}`,
                error,
            );
        }
    }

    /**
     * 上传缩略图
     * @param buffer 图片缓冲区
     * @param originalFilePath 原文件的完整路径
     * @returns 缩略图URL
     */
    async uploadThumbnail(buffer: Buffer, originalFilePath: string): Promise<string> {
        try {
            // 基于原文件路径生成缩略图路径
            const thumbnailKey = StoragePathUtils.generateThumbnailPath(originalFilePath);

            // 判断是否使用同一个存储桶
            const useSameBucket = this.config.bucket === this.config.thumbnailBucket;

            if (useSameBucket) {
                // 使用同一个存储桶，直接用主客户端上传
                await this.ossClient.put(thumbnailKey, buffer, {
                    headers: {
                        "Content-Type": "image/jpeg",
                        "x-oss-storage-class": "Standard", // 明确指定为标准存储，避免归档
                    },
                    meta: {
                        "generated-date": new Date().toISOString(),
                    },
                });
            } else {
                // 使用不同的存储桶
                const thumbnailClient = new OSS({
                    region: this.config.region,
                    accessKeyId: this.config.accessKeyId,
                    accessKeySecret: this.config.accessKeySecret,
                    bucket: this.config.thumbnailBucket,
                    endpoint: this.config.endpoint,
                });

                await thumbnailClient.put(thumbnailKey, buffer, {
                    headers: {
                        "Content-Type": "image/jpeg",
                        "x-oss-storage-class": "Standard", // 明确指定为标准存储，避免归档
                    },
                    meta: {
                        "generated-date": new Date().toISOString(),
                    },
                });
            }

            return await this.getThumbnailUrl(thumbnailKey);
        } catch (error) {
            throw new UploadException(`Failed to upload thumbnail ${originalFilePath}: ${error.message}`, error);
        }
    }

    /**
     * 获取缩略图访问URL
     * @param thumbnailKey 缩略图的完整路径
     * @returns 缩略图URL
     */
    private async getThumbnailUrl(thumbnailKey: string): Promise<string> {
        // 使用环境变量配置的前缀标识这是一个 OSS 文件
        // 前端会将此前缀替换为实际的 API 端点
        const useSameBucket = this.config.bucket === this.config.thumbnailBucket;
        const bucketParam = useSameBucket ? "" : "&bucket=thumbnail";
        const proxyPrefix = OssProxyUrlUtils.getOssProxyPrefix();
        return `${proxyPrefix}${encodeURIComponent(thumbnailKey)}?provider=aliyun${bucketParam}`;
    }

    /**
     * 生成并上传缩略图
     * @param imageBuffer 原始图片缓冲区
     * @param originalFilePath 原文件的完整路径
     * @param uploadOptions 上传选项（包含缩略图配置）
     * @returns 缩略图URL
     */
    private async generateAndUploadThumbnail(
        imageBuffer: Buffer,
        originalFilePath: string,
        uploadOptions?: UploadOptions,
    ): Promise<string> {
        try {
            const thumbnailOptions = uploadOptions?.thumbnailOptions || {};
            const { width = 200, height = 200, quality = 80 } = thumbnailOptions;

            // 使用 Jimp 生成缩略图
            const image = await Jimp.read(imageBuffer);
            const thumbnail = await image
                .resize(width, height, Jimp.RESIZE_BEZIER)
                .quality(quality)
                .getBufferAsync(Jimp.MIME_JPEG);

            // 上传缩略图（传递原文件路径以保持路径结构）
            return await this.uploadThumbnail(thumbnail, originalFilePath);
        } catch (error) {
            throw new StorageException(
                StorageErrorType.UPLOAD_ERROR,
                `Failed to generate thumbnail for ${originalFilePath}: ${error.message}`,
                error,
            );
        }
    }

    /**
     * 删除缩略图
     * @param originalFilePath 原文件的完整路径
     */
    async deleteThumbnail(originalFilePath: string): Promise<void> {
        try {
            // 基于原文件路径生成缩略图路径
            const thumbnailKey = StoragePathUtils.generateThumbnailPath(originalFilePath);

            // 判断是否使用同一个存储桶
            const useSameBucket = this.config.bucket === this.config.thumbnailBucket;

            if (useSameBucket) {
                // 使用同一个存储桶
                await this.ossClient.delete(thumbnailKey);
            } else {
                // 使用不同的存储桶
                const thumbnailClient = new OSS({
                    region: this.config.region,
                    accessKeyId: this.config.accessKeyId,
                    accessKeySecret: this.config.accessKeySecret,
                    bucket: this.config.thumbnailBucket,
                    endpoint: this.config.endpoint,
                });

                await thumbnailClient.delete(thumbnailKey);
            }
        } catch (error) {
            if (error.code === "NoSuchKey" || error.code === "NotFound") {
                // 缩略图不存在，认为删除成功
                return;
            }
            throw new DeleteException(`Failed to delete thumbnail ${originalFilePath}: ${error.message}`, error);
        }
    }

    /**
     * 检查是否为图片文件
     * @param mimeType MIME类型
     * @returns 是否为图片
     */
    private isImageFile(mimeType: string): boolean {
        return (
            mimeType.startsWith("image/") &&
            ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"].includes(mimeType)
        );
    }

    /**
     * 从元数据中提取标签
     * @param metadata 元数据
     * @returns 标签对象
     */
    private extractMetadataTags(metadata: Record<string, string>): Record<string, string> {
        const tags: Record<string, string> = {};

        for (const [key, value] of Object.entries(metadata || {})) {
            try {
                tags[key] = decodeURIComponent(value);
            } catch {
                tags[key] = value;
            }
        }

        return tags;
    }

    /**
     * 获取文件流（兼容旧接口）
     * @param fileName 文件名
     * @returns 文件流
     */
    async getFileStream(fileName: string): Promise<NodeJS.ReadableStream> {
        return await this.downloadFile(fileName);
    }

    /**
     * 列出对象
     * @param options 列出选项
     * @returns 对象列表的异步迭代器
     */
    async *listObjects(
        options?: import("./interfaces/storage.interface").ListObjectsOptions,
    ): AsyncIterable<import("./interfaces/storage.interface").ObjectListItem> {
        try {
            const prefix = options?.prefix || "";
            const maxKeys = options?.maxKeys || 1000;
            let continuationToken: string | undefined;

            do {
                const result = await this.ossClient.list({
                    prefix,
                    "max-keys": maxKeys,
                    "continuation-token": continuationToken,
                });

                if (result.objects) {
                    for (const obj of result.objects) {
                        yield {
                            name: obj.name,
                            size: obj.size,
                            lastModified: new Date(obj.lastModified),
                            etag: obj.etag,
                        };
                    }
                }

                continuationToken = result.nextContinuationToken;
            } while (continuationToken);
        } catch (error) {
            throw new StorageException(
                StorageErrorType.CONNECTION_ERROR,
                `Failed to list objects: ${error.message}`,
                error,
            );
        }
    }

    /**
     * 上传 Buffer 数据
     * @param buffer 数据缓冲区
     * @param fileKey 文件键名
     * @param metadata 元数据
     * @returns 上传结果
     */
    async uploadBuffer(
        buffer: Buffer,
        fileKey: string,
        metadata?: Record<string, string>,
    ): Promise<{ fileKey: string }> {
        try {
            const headers: Record<string, string> = {
                "Content-Type": "application/octet-stream",
                "x-oss-storage-class": "Standard", // 明确指定为标准存储，避免归档
            };

            // 将元数据转换为 OSS 的 x-oss-meta- 格式
            if (metadata) {
                for (const [key, value] of Object.entries(metadata)) {
                    if (key.toLowerCase() === "content-type") {
                        headers["Content-Type"] = value;
                    } else if (!key.toLowerCase().startsWith("x-oss-meta-")) {
                        headers[`x-oss-meta-${key}`] = value;
                    } else {
                        headers[key] = value;
                    }
                }
            }

            await this.ossClient.put(fileKey, buffer, { headers });

            return { fileKey };
        } catch (error) {
            throw new UploadException(`Failed to upload buffer to ${fileKey}: ${error.message}`, error);
        }
    }
}

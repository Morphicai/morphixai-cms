import { Injectable } from "@nestjs/common";
import * as Minio from "minio";
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
import { MinioConfig } from "./interfaces/config.interface";
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
export class MinioService implements IStorageService {
    private minioClient: Minio.Client;
    private config: MinioConfig;

    constructor(config: MinioConfig, skipInitialization = false) {
        this.config = config;
        this.initializeClient();

        if (!skipInitialization) {
            // Initialize buckets asynchronously to avoid blocking constructor
            this.initializeBuckets().catch((error) => {
                console.error("Failed to initialize MinIO buckets:", error.message);
            });
        }
    }

    /**
     * 初始化 MinIO 客户端
     */
    private initializeClient(): void {
        try {
            this.minioClient = new Minio.Client({
                endPoint: this.config.endPoint,
                port: this.config.port,
                useSSL: this.config.useSSL,
                accessKey: this.config.accessKey,
                secretKey: this.config.secretKey,
            });
        } catch (error) {
            throw new ConfigurationException(`Failed to initialize MinIO client: ${error.message}`, error);
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
            // 检查并创建主存储桶
            await this.ensureBucketExists(this.config.bucketName);

            // 检查并创建缩略图存储桶
            await this.ensureBucketExists(this.config.thumbnailBucket);

            // 设置公共读取策略
            await this.setBucketPublicReadPolicy(this.config.bucketName);
            await this.setBucketPublicReadPolicy(this.config.thumbnailBucket);

            console.log("MinIO buckets initialized successfully");
        } catch (error) {
            throw new ConnectionException(`Failed to initialize MinIO buckets: ${error.message}`, error);
        }
    }

    /**
     * 确保存储桶存在
     */
    private async ensureBucketExists(bucketName: string): Promise<void> {
        try {
            const bucketExists = await this.minioClient.bucketExists(bucketName);
            if (!bucketExists) {
                await this.minioClient.makeBucket(bucketName, this.config.region);
                console.log(`Bucket ${bucketName} created successfully`);
            }
        } catch (error) {
            throw new ConnectionException(`Failed to create bucket ${bucketName}: ${error.message}`, error);
        }
    }

    /**
     * 设置存储桶公共读取策略
     */
    private async setBucketPublicReadPolicy(bucketName: string): Promise<void> {
        try {
            const policy = {
                Version: "2012-10-17",
                Statement: [
                    {
                        Effect: "Allow",
                        Principal: { AWS: ["*"] },
                        Action: ["s3:GetObject"],
                        Resource: [`arn:aws:s3:::${bucketName}/*`],
                    },
                ],
            };

            await this.minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
        } catch (error) {
            // 策略设置失败不应该阻止服务启动，只记录警告
            console.warn(`Failed to set public read policy for bucket ${bucketName}:`, error.message);
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
            const metadata = {
                "Content-Type": file.mimetype,
                "X-Amz-Meta-Original-Name": encodeURIComponent(file.originalname),
                "X-Amz-Meta-Upload-Date": new Date().toISOString(),
                "X-Amz-Meta-Environment": options?.environment || process.env.NODE_ENV || "dev",
                "X-Amz-Meta-Access-Type": options?.accessType || "private",
            };

            if (options?.business) {
                // 对 business 参数进行 URL 编码，以支持中文和特殊字符
                metadata["X-Amz-Meta-Business"] = encodeURIComponent(options.business);
            }

            // 上传文件
            await this.minioClient.putObject(this.config.bucketName, fileKey, file.buffer, file.size, metadata);

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
            const stream = await this.minioClient.getObject(this.config.bucketName, fileKey);
            return stream;
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
            await this.minioClient.removeObject(this.config.bucketName, fileKey);
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
        return `${proxyPrefix}${encodeURIComponent(fileKey)}?provider=minio`;
    }

    /**
     * 生成临时访问 URL
     * @param fileKey 文件键名
     * @param options 临时 URL 选项
     * @returns 临时访问 URL
     */
    async generateTemporaryUrl(fileKey: string, options?: TemporaryUrlOptions): Promise<string> {
        try {
            return await UrlSigningUtils.generateMinioSignedUrl(this.config, {
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
            await this.minioClient.statObject(this.config.bucketName, fileKey);
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
            const stat = await this.minioClient.statObject(this.config.bucketName, fileKey);

            return {
                fileName: fileKey,
                size: stat.size,
                mimeType: stat.metaData["content-type"] || "application/octet-stream",
                lastModified: stat.lastModified,
                tags: this.extractMetadataTags(stat.metaData),
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

            await this.minioClient.putObject(this.config.thumbnailBucket, thumbnailKey, buffer, buffer.length, {
                "Content-Type": "image/jpeg",
                "X-Amz-Meta-Generated-Date": new Date().toISOString(),
            });

            return await this.getThumbnailUrl(thumbnailKey);
        } catch (error) {
            throw new UploadException(`Failed to upload thumbnail ${originalFilePath}: ${error.message}`, error);
        }
    }

    /**
     * 获取缩略图访问URL
     * @param fileName 文件名
     * @returns 缩略图URL
     */
    private async getThumbnailUrl(fileName: string): Promise<string> {
        // 使用环境变量配置的前缀标识这是一个 OSS 文件
        // 前端会将此前缀替换为实际的 API 端点
        const proxyPrefix = OssProxyUrlUtils.getOssProxyPrefix();
        return `${proxyPrefix}${encodeURIComponent(fileName)}?provider=minio&bucket=thumbnail`;
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
            await this.minioClient.removeObject(this.config.thumbnailBucket, thumbnailKey);
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

        for (const [key, value] of Object.entries(metadata)) {
            if (key.startsWith("x-amz-meta-")) {
                const tagKey = key.replace("x-amz-meta-", "");
                tags[tagKey] = decodeURIComponent(value);
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
            const recursive = options?.recursive !== false; // 默认递归

            const stream = this.minioClient.listObjectsV2(this.config.bucketName, prefix, recursive);

            for await (const obj of stream) {
                yield {
                    name: obj.name,
                    size: obj.size,
                    lastModified: obj.lastModified,
                    etag: obj.etag,
                };
            }
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
            const uploadMetadata = {
                "Content-Type": "application/octet-stream",
                ...metadata,
            };

            await this.minioClient.putObject(this.config.bucketName, fileKey, buffer, buffer.length, uploadMetadata);

            return { fileKey };
        } catch (error) {
            throw new UploadException(`Failed to upload buffer to ${fileKey}: ${error.message}`, error);
        }
    }
}

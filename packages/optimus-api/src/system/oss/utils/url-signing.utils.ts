import OSS from "ali-oss";
import * as Minio from "minio";
import { AliyunOssConfig, MinioConfig } from "../interfaces/config.interface";
import { StorageException, StorageErrorType, ConfigurationException } from "../exceptions/storage.exception";

/**
 * 阿里云 OSS 签名选项
 */
export interface AliyunSignOptions {
    /** 文件键名 */
    fileKey: string;
    /** 过期时间（秒），默认 3600 秒（1小时） */
    expiresIn?: number;
    /** 存储桶名称，可选，默认使用配置中的存储桶 */
    bucket?: string;
}

/**
 * MinIO 签名选项
 */
export interface MinioSignOptions {
    /** 文件键名 */
    fileKey: string;
    /** 过期时间（秒），默认 3600 秒（1小时） */
    expiresIn?: number;
    /** 存储桶名称，可选，默认使用配置中的存储桶 */
    bucket?: string;
}

/**
 * URL 签名工具类
 * 提供阿里云 OSS 和 MinIO 的临时 URL 生成功能
 */
export class UrlSigningUtils {
    /** 默认过期时间：1小时（3600秒） */
    private static readonly DEFAULT_EXPIRES_IN = 3600;

    /**
     * 生成阿里云 OSS 签名 URL
     * @param config 阿里云 OSS 配置
     * @param options 签名选项
     * @returns 签名 URL
     */
    static async generateAliyunSignedUrl(config: AliyunOssConfig, options: AliyunSignOptions): Promise<string> {
        try {
            // 验证配置
            this.validateAliyunConfig(config);

            // 验证文件键名
            this.validateFileKey(options.fileKey);

            // 创建 OSS 客户端
            const ossClient = new OSS({
                region: config.region,
                accessKeyId: config.accessKeyId,
                accessKeySecret: config.accessKeySecret,
                bucket: options.bucket || config.bucket,
                endpoint: config.endpoint,
            });

            // 设置过期时间（阿里云 OSS 需要秒级时间戳）
            const expiresIn = options.expiresIn || this.DEFAULT_EXPIRES_IN;
            const expiresTimestamp = Math.floor(Date.now() / 1000) + expiresIn;

            // 生成签名 URL
            const signedUrl = await ossClient.signatureUrl(options.fileKey, {
                expires: expiresTimestamp,
                method: "GET",
            });

            return signedUrl;
        } catch (error) {
            // 如果是配置异常，直接抛出
            if (error instanceof ConfigurationException) {
                throw error;
            }

            throw new StorageException(
                StorageErrorType.SIGNING_ERROR,
                `Failed to generate Aliyun OSS signed URL for ${options.fileKey}: ${error.message}`,
                error,
            );
        }
    }

    /**
     * 生成 MinIO 预签名 URL
     * @param config MinIO 配置
     * @param options 签名选项
     * @returns 预签名 URL
     */
    static async generateMinioSignedUrl(config: MinioConfig, options: MinioSignOptions): Promise<string> {
        try {
            // 验证配置
            this.validateMinioConfig(config);

            // 验证文件键名
            this.validateFileKey(options.fileKey);

            // 创建 MinIO 客户端
            const minioClient = new Minio.Client({
                endPoint: config.endPoint,
                port: config.port,
                useSSL: config.useSSL,
                accessKey: config.accessKey,
                secretKey: config.secretKey,
            });

            // 设置过期时间
            const expiresIn = options.expiresIn || this.DEFAULT_EXPIRES_IN;
            const bucketName = options.bucket || config.bucketName;

            // 生成预签名 URL
            const signedUrl = await minioClient.presignedGetObject(bucketName, options.fileKey, expiresIn);

            return signedUrl;
        } catch (error) {
            // 如果是配置异常，直接抛出
            if (error instanceof ConfigurationException) {
                throw error;
            }

            throw new StorageException(
                StorageErrorType.SIGNING_ERROR,
                `Failed to generate MinIO signed URL for ${options.fileKey}: ${error.message}`,
                error,
            );
        }
    }

    /**
     * 获取默认过期时间（秒）
     * @returns 默认过期时间
     */
    static getDefaultExpiresIn(): number {
        return this.DEFAULT_EXPIRES_IN;
    }

    /**
     * 验证阿里云 OSS 配置
     * @param config 阿里云 OSS 配置
     */
    private static validateAliyunConfig(config: AliyunOssConfig): void {
        const requiredFields = ["region", "accessKeyId", "accessKeySecret", "bucket"];

        for (const field of requiredFields) {
            if (!config[field]) {
                throw new ConfigurationException(`Missing required Aliyun OSS configuration field: ${field}`);
            }
        }
    }

    /**
     * 验证 MinIO 配置
     * @param config MinIO 配置
     */
    private static validateMinioConfig(config: MinioConfig): void {
        const requiredFields = ["endPoint", "accessKey", "secretKey", "bucketName"];

        for (const field of requiredFields) {
            if (!config[field]) {
                throw new ConfigurationException(`Missing required MinIO configuration field: ${field}`);
            }
        }

        // 验证端口号
        if (typeof config.port !== "number" || config.port <= 0 || config.port > 65535) {
            throw new ConfigurationException("Invalid MinIO port number");
        }
    }

    /**
     * 验证文件键名
     * @param fileKey 文件键名
     */
    private static validateFileKey(fileKey: string): void {
        if (!fileKey || typeof fileKey !== "string") {
            throw new ConfigurationException("File key must be a non-empty string");
        }

        // 防止路径遍历攻击
        if (fileKey.includes("..") || fileKey.includes("//")) {
            throw new ConfigurationException("Invalid file key: path traversal detected");
        }

        // 检查危险字符
        const dangerousChars = /[<>:"|?*\x00-\x1f]/;
        if (dangerousChars.test(fileKey)) {
            throw new ConfigurationException("Invalid file key: contains dangerous characters");
        }
    }
}

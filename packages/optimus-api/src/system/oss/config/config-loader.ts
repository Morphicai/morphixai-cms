import { StorageConfig, MinioConfig, AliyunOssConfig, StorageProvider } from "../interfaces/config.interface";

/**
 * 配置加载器 - 从环境变量读取配置
 */
export class ConfigLoader {
    /**
     * 加载存储配置
     * @returns 存储配置对象
     */
    static loadStorageConfig(): StorageConfig {
        const provider = (process.env.STORAGE_PROVIDER as StorageProvider) || "minio";

        return {
            provider,
            minio: provider === "minio" ? this.loadMinioConfig() : undefined,
            aliyun: provider === "aliyun" ? this.loadAliyunConfig() : undefined,
        };
    }

    /**
     * 加载 MinIO 配置
     * @returns MinIO 配置对象
     */
    static loadMinioConfig(): MinioConfig {
        if (!process.env.MINIO_ACCESS_KEY) {
            throw new Error("MINIO_ACCESS_KEY environment variable is required");
        }
        if (!process.env.MINIO_SECRET_KEY) {
            throw new Error("MINIO_SECRET_KEY environment variable is required");
        }

        return {
            endPoint: process.env.MINIO_ENDPOINT || "localhost",
            port: parseInt(process.env.MINIO_PORT) || 9000,
            useSSL: process.env.MINIO_USE_SSL === "true",
            accessKey: process.env.MINIO_ACCESS_KEY,
            secretKey: process.env.MINIO_SECRET_KEY,
            bucketName: process.env.MINIO_BUCKET_NAME || "uploads",
            thumbnailBucket: process.env.MINIO_THUMBNAIL_BUCKET || "thumbnails",
            region: process.env.MINIO_REGION || "us-east-1",
        };
    }

    /**
     * 加载阿里云 OSS 配置
     * @returns 阿里云 OSS 配置对象
     */
    static loadAliyunConfig(): AliyunOssConfig {
        if (!process.env.ALIYUN_OSS_ACCESS_KEY_ID) {
            throw new Error("ALIYUN_OSS_ACCESS_KEY_ID environment variable is required");
        }
        if (!process.env.ALIYUN_OSS_ACCESS_KEY_SECRET) {
            throw new Error("ALIYUN_OSS_ACCESS_KEY_SECRET environment variable is required");
        }
        if (!process.env.ALIYUN_OSS_BUCKET) {
            throw new Error("ALIYUN_OSS_BUCKET environment variable is required");
        }
        if (!process.env.ALIYUN_OSS_THUMBNAIL_BUCKET) {
            throw new Error("ALIYUN_OSS_THUMBNAIL_BUCKET environment variable is required");
        }

        return {
            region: process.env.ALIYUN_OSS_REGION || "cn-beijing",
            accessKeyId: process.env.ALIYUN_OSS_ACCESS_KEY_ID,
            accessKeySecret: process.env.ALIYUN_OSS_ACCESS_KEY_SECRET,
            bucket: process.env.ALIYUN_OSS_BUCKET,
            thumbnailBucket: process.env.ALIYUN_OSS_THUMBNAIL_BUCKET,
            cdnDomain: process.env.ALIYUN_OSS_CDN_DOMAIN,
            endpoint: process.env.ALIYUN_OSS_ENDPOINT,
        };
    }

    /**
     * 获取当前存储提供商
     * @returns 存储提供商类型
     */
    static getStorageProvider(): StorageProvider {
        return (process.env.STORAGE_PROVIDER as StorageProvider) || "minio";
    }

    /**
     * 检查是否为开发环境
     * @returns 是否为开发环境
     */
    static isDevelopment(): boolean {
        return process.env.NODE_ENV === "development";
    }

    /**
     * 检查是否为生产环境
     * @returns 是否为生产环境
     */
    static isProduction(): boolean {
        return process.env.NODE_ENV === "production";
    }
}

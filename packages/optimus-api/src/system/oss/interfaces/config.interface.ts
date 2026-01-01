/**
 * MinIO 配置接口
 */
export interface MinioConfig {
    /** MinIO 服务端点 */
    endPoint: string;
    /** MinIO 服务端口 */
    port: number;
    /** 是否使用SSL */
    useSSL: boolean;
    /** 访问密钥 */
    accessKey: string;
    /** 秘密密钥 */
    secretKey: string;
    /** 存储桶名称 */
    bucketName: string;
    /** 缩略图存储桶名称 */
    thumbnailBucket: string;
    /** 区域 */
    region: string;
}

/**
 * 阿里云 OSS 配置接口
 */
export interface AliyunOssConfig {
    /** 区域 */
    region: string;
    /** 访问密钥ID */
    accessKeyId: string;
    /** 访问密钥Secret */
    accessKeySecret: string;
    /** 存储桶名称 */
    bucket: string;
    /** 缩略图存储桶名称 */
    thumbnailBucket: string;
    /** CDN 域名 */
    cdnDomain?: string;
    /** 自定义端点 */
    endpoint?: string;
}

/**
 * 存储提供商类型
 */
export type StorageProvider = "minio" | "aliyun" | "memory";

/**
 * 存储配置接口
 */
export interface StorageConfig {
    /** 存储提供商 */
    provider: StorageProvider;
    /** MinIO 配置 */
    minio?: MinioConfig;
    /** 阿里云 OSS 配置 */
    aliyun?: AliyunOssConfig;
}

/**
 * 配置验证结果接口
 */
export interface ValidationResult {
    /** 是否有效 */
    isValid: boolean;
    /** 错误信息列表 */
    errors: string[];
}

import { ValidationResult, MinioConfig, AliyunOssConfig, StorageConfig } from "../interfaces/config.interface";

/**
 * 配置验证器
 */
export class ConfigValidator {
    /**
     * 验证存储配置
     * @param config 存储配置
     * @returns 验证结果
     */
    static validateStorageConfig(config: StorageConfig): ValidationResult {
        const errors: string[] = [];

        if (!config.provider) {
            errors.push("Storage provider is required");
        }

        if (config.provider === "minio") {
            if (!config.minio) {
                errors.push("MinIO configuration is required when provider is minio");
            } else {
                const minioValidation = this.validateMinioConfig(config.minio);
                if (!minioValidation.isValid) {
                    errors.push(...minioValidation.errors);
                }
            }
        }

        if (config.provider === "aliyun") {
            if (!config.aliyun) {
                errors.push("Aliyun OSS configuration is required when provider is aliyun");
            } else {
                const aliyunValidation = this.validateAliyunConfig(config.aliyun);
                if (!aliyunValidation.isValid) {
                    errors.push(...aliyunValidation.errors);
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * 验证 MinIO 配置
     * @param config MinIO 配置
     * @returns 验证结果
     */
    static validateMinioConfig(config: MinioConfig): ValidationResult {
        const errors: string[] = [];

        if (!config.endPoint) {
            errors.push("MINIO_ENDPOINT is required");
        }

        if (!config.port || config.port <= 0 || config.port > 65535) {
            errors.push("MINIO_PORT must be a valid port number (1-65535)");
        }

        if (!config.accessKey) {
            errors.push("MINIO_ACCESS_KEY is required");
        }

        if (!config.secretKey) {
            errors.push("MINIO_SECRET_KEY is required");
        }

        if (!config.bucketName) {
            errors.push("MINIO_BUCKET_NAME is required");
        }

        if (!config.thumbnailBucket) {
            errors.push("MINIO_THUMBNAIL_BUCKET is required");
        }

        if (!config.region) {
            errors.push("MINIO_REGION is required");
        }

        // 验证存储桶名称格式
        if (config.bucketName && !this.isValidBucketName(config.bucketName)) {
            errors.push(
                "MINIO_BUCKET_NAME must be a valid bucket name (3-63 characters, lowercase letters, numbers, and hyphens)",
            );
        }

        if (config.thumbnailBucket && !this.isValidBucketName(config.thumbnailBucket)) {
            errors.push(
                "MINIO_THUMBNAIL_BUCKET must be a valid bucket name (3-63 characters, lowercase letters, numbers, and hyphens)",
            );
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * 验证阿里云 OSS 配置
     * @param config 阿里云 OSS 配置
     * @returns 验证结果
     */
    static validateAliyunConfig(config: AliyunOssConfig): ValidationResult {
        const errors: string[] = [];

        if (!config.region) {
            errors.push("ALIYUN_OSS_REGION is required");
        }

        if (!config.accessKeyId) {
            errors.push("ALIYUN_OSS_ACCESS_KEY_ID is required");
        }

        if (!config.accessKeySecret) {
            errors.push("ALIYUN_OSS_ACCESS_KEY_SECRET is required");
        }

        if (!config.bucket) {
            errors.push("ALIYUN_OSS_BUCKET is required");
        }

        if (!config.thumbnailBucket) {
            errors.push("ALIYUN_OSS_THUMBNAIL_BUCKET is required");
        }

        // 验证区域格式
        if (config.region && !this.isValidAliyunRegion(config.region)) {
            errors.push("ALIYUN_OSS_REGION must be a valid Aliyun region (e.g., cn-beijing)");
        }

        // 验证存储桶名称格式
        if (config.bucket && !this.isValidBucketName(config.bucket)) {
            errors.push(
                "ALIYUN_OSS_BUCKET must be a valid bucket name (3-63 characters, lowercase letters, numbers, and hyphens)",
            );
        }

        if (config.thumbnailBucket && !this.isValidBucketName(config.thumbnailBucket)) {
            errors.push(
                "ALIYUN_OSS_THUMBNAIL_BUCKET must be a valid bucket name (3-63 characters, lowercase letters, numbers, and hyphens)",
            );
        }

        // 验证 CDN 域名格式（如果提供）
        if (config.cdnDomain && !this.isValidUrl(config.cdnDomain)) {
            errors.push("ALIYUN_OSS_CDN_DOMAIN must be a valid URL");
        }

        // 验证自定义端点格式（如果提供）
        if (config.endpoint && !this.isValidUrl(config.endpoint)) {
            errors.push("ALIYUN_OSS_ENDPOINT must be a valid URL");
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * 验证存储桶名称格式
     * @param bucketName 存储桶名称
     * @returns 是否有效
     */
    private static isValidBucketName(bucketName: string): boolean {
        // 存储桶名称规则：3-63个字符，只能包含小写字母、数字和连字符
        const bucketNameRegex = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
        return bucketNameRegex.test(bucketName);
    }

    /**
     * 验证阿里云区域格式
     * @param region 区域
     * @returns 是否有效
     */
    private static isValidAliyunRegion(region: string): boolean {
        // 阿里云区域格式：oss-cn-xxx 或 oss-us-xxx 等
        const regionRegex = /^oss-(cn|us|eu|ap)-[a-z0-9-]+$/;
        return regionRegex.test(region);
    }

    /**
     * 验证URL格式
     * @param url URL字符串
     * @returns 是否有效
     */
    private static isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
}

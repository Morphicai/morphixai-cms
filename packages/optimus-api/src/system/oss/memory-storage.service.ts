import { Injectable } from "@nestjs/common";
import { Readable } from "stream";
import * as crypto from "crypto";
import {
    IStorageService,
    UploadOptions,
    FileResult,
    FileInfo,
    TemporaryUrlOptions,
} from "./interfaces/storage.interface";

export interface StoredFile {
    key: string;
    data: Buffer;
    contentType?: string;
    metadata?: Record<string, string>;
    size: number;
    etag: string;
    lastModified: Date;
}

export interface StorageBucket {
    name: string;
    files: Map<string, StoredFile>;
    createdAt: Date;
}

/**
 * 内存存储服务 - 用于测试环境
 * 模拟 MinIO/S3 的基本功能，无需外部依赖
 *
 * ⚠️ 警告：此服务仅用于测试环境，不应在生产环境中使用
 */
@Injectable()
export class MemoryStorageService implements IStorageService {
    private buckets: Map<string, StorageBucket> = new Map();

    constructor() {
        // 安全检查：确保只在测试环境中使用
        this.validateEnvironment();
    }

    /**
     * 验证环境安全性
     */
    private validateEnvironment(): void {
        const nodeEnv = process.env.NODE_ENV;
        const testMode = process.env.TEST_MODE;

        const isTestEnv = nodeEnv === "e2e" || testMode === "true";

        if (!isTestEnv) {
            const errorMsg = `⚠️ SECURITY WARNING: MemoryStorageService is being used in non-e2e environment (NODE_ENV=${nodeEnv}, TEST_MODE=${testMode}). This service should only be used for testing purposes.`;
            console.error(errorMsg);

            // 在生产环境中抛出错误
            if (nodeEnv === "production") {
                throw new Error("MemoryStorageService is not allowed in production environment");
            }
        } else {
            console.log("✅ MemoryStorageService initialized in test environment");
        }
    }

    /**
     * 创建存储桶
     */
    async makeBucket(bucketName: string): Promise<void> {
        if (this.buckets.has(bucketName)) {
            return; // 桶已存在，直接返回
        }

        this.buckets.set(bucketName, {
            name: bucketName,
            files: new Map(),
            createdAt: new Date(),
        });
    }

    /**
     * 创建存储桶 (别名方法，用于兼容性)
     */
    async createBucket(bucketName: string): Promise<void> {
        return this.makeBucket(bucketName);
    }

    /**
     * 检查存储桶是否存在
     */
    async bucketExists(bucketName: string): Promise<boolean> {
        return this.buckets.has(bucketName);
    }

    /**
     * 删除存储桶
     */
    async removeBucket(bucketName: string): Promise<void> {
        const bucket = this.buckets.get(bucketName);
        if (!bucket) {
            throw new Error(`Bucket ${bucketName} does not exist`);
        }

        if (bucket.files.size > 0) {
            throw new Error(`Bucket ${bucketName} is not empty`);
        }

        this.buckets.delete(bucketName);
    }

    /**
     * 上传文件
     */
    async putObject(
        bucketName: string,
        objectName: string,
        data: Buffer | string | Readable,
        metadata?: Record<string, string>,
    ): Promise<{ etag: string; versionId?: string }> {
        const bucket = this.buckets.get(bucketName);
        if (!bucket) {
            throw new Error(`Bucket ${bucketName} does not exist`);
        }

        let buffer: Buffer;
        if (data instanceof Buffer) {
            buffer = data;
        } else if (typeof data === "string") {
            buffer = Buffer.from(data, "utf8");
        } else if (data instanceof Readable) {
            // 处理流数据
            const chunks: Buffer[] = [];
            for await (const chunk of data) {
                chunks.push(chunk);
            }
            buffer = Buffer.concat(chunks);
        } else {
            throw new Error("Unsupported data type");
        }

        const etag = this.generateETag(buffer);
        const file: StoredFile = {
            key: objectName,
            data: buffer,
            contentType: metadata?.["Content-Type"] || "application/octet-stream",
            metadata,
            size: buffer.length,
            etag,
            lastModified: new Date(),
        };

        bucket.files.set(objectName, file);

        return { etag };
    }

    /**
     * 下载文件
     */
    async getObject(bucketName: string, objectName: string): Promise<Readable> {
        const bucket = this.buckets.get(bucketName);
        if (!bucket) {
            throw new Error(`Bucket ${bucketName} does not exist`);
        }

        const file = bucket.files.get(objectName);
        if (!file) {
            throw new Error(`Object ${objectName} does not exist`);
        }

        return Readable.from(file.data);
    }

    /**
     * 获取文件信息
     */
    async statObject(
        bucketName: string,
        objectName: string,
    ): Promise<{
        size: number;
        etag: string;
        lastModified: Date;
        contentType?: string;
        metadata?: Record<string, string>;
    }> {
        const bucket = this.buckets.get(bucketName);
        if (!bucket) {
            throw new Error(`Bucket ${bucketName} does not exist`);
        }

        const file = bucket.files.get(objectName);
        if (!file) {
            throw new Error(`Object ${objectName} does not exist`);
        }

        return {
            size: file.size,
            etag: file.etag,
            lastModified: file.lastModified,
            contentType: file.contentType,
            metadata: file.metadata,
        };
    }

    /**
     * 删除文件
     */
    async removeObject(bucketName: string, objectName: string): Promise<void> {
        const bucket = this.buckets.get(bucketName);
        if (!bucket) {
            throw new Error(`Bucket ${bucketName} does not exist`);
        }

        if (!bucket.files.has(objectName)) {
            throw new Error(`Object ${objectName} does not exist`);
        }

        bucket.files.delete(objectName);
    }

    /**
     * 列出对象（实现 IStorageService 接口）
     */
    async *listObjects(
        options?: import("./interfaces/storage.interface").ListObjectsOptions,
    ): AsyncIterable<import("./interfaces/storage.interface").ObjectListItem> {
        const prefix = options?.prefix || "";
        const maxKeys = options?.maxKeys;

        // 假设使用默认的 bucket（在测试环境中）
        const defaultBucket = Array.from(this.buckets.values())[0];
        if (!defaultBucket) {
            return;
        }

        let count = 0;
        for (const file of defaultBucket.files.values()) {
            if (!prefix || file.key.startsWith(prefix)) {
                yield {
                    name: file.key,
                    size: file.size,
                    lastModified: file.lastModified,
                    etag: file.etag,
                };

                count++;
                if (maxKeys && count >= maxKeys) {
                    break;
                }
            }
        }
    }

    /**
     * 上传 Buffer 数据（实现 IStorageService 接口）
     */
    async uploadBuffer(
        buffer: Buffer,
        fileKey: string,
        metadata?: Record<string, string>,
    ): Promise<{ fileKey: string }> {
        // 假设使用默认的 bucket（在测试环境中）
        const defaultBucket = Array.from(this.buckets.values())[0];
        if (!defaultBucket) {
            throw new Error("No bucket available for upload");
        }

        const etag = crypto.createHash("md5").update(buffer).digest("hex");

        const storedFile: StoredFile = {
            key: fileKey,
            data: buffer,
            contentType: metadata?.["Content-Type"] || "application/octet-stream",
            metadata,
            size: buffer.length,
            etag,
            lastModified: new Date(),
        };

        defaultBucket.files.set(fileKey, storedFile);

        return { fileKey };
    }

    /**
     * 列出所有存储桶
     */
    async listBuckets(): Promise<Array<{ name: string; creationDate: Date }>> {
        return Array.from(this.buckets.values()).map((bucket) => ({
            name: bucket.name,
            creationDate: bucket.createdAt,
        }));
    }

    /**
     * 清空所有数据（用于测试清理）
     */
    async clear(): Promise<void> {
        this.buckets.clear();
    }

    /**
     * 获取存储统计信息
     */
    getStats(): {
        bucketCount: number;
        totalFiles: number;
        totalSize: number;
    } {
        let totalFiles = 0;
        let totalSize = 0;

        for (const bucket of this.buckets.values()) {
            totalFiles += bucket.files.size;
            for (const file of bucket.files.values()) {
                totalSize += file.size;
            }
        }

        return {
            bucketCount: this.buckets.size,
            totalFiles,
            totalSize,
        };
    }

    /**
     * 生成 ETag
     */
    private generateETag(data: Buffer): string {
        return crypto.createHash("md5").update(data).digest("hex");
    }

    /**
     * 检查文件是否存在
     */
    async objectExists(bucketName: string, objectName: string): Promise<boolean> {
        const bucket = this.buckets.get(bucketName);
        if (!bucket) {
            return false;
        }
        return bucket.files.has(objectName);
    }

    /**
     * 复制文件
     */
    async copyObject(
        sourceBucket: string,
        sourceObject: string,
        destBucket: string,
        destObject: string,
    ): Promise<{ etag: string }> {
        const sourceBucketObj = this.buckets.get(sourceBucket);
        if (!sourceBucketObj) {
            throw new Error(`Source bucket ${sourceBucket} does not exist`);
        }

        const destBucketObj = this.buckets.get(destBucket);
        if (!destBucketObj) {
            throw new Error(`Destination bucket ${destBucket} does not exist`);
        }

        const sourceFile = sourceBucketObj.files.get(sourceObject);
        if (!sourceFile) {
            throw new Error(`Source object ${sourceObject} does not exist`);
        }

        const copiedFile: StoredFile = {
            ...sourceFile,
            key: destObject,
            lastModified: new Date(),
        };

        destBucketObj.files.set(destObject, copiedFile);

        return { etag: copiedFile.etag };
    }

    // IStorageService 接口实现

    /**
     * 上传文件
     */
    async uploadFile(file: Express.Multer.File, options?: UploadOptions): Promise<FileResult> {
        const bucketName = "default";
        await this.makeBucket(bucketName);

        const fileKey = `${options?.business || "common"}/${Date.now()}-${file.originalname}`;

        await this.putObject(bucketName, fileKey, file.buffer, {
            "Content-Type": file.mimetype,
        });

        return {
            fileName: file.originalname || fileKey,
            originalName: file.originalname,
            url: `memory://${bucketName}/${fileKey}`,
            size: file.size,
            mimeType: file.mimetype,
            fileKey,
        };
    }

    /**
     * 下载文件流
     */
    async downloadFile(fileKey: string): Promise<Readable> {
        const bucketName = "default";
        return this.getObject(bucketName, fileKey);
    }

    /**
     * 删除文件
     */
    async deleteFile(fileKey: string): Promise<void> {
        const bucketName = "default";
        await this.removeObject(bucketName, fileKey);
    }

    /**
     * 获取文件访问URL (已废弃)
     */
    async getFileUrl(fileKey: string): Promise<string> {
        return `memory://default/${fileKey}`;
    }

    /**
     * 生成临时访问URL
     */
    async generateTemporaryUrl(fileKey: string, options?: TemporaryUrlOptions): Promise<string> {
        const expiresIn = options?.expiresIn || 3600;
        const bucket = options?.bucket || "default";
        const expiry = Date.now() + expiresIn * 1000;
        return `memory://${bucket}/${fileKey}?expires=${expiry}`;
    }

    /**
     * 上传缩略图
     */
    async uploadThumbnail(buffer: Buffer, fileName: string): Promise<string> {
        const bucketName = "thumbnails";
        await this.makeBucket(bucketName);

        const thumbnailKey = `thumb-${fileName}`;
        await this.putObject(bucketName, thumbnailKey, buffer, {
            "Content-Type": "image/jpeg",
        });

        return `memory://${bucketName}/${thumbnailKey}`;
    }

    /**
     * 检查文件是否存在
     */
    async fileExists(fileKey: string): Promise<boolean> {
        const bucketName = "default";
        const bucket = this.buckets.get(bucketName);
        return bucket ? bucket.files.has(fileKey) : false;
    }

    /**
     * 获取文件信息
     */
    async getFileInfo(fileKey: string): Promise<FileInfo> {
        const bucketName = "default";
        const stat = await this.statObject(bucketName, fileKey);

        return {
            fileName: fileKey,
            size: stat.size,
            mimeType: stat.contentType || "application/octet-stream",
            lastModified: stat.lastModified,
        };
    }
}

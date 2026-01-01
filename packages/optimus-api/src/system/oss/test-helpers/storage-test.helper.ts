import { MemoryStorageService } from "../memory-storage.service";
import * as S3rver from "s3rver";
import * as path from "path";
import * as fs from "fs";

export interface StorageTestConfig {
    provider: "memory" | "s3rver" | "minio";
    s3rverPort?: number;
    s3rverDirectory?: string;
    buckets?: string[];
}

/**
 * 存储测试助手
 * 提供轻量级的存储测试解决方案
 */
export class StorageTestHelper {
    private static instance: StorageTestHelper;
    private memoryStorage: MemoryStorageService;
    private s3rverInstance: any;
    private config: StorageTestConfig;

    private constructor() {
        this.memoryStorage = new MemoryStorageService();
        this.config = this.getDefaultConfig();
    }

    static getInstance(): StorageTestHelper {
        if (!StorageTestHelper.instance) {
            StorageTestHelper.instance = new StorageTestHelper();
        }
        return StorageTestHelper.instance;
    }

    /**
     * 获取默认配置
     */
    private getDefaultConfig(): StorageTestConfig {
        const provider = process.env.STORAGE_PROVIDER as "memory" | "s3rver" | "minio";

        return {
            provider: provider || "memory",
            s3rverPort: parseInt(process.env.S3RVER_PORT || "4569", 10),
            s3rverDirectory: process.env.S3RVER_DIRECTORY || path.join(__dirname, "../../../temp/s3rver"),
            buckets: [
                process.env.MINIO_BUCKET_NAME || "test-uploads",
                process.env.MINIO_THUMBNAIL_BUCKET || "test-thumbnails",
            ],
        };
    }

    /**
     * 启动存储服务
     */
    async start(config?: Partial<StorageTestConfig>): Promise<void> {
        if (config) {
            this.config = { ...this.config, ...config };
        }

        console.log(`🗄️  Starting storage service: ${this.config.provider}`);

        switch (this.config.provider) {
            case "memory":
                await this.startMemoryStorage();
                break;
            case "s3rver":
                await this.startS3rver();
                break;
            case "minio":
                console.log("⚠️  MinIO requires external setup. Please ensure MinIO is running.");
                break;
            default:
                throw new Error(`Unsupported storage provider: ${this.config.provider}`);
        }

        // 创建默认存储桶
        await this.createDefaultBuckets();
    }

    /**
     * 启动内存存储
     */
    private async startMemoryStorage(): Promise<void> {
        // 内存存储无需启动过程
        console.log("✅ Memory storage ready");
    }

    /**
     * 启动 S3rver
     */
    private async startS3rver(): Promise<void> {
        if (this.s3rverInstance) {
            console.log("S3rver already running");
            return;
        }

        // 确保目录存在
        if (this.config.s3rverDirectory && !fs.existsSync(this.config.s3rverDirectory)) {
            fs.mkdirSync(this.config.s3rverDirectory, { recursive: true });
        }

        this.s3rverInstance = new S3rver({
            port: this.config.s3rverPort,
            hostname: "localhost",
            silent: false,
            directory: this.config.s3rverDirectory,
            configureBuckets: this.config.buckets?.map((name) => ({ name })),
        });

        return new Promise((resolve, reject) => {
            this.s3rverInstance.run((err: any, { address, port }: any) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(`✅ S3rver running at http://${address}:${port}`);
                    resolve();
                }
            });
        });
    }

    /**
     * 创建默认存储桶
     */
    private async createDefaultBuckets(): Promise<void> {
        if (!this.config.buckets) return;

        for (const bucketName of this.config.buckets) {
            try {
                if (this.config.provider === "memory") {
                    const exists = await this.memoryStorage.bucketExists(bucketName);
                    if (!exists) {
                        await this.memoryStorage.createBucket(bucketName);
                        console.log(`📦 Created bucket: ${bucketName}`);
                    }
                }
                // S3rver 和 MinIO 的存储桶创建在配置中处理
            } catch (error) {
                console.warn(`⚠️  Failed to create bucket ${bucketName}:`, error.message);
            }
        }
    }

    /**
     * 停止存储服务
     */
    async stop(): Promise<void> {
        console.log(`🛑 Stopping storage service: ${this.config.provider}`);

        switch (this.config.provider) {
            case "memory":
                await this.memoryStorage.clear();
                console.log("✅ Memory storage cleared");
                break;
            case "s3rver":
                if (this.s3rverInstance) {
                    await new Promise<void>((resolve) => {
                        this.s3rverInstance.close(() => {
                            console.log("✅ S3rver stopped");
                            this.s3rverInstance = null;
                            resolve();
                        });
                    });
                }
                break;
        }
    }

    /**
     * 重置存储状态
     */
    async reset(): Promise<void> {
        console.log("🔄 Resetting storage state");

        switch (this.config.provider) {
            case "memory":
                await this.memoryStorage.clear();
                await this.createDefaultBuckets();
                break;
            case "s3rver":
                // S3rver 重置需要清空目录
                if (this.config.s3rverDirectory && fs.existsSync(this.config.s3rverDirectory)) {
                    fs.rmSync(this.config.s3rverDirectory, { recursive: true, force: true });
                    fs.mkdirSync(this.config.s3rverDirectory, { recursive: true });
                }
                break;
        }

        console.log("✅ Storage state reset");
    }

    /**
     * 获取内存存储实例
     */
    getMemoryStorage(): MemoryStorageService {
        if (this.config.provider !== "memory") {
            throw new Error("Memory storage is not active");
        }
        return this.memoryStorage;
    }

    /**
     * 获取存储配置
     */
    getConfig(): StorageTestConfig {
        return { ...this.config };
    }

    /**
     * 获取连接配置（用于 MinIO 客户端）
     */
    getConnectionConfig(): {
        endPoint: string;
        port: number;
        useSSL: boolean;
        accessKey: string;
        secretKey: string;
    } {
        switch (this.config.provider) {
            case "s3rver":
                return {
                    endPoint: "localhost",
                    port: this.config.s3rverPort || 4569,
                    useSSL: false,
                    accessKey: "S3RVER",
                    secretKey: "S3RVER",
                };
            case "minio":
                if (!process.env.MINIO_ACCESS_KEY) {
                    throw new Error("MINIO_ACCESS_KEY environment variable is required");
                }
                if (!process.env.MINIO_SECRET_KEY) {
                    throw new Error("MINIO_SECRET_KEY environment variable is required");
                }
                return {
                    endPoint: process.env.MINIO_ENDPOINT || "localhost",
                    port: parseInt(process.env.MINIO_PORT || "9000", 10),
                    useSSL: process.env.MINIO_USE_SSL === "true",
                    accessKey: process.env.MINIO_ACCESS_KEY,
                    secretKey: process.env.MINIO_SECRET_KEY,
                };
            default:
                throw new Error(`Connection config not available for provider: ${this.config.provider}`);
        }
    }

    /**
     * 检查存储服务是否就绪
     */
    async isReady(): Promise<boolean> {
        try {
            switch (this.config.provider) {
                case "memory":
                    return true;
                case "s3rver":
                    return this.s3rverInstance !== null;
                case "minio":
                    // 可以添加 MinIO 健康检查
                    return true;
                default:
                    return false;
            }
        } catch (error) {
            return false;
        }
    }

    /**
     * 获取存储统计信息
     */
    async getStats(): Promise<{
        provider: string;
        bucketCount: number;
        totalFiles?: number;
        totalSize?: number;
    }> {
        const baseStats = {
            provider: this.config.provider,
            bucketCount: this.config.buckets?.length || 0,
        };

        if (this.config.provider === "memory") {
            const memoryStats = this.memoryStorage.getStats();
            return {
                ...baseStats,
                bucketCount: memoryStats.bucketCount,
                totalFiles: memoryStats.totalFiles,
                totalSize: memoryStats.totalSize,
            };
        }

        return baseStats;
    }

    /**
     * 等待存储服务就绪
     */
    async waitForReady(timeout = 10000): Promise<void> {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            if (await this.isReady()) {
                return;
            }
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        throw new Error(`Storage service not ready within ${timeout}ms`);
    }
}

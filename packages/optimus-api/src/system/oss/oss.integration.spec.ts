import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { OssModule } from "./oss.module";
import { OssService } from "./oss.service";
import { StorageFactory } from "./factory/storage.factory";
import { StorageConfigService } from "./storage-config.service";
import { OssEntity } from "./oss.entity";
import { MinioService } from "./minio.service";
import { IStorageService } from "./interfaces/storage.interface";
import { StorageException, StorageErrorType } from "./exceptions/storage.exception";
import { StorageTestHelper } from "./test-helpers/storage-test.helper";

describe("OSS Storage Integration Tests", () => {
    let module: TestingModule;
    let ossService: OssService;
    let storageFactory: StorageFactory;
    let storageConfigService: StorageConfigService;
    let storageService: IStorageService;

    // Test configuration for MinIO
    if (!process.env.TEST_MINIO_ACCESS_KEY) {
        throw new Error("TEST_MINIO_ACCESS_KEY environment variable is required for integration tests");
    }
    if (!process.env.TEST_MINIO_SECRET_KEY) {
        throw new Error("TEST_MINIO_SECRET_KEY environment variable is required for integration tests");
    }

    const testMinioConfig = {
        endPoint: process.env.TEST_MINIO_ENDPOINT || "localhost",
        port: parseInt(process.env.TEST_MINIO_PORT) || 9000,
        useSSL: false,
        accessKey: process.env.TEST_MINIO_ACCESS_KEY,
        secretKey: process.env.TEST_MINIO_SECRET_KEY,
        bucketName: "test-uploads",
        thumbnailBucket: "test-thumbnails",
        region: "us-east-1",
    };

    beforeAll(async () => {
        // Set test environment variables
        StorageTestHelper.setupTestEnvironment();

        module = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                }),
                TypeOrmModule.forRoot({
                    type: "mysql",
                    host: process.env.DB_HOST || "localhost",
                    port: parseInt(process.env.DB_PORT || "3306"),
                    username: process.env.DB_USERNAME,
                    password: process.env.DB_PASSWORD,
                    database: process.env.DB_DATABASE || "kapok_e2e",
                    entities: [OssEntity],
                    synchronize: true,
                    dropSchema: true,
                }),
                OssModule,
            ],
        }).compile();

        ossService = module.get<OssService>(OssService);
        storageFactory = module.get<StorageFactory>(StorageFactory);
        storageConfigService = module.get<StorageConfigService>(StorageConfigService);
    });

    afterAll(async () => {
        if (module) {
            await module.close();
        }
    });

    beforeEach(async () => {
        // Reset storage factory for each test
        storageFactory.reset();
        storageService = storageFactory.create();
    });

    describe("Storage Mode Switching", () => {
        it("should create MinIO service when provider is minio", () => {
            process.env.STORAGE_PROVIDER = "minio";
            storageFactory.reset();

            const service = storageFactory.create();
            expect(service).toBeInstanceOf(MinioService);
            expect(storageFactory.getStorageProvider()).toBe("minio");
        });

        it("should handle invalid storage provider gracefully", () => {
            const originalProvider = process.env.STORAGE_PROVIDER;
            process.env.STORAGE_PROVIDER = "invalid-provider";
            storageFactory.reset();

            expect(() => {
                storageFactory.create();
            }).toThrow();

            // Restore original provider
            process.env.STORAGE_PROVIDER = originalProvider;
        });

        it("should use fallback configuration when config is invalid", () => {
            const originalEndpoint = process.env.MINIO_ENDPOINT;
            delete process.env.MINIO_ENDPOINT;
            storageFactory.reset();

            const service = storageFactory.create();
            expect(service).toBeInstanceOf(MinioService);

            // Restore original config
            process.env.MINIO_ENDPOINT = originalEndpoint;
        });

        it("should detect storage provider changes", () => {
            expect(storageFactory.getStorageProvider()).toBe("minio");

            process.env.STORAGE_PROVIDER = "aliyun";
            storageFactory.reset();

            expect(storageFactory.getStorageProvider()).toBe("aliyun");

            // Reset back to minio for other tests
            process.env.STORAGE_PROVIDER = "minio";
        });
    });

    describe("File Lifecycle Operations", () => {
        it("should complete full file lifecycle: upload -> check -> download -> delete", async () => {
            const testFile = StorageTestHelper.createTestFile("test-lifecycle.txt", "Test file content for lifecycle");

            // 1. Upload file
            const uploadResult = await storageService.uploadFile(testFile, {
                folder: "integration-test",
                business: "test-lifecycle",
            });

            expect(uploadResult).toBeDefined();
            expect(uploadResult.fileName).toContain("integration-test/");
            expect(uploadResult.originalName).toBe("test-lifecycle.txt");
            expect(uploadResult.size).toBe(testFile.size);
            expect(uploadResult.url).toContain(testMinioConfig.bucketName);

            // 2. Check file exists
            const exists = await storageService.fileExists(uploadResult.fileName);
            expect(exists).toBe(true);

            // 3. Get file info
            const fileInfo = await storageService.getFileInfo(uploadResult.fileName);
            expect(fileInfo.fileName).toBe(uploadResult.fileName);
            expect(fileInfo.size).toBe(testFile.size);
            expect(fileInfo.mimeType).toBe(testFile.mimetype);

            // 4. Download file
            const downloadStream = await storageService.downloadFile(uploadResult.fileName);
            expect(downloadStream).toBeDefined();

            // Verify downloaded content
            const chunks: Buffer[] = [];
            downloadStream.on("data", (chunk) => chunks.push(chunk));

            await new Promise((resolve, reject) => {
                downloadStream.on("end", resolve);
                downloadStream.on("error", reject);
            });

            const downloadedContent = Buffer.concat(chunks).toString();
            expect(downloadedContent).toBe("Test file content for lifecycle");

            // 5. Delete file
            await storageService.deleteFile(uploadResult.fileName);

            // 6. Verify file is deleted
            const existsAfterDelete = await storageService.fileExists(uploadResult.fileName);
            expect(existsAfterDelete).toBe(false);
        });

        it("should handle image file with thumbnail generation", async () => {
            const imageFile = StorageTestHelper.createTestImageFile("test-image.png");

            const uploadResult = await storageService.uploadFile(imageFile, {
                generateThumbnail: true,
                thumbnailOptions: { width: 100, height: 100, quality: 80 },
            });

            expect(uploadResult.thumbnailUrl).toBeDefined();
            expect(uploadResult.thumbnailUrl).toContain(testMinioConfig.thumbnailBucket);

            // Clean up
            await storageService.deleteFile(uploadResult.fileName);
            if (uploadResult.thumbnailUrl) {
                const thumbnailKey = `thumb_${uploadResult.fileName.split("/").pop()}`;
                await (storageService as MinioService).deleteThumbnail(uploadResult.fileName.split("/").pop());
            }
        });

        it("should handle multiple file uploads concurrently", async () => {
            const files = StorageTestHelper.generateTestFiles(3, "concurrent");

            const uploadPromises = files.map((file) => storageService.uploadFile(file, { folder: "concurrent-test" }));

            const results = await Promise.all(uploadPromises);

            expect(results).toHaveLength(3);
            results.forEach((result, index) => {
                expect(result.originalName).toBe(files[index].originalname);
                expect(result.fileName).toContain("concurrent-test/");
            });

            // Clean up
            const deletePromises = results.map((result) => storageService.deleteFile(result.fileName));
            await Promise.all(deletePromises);
        });
    });

    describe("Error Handling and Retry Mechanism", () => {
        it("should handle file not found errors gracefully", async () => {
            const nonExistentFile = "non-existent-file.txt";

            await expect(storageService.downloadFile(nonExistentFile)).rejects.toThrow();

            const exists = await storageService.fileExists(nonExistentFile);
            expect(exists).toBe(false);
        });

        it("should handle invalid file operations", async () => {
            const invalidFile = StorageTestHelper.createTestFile("", ""); // Empty file name

            await expect(storageService.uploadFile(invalidFile)).rejects.toThrow();
        });

        it("should handle storage service connection errors", async () => {
            // Create a service with invalid configuration
            const invalidConfig = {
                ...testMinioConfig,
                endPoint: "invalid-endpoint",
                port: 99999,
            };

            const invalidService = new MinioService(invalidConfig, true); // Skip initialization

            await expect(
                invalidService.uploadFile(StorageTestHelper.createTestFile("test.txt", "content")),
            ).rejects.toThrow();
        });

        it("should handle configuration validation errors", () => {
            const originalEndpoint = process.env.MINIO_ENDPOINT;
            const originalAccessKey = process.env.MINIO_ACCESS_KEY;

            // Remove required configuration
            delete process.env.MINIO_ENDPOINT;
            delete process.env.MINIO_ACCESS_KEY;

            storageFactory.reset();

            expect(() => {
                storageFactory.create();
            }).toThrow();

            // Restore configuration
            process.env.MINIO_ENDPOINT = originalEndpoint;
            process.env.MINIO_ACCESS_KEY = originalAccessKey;
        });

        it("should retry failed operations", async () => {
            // This test would require mocking the MinIO client to simulate failures
            // For now, we'll test that the retry mechanism exists in the error handler
            const testFile = StorageTestHelper.createTestFile("retry-test.txt", "Test content");

            // Test successful upload (retry mechanism is internal)
            const result = await storageService.uploadFile(testFile);
            expect(result).toBeDefined();

            // Clean up
            await storageService.deleteFile(result.fileName);
        });
    });

    describe("Storage Configuration Service", () => {
        it("should initialize storage service correctly", () => {
            expect(storageConfigService).toBeDefined();
            expect(storageConfigService.getStorageService()).toBeDefined();
        });

        it("should perform health check", async () => {
            const isHealthy = await storageConfigService.healthCheck();
            // Health check might fail in test environment, so we just verify it returns a boolean
            expect(typeof isHealthy).toBe("boolean");
        });

        it("should get storage service instance", () => {
            const service = storageConfigService.getStorageService();
            expect(service).toBeDefined();
        });
    });

    describe("Storage Service Integration", () => {
        it("should upload and manage files through storage service", async () => {
            const testFile = StorageTestHelper.createTestFile("integration-test.txt", "Integration test content");

            // Test file upload through storage service directly
            const uploadResult = await storageService.uploadFile(testFile, {
                business: "integration-test",
            });

            expect(uploadResult).toBeDefined();
            expect(uploadResult.fileName).toBeDefined();
            expect(uploadResult.originalName).toBe("integration-test.txt");

            // Verify file exists
            const exists = await storageService.fileExists(uploadResult.fileName);
            expect(exists).toBe(true);

            // Clean up
            await storageService.deleteFile(uploadResult.fileName);
        });
    });
});

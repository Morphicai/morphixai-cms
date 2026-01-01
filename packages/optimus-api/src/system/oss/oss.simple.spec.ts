import { StorageFactory } from "./factory/storage.factory";
import { MinioService } from "./minio.service";
import { StorageTestHelper } from "./test-helpers/storage-test.helper";

describe("OSS Storage Simple Integration Tests", () => {
    let storageFactory: StorageFactory;

    beforeEach(() => {
        // 设置测试环境
        StorageTestHelper.setupTestEnvironment();

        // 创建工厂实例（不使用依赖注入）
        storageFactory = new (class extends StorageFactory {
            constructor() {
                super(null); // 不使用ConfigService
            }
        })();
    });

    describe("存储模式切换功能测试", () => {
        it("应该根据环境变量创建MinIO服务", () => {
            process.env.STORAGE_PROVIDER = "minio";
            storageFactory.reset();

            const service = storageFactory.create();

            expect(service).toBeInstanceOf(MinioService);
            expect(storageFactory.getStorageProvider()).toBe("minio");
        });

        it("应该处理无效的存储提供商", () => {
            const originalProvider = process.env.STORAGE_PROVIDER;
            process.env.STORAGE_PROVIDER = "invalid-provider";
            storageFactory.reset();

            expect(() => {
                storageFactory.create();
            }).toThrow();

            // 恢复原始配置
            process.env.STORAGE_PROVIDER = originalProvider;
        });

        it("应该在配置无效时使用降级配置", () => {
            const originalEndpoint = process.env.MINIO_ENDPOINT;
            delete process.env.MINIO_ENDPOINT;
            storageFactory.reset();

            const service = storageFactory.create();
            expect(service).toBeInstanceOf(MinioService);

            // 恢复原始配置
            process.env.MINIO_ENDPOINT = originalEndpoint;
        });
    });

    describe("文件操作测试", () => {
        let storageService;

        beforeEach(() => {
            process.env.STORAGE_PROVIDER = "minio";
            storageFactory.reset();
            storageService = storageFactory.create();
        });

        it("应该生成正确的文件URL", async () => {
            const fileKey = "test/sample.txt";
            const url = await storageService.getFileUrl(fileKey);

            expect(url).toContain("localhost:9000");
            expect(url).toContain("test-uploads");
            expect(url).toContain(fileKey);
        });

        it("应该正确识别图片文件", () => {
            const imageFile = StorageTestHelper.createTestImageFile("test.png");
            expect(imageFile.mimetype).toBe("image/png");
            expect(imageFile.originalname).toBe("test.png");
        });

        it("应该创建测试文件对象", () => {
            const testFile = StorageTestHelper.createTestFile("test.txt", "test content");

            expect(testFile.originalname).toBe("test.txt");
            expect(testFile.mimetype).toBe("text/plain");
            expect(testFile.buffer.toString()).toBe("test content");
        });
    });

    describe("错误处理测试", () => {
        it("应该处理配置验证错误", () => {
            const originalProvider = process.env.STORAGE_PROVIDER;

            // 设置无效的存储提供商
            process.env.STORAGE_PROVIDER = "invalid-provider";
            storageFactory.reset();

            expect(() => {
                storageFactory.create();
            }).toThrow();

            // 恢复配置
            process.env.STORAGE_PROVIDER = originalProvider;
        });
    });

    describe("工厂模式测试", () => {
        it("应该实现单例模式", () => {
            const service1 = storageFactory.create();
            const service2 = storageFactory.create();

            expect(service1).toBe(service2);
        });

        it("应该正确重置状态", () => {
            storageFactory.create();
            expect(storageFactory.isInitialized()).toBe(true);

            storageFactory.reset();
            expect(storageFactory.isInitialized()).toBe(false);
        });
    });

    describe("测试工具验证", () => {
        it("应该生成多个测试文件", () => {
            const files = StorageTestHelper.generateTestFiles(3, "batch");

            expect(files).toHaveLength(3);
            files.forEach((file, index) => {
                expect(file.originalname).toBe(`batch-${index + 1}.txt`);
                expect(file.buffer.toString()).toBe(`Test content for file ${index + 1}`);
            });
        });

        it("应该提供测试配置", () => {
            const minioConfig = StorageTestHelper.getTestConfig("minio");

            expect(minioConfig.endPoint).toBe("localhost");
            expect(minioConfig.port).toBe(9000);
            expect(minioConfig.bucketName).toBe("test-uploads");
        });
    });
});

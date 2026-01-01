import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { StorageFactory } from "./storage.factory";
import { MinioService } from "../minio.service";
import { AliyunOssService } from "../aliyun-oss.service";
import { StorageTestHelper } from "../test-helpers/storage-test.helper";

describe("StorageFactory", () => {
    let factory: StorageFactory;
    let configService: ConfigService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StorageFactory,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => {
                            const config = {
                                STORAGE_PROVIDER: "minio",
                                MINIO_ENDPOINT: "localhost",
                                MINIO_PORT: "9000",
                                MINIO_USE_SSL: "false",
                                MINIO_ACCESS_KEY: "minioadmin",
                                MINIO_SECRET_KEY: "minioadmin123",
                                MINIO_BUCKET_NAME: "test-uploads",
                                MINIO_THUMBNAIL_BUCKET: "test-thumbnails",
                            };
                            return config[key];
                        }),
                    },
                },
            ],
        }).compile();

        factory = module.get<StorageFactory>(StorageFactory);
        configService = module.get<ConfigService>(ConfigService);
    });

    beforeEach(() => {
        // Set up test environment
        StorageTestHelper.setupTestEnvironment();
        factory.reset();
    });

    describe("create", () => {
        it("should create MinIO service when provider is minio", () => {
            process.env.STORAGE_PROVIDER = "minio";

            const service = factory.create();

            expect(service).toBeInstanceOf(MinioService);
        });

        it("should create Aliyun OSS service when provider is aliyun", () => {
            // Set up Aliyun OSS environment variables
            process.env.STORAGE_PROVIDER = "aliyun";
            process.env.ALIYUN_OSS_REGION = "cn-beijing";
            process.env.ALIYUN_OSS_ACCESS_KEY_ID = "test-access-key-id";
            process.env.ALIYUN_OSS_ACCESS_KEY_SECRET = "test-access-key-secret";
            process.env.ALIYUN_OSS_BUCKET = "test-bucket";
            process.env.ALIYUN_OSS_THUMBNAIL_BUCKET = "test-thumbnails";

            factory.reset(); // Reset to pick up new environment variables
            const service = factory.create();

            expect(service).toBeInstanceOf(AliyunOssService);
        });

        it("should return the same instance on subsequent calls", () => {
            const service1 = factory.create();
            const service2 = factory.create();

            expect(service1).toBe(service2);
        });

        it("should throw error for unsupported provider", () => {
            process.env.STORAGE_PROVIDER = "unsupported";

            expect(() => {
                factory.create();
            }).toThrow();
        });
    });

    describe("getStorageProvider", () => {
        it("should return current storage provider", () => {
            process.env.STORAGE_PROVIDER = "minio";

            const provider = factory.getStorageProvider();

            expect(provider).toBe("minio");
        });

        it("should return default provider when not set", () => {
            delete process.env.STORAGE_PROVIDER;

            const provider = factory.getStorageProvider();

            expect(provider).toBe("minio"); // Default fallback
        });
    });

    describe("isInitialized", () => {
        it("should return false initially", () => {
            expect(factory.isInitialized()).toBe(false);
        });

        it("should return true after creating service", () => {
            factory.create();

            expect(factory.isInitialized()).toBe(true);
        });
    });

    describe("reset", () => {
        it("should reset the factory state", () => {
            factory.create();
            expect(factory.isInitialized()).toBe(true);

            factory.reset();

            expect(factory.isInitialized()).toBe(false);
        });
    });
});

import { UrlSigningUtils } from "./url-signing.utils";
import { AliyunOssConfig, MinioConfig } from "../interfaces/config.interface";
import { ConfigurationException, StorageException } from "../exceptions/storage.exception";

describe("UrlSigningUtils", () => {
    let mockAliyunConfig: AliyunOssConfig;
    let mockMinioConfig: MinioConfig;

    beforeEach(() => {
        mockAliyunConfig = {
            region: "cn-beijing",
            accessKeyId: "test-access-key-id",
            accessKeySecret: "test-access-key-secret",
            bucket: "test-bucket",
            thumbnailBucket: "test-thumbnails",
            cdnDomain: "https://cdn.example.com",
            endpoint: "https://cn-beijing.aliyuncs.com",
        };

        mockMinioConfig = {
            endPoint: "localhost",
            port: 9000,
            useSSL: false,
            accessKey: "test-access-key",
            secretKey: "test-secret-key",
            bucketName: "test-bucket",
            thumbnailBucket: "test-thumbnails",
            region: "us-east-1",
        };
    });

    describe("getDefaultExpiresIn", () => {
        it("should return default expiration time of 3600 seconds", () => {
            expect(UrlSigningUtils.getDefaultExpiresIn()).toBe(3600);
        });
    });

    describe("generateAliyunSignedUrl", () => {
        it("should throw ConfigurationException with missing required config fields", async () => {
            const invalidConfig = { ...mockAliyunConfig, region: "" };

            await expect(
                UrlSigningUtils.generateAliyunSignedUrl(invalidConfig, { fileKey: "test.jpg" }),
            ).rejects.toThrow(ConfigurationException);
        });

        it("should throw ConfigurationException with invalid file key", async () => {
            await expect(UrlSigningUtils.generateAliyunSignedUrl(mockAliyunConfig, { fileKey: "" })).rejects.toThrow(
                ConfigurationException,
            );
        });

        it("should throw ConfigurationException with path traversal in file key", async () => {
            await expect(
                UrlSigningUtils.generateAliyunSignedUrl(mockAliyunConfig, { fileKey: "../test.jpg" }),
            ).rejects.toThrow(ConfigurationException);
        });

        it("should throw ConfigurationException with dangerous characters in file key", async () => {
            await expect(
                UrlSigningUtils.generateAliyunSignedUrl(mockAliyunConfig, { fileKey: "test<>.jpg" }),
            ).rejects.toThrow(ConfigurationException);
        });
    });

    describe("generateMinioSignedUrl", () => {
        it("should throw ConfigurationException with missing required config fields", async () => {
            const invalidConfig = { ...mockMinioConfig, endPoint: "" };

            await expect(
                UrlSigningUtils.generateMinioSignedUrl(invalidConfig, { fileKey: "test.jpg" }),
            ).rejects.toThrow(ConfigurationException);
        });

        it("should throw ConfigurationException with invalid port", async () => {
            const invalidConfig = { ...mockMinioConfig, port: -1 };

            await expect(
                UrlSigningUtils.generateMinioSignedUrl(invalidConfig, { fileKey: "test.jpg" }),
            ).rejects.toThrow(ConfigurationException);
        });

        it("should throw ConfigurationException with invalid file key", async () => {
            await expect(UrlSigningUtils.generateMinioSignedUrl(mockMinioConfig, { fileKey: "" })).rejects.toThrow(
                ConfigurationException,
            );
        });

        it("should throw ConfigurationException with path traversal in file key", async () => {
            await expect(
                UrlSigningUtils.generateMinioSignedUrl(mockMinioConfig, { fileKey: "../test.jpg" }),
            ).rejects.toThrow(ConfigurationException);
        });

        it("should throw ConfigurationException with dangerous characters in file key", async () => {
            await expect(
                UrlSigningUtils.generateMinioSignedUrl(mockMinioConfig, { fileKey: "test|.jpg" }),
            ).rejects.toThrow(ConfigurationException);
        });
    });

    describe("File key validation", () => {
        const validFileKeys = [
            "test.jpg",
            "folder/test.jpg",
            "deep/folder/structure/test.jpg",
            "file-with-dashes.jpg",
            "file_with_underscores.jpg",
            "file.with.dots.jpg",
        ];

        const invalidFileKeys = [
            "",
            "../test.jpg",
            "folder/../test.jpg",
            "test//file.jpg",
            "test<file>.jpg",
            "test:file.jpg",
            "test|file.jpg",
            'test"file".jpg',
            "test?file.jpg",
            "test*file.jpg",
        ];

        validFileKeys.forEach((fileKey) => {
            it(`should accept valid file key: ${fileKey}`, async () => {
                // This should succeed for valid file keys and generate a URL
                const result = await UrlSigningUtils.generateAliyunSignedUrl(mockAliyunConfig, { fileKey });
                expect(result).toBeDefined();
                expect(typeof result).toBe("string");
                expect(result).toContain(fileKey);
            });
        });

        invalidFileKeys.forEach((fileKey) => {
            it(`should reject invalid file key: ${fileKey}`, async () => {
                await expect(UrlSigningUtils.generateAliyunSignedUrl(mockAliyunConfig, { fileKey })).rejects.toThrow(
                    ConfigurationException,
                );
            });
        });
    });
});

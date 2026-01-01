import { MinioService } from "./minio.service";
import { MinioConfig } from "./interfaces/config.interface";
import { StorageException } from "./exceptions/storage.exception";

describe("MinioService", () => {
    let service: MinioService;
    let mockConfig: MinioConfig;

    beforeEach(() => {
        mockConfig = {
            endPoint: "localhost",
            port: 9000,
            useSSL: false,
            accessKey: "minioadmin",
            secretKey: "minioadmin123",
            bucketName: "test-uploads",
            thumbnailBucket: "test-thumbnails",
            region: "us-east-1",
        };
    });

    describe("constructor", () => {
        it("should create service with valid config", () => {
            expect(() => {
                service = new MinioService(mockConfig, true); // Skip initialization for testing
            }).not.toThrow();
        });

        it("should throw ConfigurationException with invalid config", () => {
            const invalidConfig = { ...mockConfig, endPoint: "" };
            expect(() => {
                service = new MinioService(invalidConfig, true); // Skip initialization for testing
            }).toThrow();
        });
    });

    describe("file operations", () => {
        beforeEach(() => {
            service = new MinioService(mockConfig, true); // Skip initialization for testing
        });

        it("should generate correct file URL", async () => {
            const fileKey = "test-folder/test-file.jpg";
            const url = await service.getFileUrl(fileKey);

            expect(url).toBe("http://localhost:9000/test-uploads/test-folder/test-file.jpg");
        });

        it("should handle SSL URLs correctly", async () => {
            const sslConfig = { ...mockConfig, useSSL: true, port: 443 };
            const sslService = new MinioService(sslConfig, true); // Skip initialization for testing

            const fileKey = "test-file.jpg";
            const url = await sslService.getFileUrl(fileKey);

            expect(url).toBe("https://localhost/test-uploads/test-file.jpg");
        });
    });

    describe("helper methods", () => {
        beforeEach(() => {
            service = new MinioService(mockConfig, true); // Skip initialization for testing
        });

        it("should identify image files correctly", () => {
            // Access private method for testing
            const isImageFile = (service as any).isImageFile;

            expect(isImageFile("image/jpeg")).toBe(true);
            expect(isImageFile("image/png")).toBe(true);
            expect(isImageFile("image/gif")).toBe(true);
            expect(isImageFile("text/plain")).toBe(false);
            expect(isImageFile("application/pdf")).toBe(false);
        });

        it("should extract metadata tags correctly", () => {
            const extractMetadataTags = (service as any).extractMetadataTags;

            const metadata = {
                "content-type": "image/jpeg",
                "x-amz-meta-original-name": "test%20file.jpg",
                "x-amz-meta-business": encodeURIComponent("documents"),
                "other-header": "value",
            };

            const tags = extractMetadataTags(metadata);

            expect(tags).toEqual({
                "original-name": "test file.jpg",
                business: "documents",
            });
        });
    });
});

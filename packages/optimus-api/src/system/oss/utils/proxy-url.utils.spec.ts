import { ProxyUrlUtils, ProxyUrlService } from "./proxy-url.utils";

describe("ProxyUrlUtils", () => {
    describe("generateProxyUrl", () => {
        it("should generate basic proxy URL", () => {
            const fileKey = "documents/test.pdf";
            const url = ProxyUrlUtils.generateProxyUrl(fileKey);

            expect(url).toBe("/api/files/file/documents/test.pdf");
        });

        it("should generate proxy URL with download parameter", () => {
            const fileKey = "documents/test.pdf";
            const url = ProxyUrlUtils.generateProxyUrl(fileKey, { download: true });

            expect(url).toBe("/api/files/file/documents/test.pdf?download=true");
        });

        it("should generate proxy URL with inline parameter", () => {
            const fileKey = "images/photo.jpg";
            const url = ProxyUrlUtils.generateProxyUrl(fileKey, { inline: true });

            expect(url).toBe("/api/files/file/images/photo.jpg?inline=true");
        });

        it("should generate proxy URL with both download and inline parameters", () => {
            const fileKey = "documents/test.pdf";
            const url = ProxyUrlUtils.generateProxyUrl(fileKey, {
                download: true,
                inline: true,
            });

            expect(url).toBe("/api/files/file/documents/test.pdf?download=true&inline=true");
        });

        it("should generate secure proxy URL", () => {
            const fileKey = "private/confidential.doc";
            const url = ProxyUrlUtils.generateProxyUrl(fileKey, { secure: true });

            expect(url).toBe("/api/files/secure/private/confidential.doc");
        });

        it("should handle custom base URL", () => {
            const fileKey = "documents/test.pdf";
            const url = ProxyUrlUtils.generateProxyUrl(fileKey, {
                baseUrl: "https://example.com/api",
            });

            expect(url).toBe("https://example.com/api/files/file/documents/test.pdf");
        });

        it("should clean up file key with leading slashes", () => {
            const fileKey = "/documents/test.pdf";
            const url = ProxyUrlUtils.generateProxyUrl(fileKey);

            expect(url).toBe("/api/files/file/documents/test.pdf");
        });

        it("should clean up base URL with trailing slashes", () => {
            const fileKey = "documents/test.pdf";
            const url = ProxyUrlUtils.generateProxyUrl(fileKey, {
                baseUrl: "/api/",
            });

            expect(url).toBe("/api/files/file/documents/test.pdf");
        });
    });

    describe("generateFileProxyUrl", () => {
        it("should generate file proxy URL with provider", () => {
            const provider = "aliyun";
            const fileKey = "documents/test.pdf";
            const url = ProxyUrlUtils.generateFileProxyUrl(provider, fileKey);

            expect(url).toBe("/api/proxy/files/aliyun/documents/test.pdf");
        });

        it("should generate file proxy URL with MinIO provider", () => {
            const provider = "minio";
            const fileKey = "images/photo.jpg";
            const url = ProxyUrlUtils.generateFileProxyUrl(provider, fileKey);

            expect(url).toBe("/api/proxy/files/minio/images/photo.jpg");
        });

        it("should generate file proxy URL with parameters", () => {
            const provider = "aliyun";
            const fileKey = "documents/test.pdf";
            const url = ProxyUrlUtils.generateFileProxyUrl(provider, fileKey, {
                download: true,
                inline: true,
            });

            expect(url).toBe("/api/proxy/files/aliyun/documents/test.pdf?download=true&inline=true");
        });

        it("should throw error for invalid provider", () => {
            const provider = "invalid";
            const fileKey = "documents/test.pdf";

            expect(() => {
                ProxyUrlUtils.generateFileProxyUrl(provider, fileKey);
            }).toThrow("Unsupported provider: invalid");
        });
    });

    describe("generateTemporaryUrl", () => {
        it("should generate temporary URL", () => {
            const fileKey = "documents/test.pdf";
            const url = ProxyUrlUtils.generateTemporaryUrl(fileKey);

            expect(url).toBe("/api/proxy/temporary/documents/test.pdf");
        });

        it("should generate temporary URL with expiration", () => {
            const fileKey = "documents/test.pdf";
            const expiresIn = 3600;
            const url = ProxyUrlUtils.generateTemporaryUrl(fileKey, expiresIn);

            expect(url).toBe("/api/proxy/temporary/documents/test.pdf?expiresIn=3600");
        });

        it("should ignore zero or negative expiration", () => {
            const fileKey = "documents/test.pdf";
            const url = ProxyUrlUtils.generateTemporaryUrl(fileKey, 0);

            expect(url).toBe("/api/proxy/temporary/documents/test.pdf");
        });
    });

    describe("generateThumbnailProxyUrl", () => {
        it("should generate thumbnail proxy URL", () => {
            const fileKey = "images/photo.jpg";
            const url = ProxyUrlUtils.generateThumbnailProxyUrl(fileKey);

            expect(url).toBe("/api/files/file/thumbnails/thumb_photo.jpg");
        });

        it("should handle nested file paths", () => {
            const fileKey = "uploads/2024/images/photo.jpg";
            const url = ProxyUrlUtils.generateThumbnailProxyUrl(fileKey);

            expect(url).toBe("/api/files/file/thumbnails/thumb_photo.jpg");
        });
    });

    describe("generateThumbnailFileProxyUrl", () => {
        it("should generate thumbnail file proxy URL", () => {
            const provider = "aliyun";
            const fileKey = "images/photo.jpg";
            const url = ProxyUrlUtils.generateThumbnailFileProxyUrl(provider, fileKey);

            expect(url).toBe("/api/proxy/files/aliyun/thumbnails/thumb_photo.jpg");
        });
    });

    describe("extractFileKeyFromProxyUrl", () => {
        it("should extract file key from OSS file URL", () => {
            const proxyUrl = "/api/files/file/documents/test.pdf";
            const fileKey = ProxyUrlUtils.extractFileKeyFromProxyUrl(proxyUrl);

            expect(fileKey).toBe("documents/test.pdf");
        });

        it("should extract file key from OSS secure URL", () => {
            const proxyUrl = "/api/files/secure/private/confidential.doc";
            const fileKey = ProxyUrlUtils.extractFileKeyFromProxyUrl(proxyUrl);

            expect(fileKey).toBe("private/confidential.doc");
        });

        it("should extract file key from file proxy URL", () => {
            const proxyUrl = "/api/proxy/files/aliyun/documents/test.pdf";
            const fileKey = ProxyUrlUtils.extractFileKeyFromProxyUrl(proxyUrl);

            expect(fileKey).toBe("documents/test.pdf");
        });

        it("should extract file key from temporary URL", () => {
            const proxyUrl = "/api/proxy/temporary/documents/test.pdf?expiresIn=3600";
            const fileKey = ProxyUrlUtils.extractFileKeyFromProxyUrl(proxyUrl);

            expect(fileKey).toBe("documents/test.pdf");
        });

        it("should return null for invalid URL", () => {
            const proxyUrl = "/invalid/url/path";
            const fileKey = ProxyUrlUtils.extractFileKeyFromProxyUrl(proxyUrl);

            expect(fileKey).toBeNull();
        });

        it("should handle URL encoded file keys", () => {
            const proxyUrl = "/api/files/file/documents/test%20file.pdf";
            const fileKey = ProxyUrlUtils.extractFileKeyFromProxyUrl(proxyUrl);

            expect(fileKey).toBe("documents/test file.pdf");
        });
    });

    describe("isProxyUrl", () => {
        it("should identify OSS file URLs as proxy URLs", () => {
            const url = "/api/files/file/documents/test.pdf";
            expect(ProxyUrlUtils.isProxyUrl(url)).toBe(true);
        });

        it("should identify OSS secure URLs as proxy URLs", () => {
            const url = "/api/files/secure/private/confidential.doc";
            expect(ProxyUrlUtils.isProxyUrl(url)).toBe(true);
        });

        it("should identify file proxy URLs as proxy URLs", () => {
            const url = "/api/proxy/files/aliyun/documents/test.pdf";
            expect(ProxyUrlUtils.isProxyUrl(url)).toBe(true);
        });

        it("should identify temporary URLs as proxy URLs", () => {
            const url = "/api/proxy/temporary/documents/test.pdf";
            expect(ProxyUrlUtils.isProxyUrl(url)).toBe(true);
        });

        it("should not identify direct OSS URLs as proxy URLs", () => {
            const url = "https://bucket.region.aliyuncs.com/documents/test.pdf";
            expect(ProxyUrlUtils.isProxyUrl(url)).toBe(false);
        });

        it("should not identify regular URLs as proxy URLs", () => {
            const url = "/api/users/profile";
            expect(ProxyUrlUtils.isProxyUrl(url)).toBe(false);
        });
    });

    describe("validation", () => {
        it("should throw error for empty file key", () => {
            expect(() => {
                ProxyUrlUtils.generateProxyUrl("");
            }).toThrow("File key must be a non-empty string");
        });

        it("should throw error for file key with path traversal", () => {
            expect(() => {
                ProxyUrlUtils.generateProxyUrl("../../../etc/passwd");
            }).toThrow("Invalid file key: path traversal detected");
        });

        it("should throw error for file key with dangerous characters", () => {
            expect(() => {
                ProxyUrlUtils.generateProxyUrl("file<script>alert(1)</script>.pdf");
            }).toThrow("Invalid file key: contains dangerous characters");
        });

        it("should throw error for too long file key", () => {
            const longFileKey = "a".repeat(1025);
            expect(() => {
                ProxyUrlUtils.generateProxyUrl(longFileKey);
            }).toThrow("File key is too long (max 1024 characters)");
        });

        it("should throw error for empty provider", () => {
            expect(() => {
                ProxyUrlUtils.generateFileProxyUrl("", "test.pdf");
            }).toThrow("Provider must be a non-empty string");
        });
    });
});

describe("ProxyUrlService", () => {
    let service: ProxyUrlService;

    beforeEach(() => {
        service = new ProxyUrlService();
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });

    it("should generate proxy URL", () => {
        const fileKey = "documents/test.pdf";
        const url = service.generateProxyUrl(fileKey);

        expect(url).toBe("/api/files/file/documents/test.pdf");
    });

    it("should generate file proxy URL", () => {
        const provider = "aliyun";
        const fileKey = "documents/test.pdf";
        const url = service.generateFileProxyUrl(provider, fileKey);

        expect(url).toBe("/api/proxy/files/aliyun/documents/test.pdf");
    });

    it("should generate temporary URL", () => {
        const fileKey = "documents/test.pdf";
        const url = service.generateTemporaryUrl(fileKey);

        expect(url).toBe("/api/proxy/temporary/documents/test.pdf");
    });

    it("should generate thumbnail proxy URL", () => {
        const fileKey = "images/photo.jpg";
        const url = service.generateThumbnailProxyUrl(fileKey);

        expect(url).toBe("/api/files/file/thumbnails/thumb_photo.jpg");
    });

    it("should extract file key from proxy URL", () => {
        const proxyUrl = "/api/files/file/documents/test.pdf";
        const fileKey = service.extractFileKeyFromProxyUrl(proxyUrl);

        expect(fileKey).toBe("documents/test.pdf");
    });

    it("should check if URL is proxy URL", () => {
        const url = "/api/files/file/documents/test.pdf";
        expect(service.isProxyUrl(url)).toBe(true);
    });
});

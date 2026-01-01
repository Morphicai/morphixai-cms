import { StoragePathUtils, AccessType } from "./storage-path.utils";

describe("StoragePathUtils", () => {
    describe("generatePath", () => {
        it("应该生成标准的私有文件路径", () => {
            const path = StoragePathUtils.generatePath({
                environment: "dev",
                accessType: AccessType.PRIVATE,
                business: "user",
                fileName: "abc123.jpg",
            });

            expect(path).toBe("dev/private/user/abc123.jpg");
        });

        it("应该生成标准的公开文件路径", () => {
            const path = StoragePathUtils.generatePath({
                environment: "prod",
                accessType: AccessType.PUBLIC,
                business: "product",
                fileName: "def456.png",
            });

            expect(path).toBe("prod/public/product/def456.png");
        });

        it("应该使用默认值生成路径", () => {
            const path = StoragePathUtils.generatePath({
                fileName: "test.jpg",
            });

            // 默认: dev环境, private权限, common业务
            expect(path).toMatch(/^(dev|test|production)\/private\/common\/test\.jpg$/);
        });

        it("应该生成缩略图路径", () => {
            const path = StoragePathUtils.generatePath({
                environment: "dev",
                accessType: AccessType.PRIVATE,
                business: "user",
                fileName: "abc123.jpg",
                isThumbnail: true,
            });

            expect(path).toBe("dev/private/user/thumbnails/thumb_abc123.jpg");
        });

        it("应该支持路径前缀", () => {
            const path = StoragePathUtils.generatePath({
                pathPrefix: "uploads",
                environment: "dev",
                accessType: AccessType.PRIVATE,
                business: "user",
                fileName: "abc123.jpg",
            });

            expect(path).toBe("uploads/dev/private/user/abc123.jpg");
        });

        it("应该处理前缀中的斜杠", () => {
            const path = StoragePathUtils.generatePath({
                pathPrefix: "/uploads/",
                environment: "dev",
                accessType: AccessType.PRIVATE,
                business: "user",
                fileName: "abc123.jpg",
            });

            expect(path).toBe("uploads/dev/private/user/abc123.jpg");
        });
    });

    describe("extractFileName", () => {
        it("应该从完整路径中提取文件名", () => {
            const fileName = StoragePathUtils.extractFileName("dev/private/user/abc123.jpg");
            expect(fileName).toBe("abc123.jpg");
        });

        it("应该从缩略图路径中提取文件名", () => {
            const fileName = StoragePathUtils.extractFileName("dev/private/user/thumbnails/thumb_abc123.jpg");
            expect(fileName).toBe("thumb_abc123.jpg");
        });
    });

    describe("parsePathInfo", () => {
        it("应该解析完整路径信息", () => {
            const info = StoragePathUtils.parsePathInfo("dev/private/user/abc123.jpg");

            expect(info).toEqual({
                environment: "dev",
                accessType: "private",
                business: "user",
                fileName: "abc123.jpg",
                isThumbnail: false,
            });
        });

        it("应该解析缩略图路径信息", () => {
            const info = StoragePathUtils.parsePathInfo("prod/public/product/thumbnails/thumb_def456.jpg");

            expect(info).toEqual({
                environment: "prod",
                accessType: "public",
                business: "product",
                fileName: "thumb_def456.jpg",
                isThumbnail: true,
            });
        });

        it("应该处理不完整的路径", () => {
            const info = StoragePathUtils.parsePathInfo("abc123.jpg");

            expect(info).toEqual({
                fileName: "abc123.jpg",
                isThumbnail: false,
            });
        });

        it("应该识别thumb_前缀的缩略图", () => {
            const info = StoragePathUtils.parsePathInfo("thumb_abc123.jpg");

            expect(info.isThumbnail).toBe(true);
        });
    });

    describe("generateThumbnailPath", () => {
        it("应该基于原文件路径生成缩略图路径", () => {
            const thumbnailPath = StoragePathUtils.generateThumbnailPath("dev/private/user/abc123.jpg");

            expect(thumbnailPath).toBe("dev/private/user/thumbnails/thumb_abc123.jpg");
        });

        it("应该处理已有thumb_前缀的文件名", () => {
            const thumbnailPath = StoragePathUtils.generateThumbnailPath("dev/private/user/thumb_abc123.jpg");

            expect(thumbnailPath).toBe("dev/private/user/thumbnails/thumb_abc123.jpg");
        });
    });

    describe("isValidPath", () => {
        it("应该验证有效的路径", () => {
            expect(StoragePathUtils.isValidPath("dev/private/user/abc123.jpg")).toBe(true);
            expect(StoragePathUtils.isValidPath("prod/public/product/def456.png")).toBe(true);
        });

        it("应该验证缩略图路径", () => {
            expect(StoragePathUtils.isValidPath("dev/private/user/thumbnails/thumb_abc123.jpg")).toBe(true);
        });

        it("应该拒绝无效的路径", () => {
            expect(StoragePathUtils.isValidPath("")).toBe(false);
            expect(StoragePathUtils.isValidPath("abc123.jpg")).toBe(false);
            expect(StoragePathUtils.isValidPath("dev/user/abc123.jpg")).toBe(false);
        });

        it("应该拒绝无效的权限类型", () => {
            expect(StoragePathUtils.isValidPath("dev/invalid/user/abc123.jpg")).toBe(false);
        });
    });

    describe("normalizePath", () => {
        it("应该移除多余的斜杠", () => {
            const path = StoragePathUtils.normalizePath("dev//private///user/abc123.jpg");
            expect(path).toBe("dev/private/user/abc123.jpg");
        });

        it("应该移除首尾斜杠", () => {
            const path = StoragePathUtils.normalizePath("/dev/private/user/abc123.jpg/");
            expect(path).toBe("dev/private/user/abc123.jpg");
        });
    });
});

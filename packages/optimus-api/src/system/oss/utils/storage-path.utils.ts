/**
 * 存储路径工具类
 * 用于生成统一的文件存储路径结构
 */

/**
 * 权限类型枚举
 */
export enum AccessType {
    /** 私有文件 */
    PRIVATE = "private",
    /** 公开文件 */
    PUBLIC = "public",
}

/**
 * 路径生成选项
 */
export interface PathOptions {
    /** 环境标识 (dev/test/prod) */
    environment?: string;
    /** 权限类型 (private/public) */
    accessType?: AccessType;
    /** 业务标识 */
    business?: string;
    /** 文件名 */
    fileName: string;
    /** 是否为缩略图 */
    isThumbnail?: boolean;
    /** 路径前缀（从环境变量读取） */
    pathPrefix?: string;
}

/**
 * 存储路径工具类
 */
export class StoragePathUtils {
    /**
     * 生成标准化的存储路径
     * 格式: {前缀}/{环境}/{权限类型}/{业务标识}/{文件名}
     *
     * @param options 路径选项
     * @returns 完整的存储路径
     *
     * @example
     * // 生成私有文件路径
     * StoragePathUtils.generatePath({
     *   environment: 'dev',
     *   accessType: AccessType.PRIVATE,
     *   business: 'user',
     *   fileName: 'abc123.jpg'
     * })
     * // 返回: "dev/private/user/abc123.jpg"
     *
     * @example
     * // 生成缩略图路径
     * StoragePathUtils.generatePath({
     *   environment: 'prod',
     *   accessType: AccessType.PUBLIC,
     *   business: 'product',
     *   fileName: 'def456.jpg',
     *   isThumbnail: true
     * })
     * // 返回: "prod/public/product/thumbnails/thumb_def456.jpg"
     */
    static generatePath(options: PathOptions): string {
        const {
            environment = process.env.NODE_ENV || "dev",
            accessType = AccessType.PRIVATE,
            business = "common",
            fileName,
            isThumbnail = false,
            pathPrefix = "",
        } = options;

        // 构建路径段
        const segments: string[] = [];

        // 添加前缀（如果有）
        if (pathPrefix) {
            segments.push(pathPrefix.replace(/^\/+|\/+$/g, ""));
        }

        // 添加环境标识
        segments.push(environment);

        // 添加权限类型
        segments.push(accessType);

        // 添加业务标识
        segments.push(business);

        // 如果是缩略图，添加 thumbnails 子目录
        if (isThumbnail) {
            segments.push("thumbnails");
        }

        // 添加文件名（缩略图添加前缀）
        const finalFileName = isThumbnail ? `thumb_${fileName}` : fileName;
        segments.push(finalFileName);

        // 组合路径，确保没有重复的斜杠
        return segments.join("/");
    }

    /**
     * 从完整路径中提取文件名
     *
     * @param fullPath 完整路径
     * @returns 文件名
     *
     * @example
     * StoragePathUtils.extractFileName('dev/private/user/abc123.jpg')
     * // 返回: "abc123.jpg"
     */
    static extractFileName(fullPath: string): string {
        const segments = fullPath.split("/");
        return segments[segments.length - 1];
    }

    /**
     * 从完整路径中提取路径信息
     *
     * @param fullPath 完整路径
     * @returns 路径信息对象
     *
     * @example
     * StoragePathUtils.parsePathInfo('dev/private/user/abc123.jpg')
     * // 返回: { environment: 'dev', accessType: 'private', business: 'user', fileName: 'abc123.jpg' }
     */
    static parsePathInfo(fullPath: string): {
        environment?: string;
        accessType?: string;
        business?: string;
        fileName: string;
        isThumbnail: boolean;
    } {
        const segments = fullPath.split("/").filter((s) => s);

        // 至少需要文件名
        if (segments.length === 0) {
            return {
                fileName: "",
                isThumbnail: false,
            };
        }

        const fileName = segments[segments.length - 1];
        const isThumbnail = fileName.startsWith("thumb_") || segments.includes("thumbnails");

        // 根据路径段数量解析
        if (segments.length >= 4) {
            // 完整路径: environment/accessType/business/fileName
            // 或: environment/accessType/business/thumbnails/fileName
            const hasThumbnailDir = segments.includes("thumbnails");
            const baseIndex = hasThumbnailDir ? segments.length - 5 : segments.length - 4;

            return {
                environment: segments[baseIndex] || undefined,
                accessType: segments[baseIndex + 1] || undefined,
                business: segments[baseIndex + 2] || undefined,
                fileName,
                isThumbnail,
            };
        }

        // 路径不完整，只返回文件名
        return {
            fileName,
            isThumbnail,
        };
    }

    /**
     * 生成缩略图路径（基于原文件路径）
     *
     * @param originalPath 原文件路径
     * @returns 缩略图路径
     *
     * @example
     * StoragePathUtils.generateThumbnailPath('dev/private/user/abc123.jpg')
     * // 返回: "dev/private/user/thumbnails/thumb_abc123.jpg"
     */
    static generateThumbnailPath(originalPath: string): string {
        const pathInfo = this.parsePathInfo(originalPath);

        return this.generatePath({
            environment: pathInfo.environment,
            accessType: pathInfo.accessType as AccessType,
            business: pathInfo.business,
            fileName: pathInfo.fileName.replace(/^thumb_/, ""), // 移除可能存在的前缀
            isThumbnail: true,
        });
    }

    /**
     * 验证路径格式是否正确
     *
     * @param path 路径
     * @returns 是否有效
     */
    static isValidPath(path: string): boolean {
        if (!path) return false;

        const segments = path.split("/").filter((s) => s);

        // 至少需要 environment/accessType/business/fileName
        if (segments.length < 4) return false;

        // 验证权限类型
        const accessTypeIndex =
            segments.length >= 5 && segments.includes("thumbnails") ? segments.length - 4 : segments.length - 3;

        const accessType = segments[accessTypeIndex];
        return accessType === AccessType.PRIVATE || accessType === AccessType.PUBLIC;
    }

    /**
     * 标准化路径（移除多余的斜杠）
     *
     * @param path 路径
     * @returns 标准化后的路径
     */
    static normalizePath(path: string): string {
        return path
            .replace(/\/+/g, "/") // 替换多个斜杠为单个
            .replace(/^\/+|\/+$/g, ""); // 移除首尾斜杠
    }
}

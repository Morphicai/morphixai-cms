import { Injectable } from "@nestjs/common";

/**
 * 代理 URL 生成选项
 */
export interface ProxyUrlOptions {
    /** 是否下载文件 */
    download?: boolean;
    /** 是否内联显示 */
    inline?: boolean;
    /** 自定义基础 URL，可选 */
    baseUrl?: string;
    /** 是否使用安全访问（需要身份验证） */
    secure?: boolean;
}

/**
 * 代理 URL 工具类
 * 提供快速生成文件代理访问 URL 的功能
 */
export class ProxyUrlUtils {
    /** 默认基础 URL 前缀 */
    private static readonly DEFAULT_BASE_URL = "/api";

    /** 文件代理路径（FileProxyController） */
    private static readonly PROXY_PATH = "/proxy/file";

    /** OSS 控制器文件访问路径 */
    private static readonly OSS_FILE_PATH = "/files/file";

    /** OSS 控制器安全访问路径 */
    private static readonly OSS_SECURE_PATH = "/files/secure";

    /**
     * 生成文件代理访问 URL
     * @param fileKey 文件键名
     * @param options 代理 URL 选项
     * @returns 代理访问 URL
     */
    static generateProxyUrl(fileKey: string, options: ProxyUrlOptions = {}): string {
        // 验证文件键名
        this.validateFileKey(fileKey);

        const { download = false, inline = false, baseUrl = this.DEFAULT_BASE_URL, secure = false } = options;

        // 选择访问路径
        const accessPath = secure ? this.OSS_SECURE_PATH : this.OSS_FILE_PATH;

        // 构建基础 URL
        const cleanBaseUrl = baseUrl.replace(/\/$/, ""); // 移除末尾斜杠
        const cleanFileKey = fileKey.replace(/^\/+/, ""); // 移除开头斜杠

        let url = `${cleanBaseUrl}${accessPath}/${cleanFileKey}`;

        // 添加查询参数
        const queryParams: string[] = [];

        if (download) {
            queryParams.push("download=true");
        }

        if (inline) {
            queryParams.push("inline=true");
        }

        // 拼接查询参数
        if (queryParams.length > 0) {
            url += `?${queryParams.join("&")}`;
        }

        return url;
    }

    /**
     * 生成文件代理访问 URL（使用 FileProxyController）
     * @param provider OSS 提供商
     * @param fileKey 文件键名
     * @param options 代理 URL 选项
     * @returns 代理访问 URL
     */
    static generateFileProxyUrl(provider: string, fileKey: string, options: ProxyUrlOptions = {}): string {
        // 验证参数
        this.validateProvider(provider);
        this.validateFileKey(fileKey);

        const { download = false, inline = false, baseUrl = this.DEFAULT_BASE_URL } = options;

        // 构建基础 URL
        const cleanBaseUrl = baseUrl.replace(/\/$/, ""); // 移除末尾斜杠
        const cleanFileKey = fileKey.replace(/^\/+/, ""); // 移除开头斜杠

        // FileProxyController 的路由是 /proxy/file/{fileKey}?provider={provider}
        let url = `${cleanBaseUrl}${this.PROXY_PATH}/${cleanFileKey}`;

        // 添加查询参数
        const queryParams: string[] = [];

        // 添加 provider 参数
        queryParams.push(`provider=${provider}`);

        if (download) {
            queryParams.push("download=true");
        }

        if (inline) {
            queryParams.push("inline=true");
        }

        // 拼接查询参数
        if (queryParams.length > 0) {
            url += `?${queryParams.join("&")}`;
        }

        return url;
    }

    /**
     * 生成临时访问 URL
     * @param fileKey 文件键名
     * @param expiresIn 过期时间（秒），可选
     * @param options 代理 URL 选项
     * @returns 临时访问 URL
     */
    static generateTemporaryUrl(fileKey: string, expiresIn?: number, options: ProxyUrlOptions = {}): string {
        // 验证文件键名
        this.validateFileKey(fileKey);

        const { baseUrl = this.DEFAULT_BASE_URL } = options;

        // 构建基础 URL
        const cleanBaseUrl = baseUrl.replace(/\/$/, ""); // 移除末尾斜杠
        const cleanFileKey = fileKey.replace(/^\/+/, ""); // 移除开头斜杠

        let url = `${cleanBaseUrl}/proxy/temporary/${cleanFileKey}`;

        // 添加过期时间参数
        if (expiresIn && expiresIn > 0) {
            url += `?expiresIn=${expiresIn}`;
        }

        return url;
    }

    /**
     * 生成缩略图代理 URL
     * @param fileKey 原始文件键名
     * @param options 代理 URL 选项
     * @returns 缩略图代理 URL
     */
    static generateThumbnailProxyUrl(fileKey: string, options: ProxyUrlOptions = {}): string {
        // 从原始文件键名生成缩略图键名
        const fileName = fileKey.split("/").pop() || fileKey;
        const thumbnailKey = `thumbnails/thumb_${fileName}`;

        return this.generateProxyUrl(thumbnailKey, options);
    }

    /**
     * 生成缩略图代理 URL（使用 FileProxyController）
     * @param provider OSS 提供商
     * @param fileKey 原始文件键名
     * @param options 代理 URL 选项
     * @returns 缩略图代理 URL
     */
    static generateThumbnailFileProxyUrl(provider: string, fileKey: string, options: ProxyUrlOptions = {}): string {
        // 从原始文件键名生成缩略图键名
        const fileName = fileKey.split("/").pop() || fileKey;
        const thumbnailKey = `thumbnails/thumb_${fileName}`;

        return this.generateFileProxyUrl(provider, thumbnailKey, options);
    }

    /**
     * 从代理 URL 中提取文件键名
     * @param proxyUrl 代理 URL
     * @returns 文件键名，如果无法提取则返回 null
     */
    static extractFileKeyFromProxyUrl(proxyUrl: string): string | null {
        try {
            // 移除查询参数
            const urlWithoutQuery = proxyUrl.split("?")[0];

            // 使用简单的字符串匹配而不是正则表达式，避免转义问题
            const pathMappings = [
                { prefix: this.OSS_FILE_PATH + "/", name: "OSS_FILE_PATH" },
                { prefix: this.OSS_SECURE_PATH + "/", name: "OSS_SECURE_PATH" },
                { prefix: this.PROXY_PATH + "/", name: "PROXY_PATH" },
                { prefix: "/proxy/temporary/", name: "TEMPORARY_PATH" },
            ];

            for (const mapping of pathMappings) {
                const index = urlWithoutQuery.lastIndexOf(mapping.prefix);
                if (index !== -1) {
                    const fileKey = urlWithoutQuery.substring(index + mapping.prefix.length);
                    if (fileKey) {
                        return decodeURIComponent(fileKey);
                    }
                }
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * 检查 URL 是否为代理 URL
     * @param url URL 字符串
     * @returns 是否为代理 URL
     */
    static isProxyUrl(url: string): boolean {
        const proxyPatterns = [this.OSS_FILE_PATH, this.OSS_SECURE_PATH, this.PROXY_PATH, "/proxy/temporary"];

        return proxyPatterns.some((pattern) => url.includes(pattern));
    }

    /**
     * 转义正则表达式特殊字符
     * @param string 要转义的字符串
     * @returns 转义后的字符串
     */
    private static escapeRegExp(string: string): string {
        return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    /**
     * 验证文件键名
     * @param fileKey 文件键名
     */
    private static validateFileKey(fileKey: string): void {
        if (!fileKey || typeof fileKey !== "string") {
            throw new Error("File key must be a non-empty string");
        }

        // 防止路径遍历攻击
        if (fileKey.includes("..") || fileKey.includes("//")) {
            throw new Error("Invalid file key: path traversal detected");
        }

        // 检查危险字符
        const dangerousChars = /[<>:"|?*\x00-\x1F]/;
        if (dangerousChars.test(fileKey)) {
            throw new Error("Invalid file key: contains dangerous characters");
        }

        // 检查文件键名长度
        if (fileKey.length > 1024) {
            throw new Error("File key is too long (max 1024 characters)");
        }
    }

    /**
     * 验证存储提供商
     * @param provider 存储提供商
     */
    private static validateProvider(provider: string): void {
        if (!provider || typeof provider !== "string") {
            throw new Error("Provider must be a non-empty string");
        }

        // 检查支持的提供商
        const supportedProviders = ["aliyun", "minio"];
        if (!supportedProviders.includes(provider.toLowerCase())) {
            throw new Error(`Unsupported provider: ${provider}. Supported providers: ${supportedProviders.join(", ")}`);
        }
    }
}

/**
 * 代理 URL 服务（可注入版本）
 * 提供与 ProxyUrlUtils 相同的功能，但可以作为服务注入使用
 */
@Injectable()
export class ProxyUrlService {
    /**
     * 生成文件代理访问 URL
     */
    generateProxyUrl(fileKey: string, options: ProxyUrlOptions = {}): string {
        return ProxyUrlUtils.generateProxyUrl(fileKey, options);
    }

    /**
     * 生成文件代理访问 URL（使用 FileProxyController）
     */
    generateFileProxyUrl(provider: string, fileKey: string, options: ProxyUrlOptions = {}): string {
        return ProxyUrlUtils.generateFileProxyUrl(provider, fileKey, options);
    }

    /**
     * 生成临时访问 URL
     */
    generateTemporaryUrl(fileKey: string, expiresIn?: number, options: ProxyUrlOptions = {}): string {
        return ProxyUrlUtils.generateTemporaryUrl(fileKey, expiresIn, options);
    }

    /**
     * 生成缩略图代理 URL
     */
    generateThumbnailProxyUrl(fileKey: string, options: ProxyUrlOptions = {}): string {
        return ProxyUrlUtils.generateThumbnailProxyUrl(fileKey, options);
    }

    /**
     * 生成缩略图代理 URL（使用 FileProxyController）
     */
    generateThumbnailFileProxyUrl(provider: string, fileKey: string, options: ProxyUrlOptions = {}): string {
        return ProxyUrlUtils.generateThumbnailFileProxyUrl(provider, fileKey, options);
    }

    /**
     * 从代理 URL 中提取文件键名
     */
    extractFileKeyFromProxyUrl(proxyUrl: string): string | null {
        return ProxyUrlUtils.extractFileKeyFromProxyUrl(proxyUrl);
    }

    /**
     * 检查 URL 是否为代理 URL
     */
    isProxyUrl(url: string): boolean {
        return ProxyUrlUtils.isProxyUrl(url);
    }
}

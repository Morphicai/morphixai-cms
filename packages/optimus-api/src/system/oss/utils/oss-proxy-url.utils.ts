import { Logger } from "@nestjs/common";

/**
 * 生成代理URL的选项接口
 */
export interface GenerateProxyUrlOptions {
    /** 存储提供商 */
    provider: string;
    /** Logger 实例（可选），用于记录警告信息 */
    logger?: Logger;
}

/**
 * OSS 文件代理 URL 工具类
 * 提供 /OSS_FILE_PROXY/ 格式 URL 的转换和处理功能
 */
export class OssProxyUrlUtils {
    private static readonly logger = new Logger(OssProxyUrlUtils.name);
    private static envPathCache: string | null = null;
    private static envPathInitialized = false;

    /**
     * 获取 API 代理文件路径（内部方法）
     * 从环境变量 REACT_APP_FILE_API_PREFIX 读取，如果未设置则使用默认值 /api/proxy/file/
     * 同时用作 OSS_FILE_PROXY_PREFIX 的值
     * @returns API 代理文件路径
     */
    private static getApiProxyPathInternal(): string {
        // 只在首次调用时记录日志，避免重复输出
        if (!this.envPathInitialized) {
            // 尝试多种方式读取环境变量
            const envPath = process.env.REACT_APP_FILE_API_PREFIX;

            // 诊断信息：检查所有可能的环境变量
            const allEnvKeys = Object.keys(process.env).filter((k) => k.includes("FILE_API") || k.includes("PROXY"));
            const nodeEnv = process.env.NODE_ENV;

            this.logger.log("=== OSS Proxy URL Utils 环境变量检查 ===");
            this.logger.log(`NODE_ENV: ${nodeEnv || "(未设置)"}`);
            this.logger.log(`环境变量名: REACT_APP_FILE_API_PREFIX`);
            this.logger.log(`环境变量原始值: ${envPath || "(未设置)"}`);
            this.logger.log(`环境变量类型: ${typeof envPath}`);
            this.logger.log(`所有包含 FILE_API 或 PROXY 的环境变量: ${JSON.stringify(allEnvKeys)}`);

            // 如果环境变量未设置，尝试从其他可能的变量名读取
            let finalEnvPath = envPath;
            if (!finalEnvPath) {
                // 尝试其他可能的变量名
                const alternativeNames = ["FILE_API_PREFIX", "API_FILE_PROXY_PREFIX", "OSS_FILE_PROXY_PREFIX"];
                for (const altName of alternativeNames) {
                    if (process.env[altName]) {
                        this.logger.warn(`使用替代环境变量名: ${altName} = ${process.env[altName]}`);
                        finalEnvPath = process.env[altName];
                        break;
                    }
                }
            }

            if (finalEnvPath) {
                // 规范化路径
                let normalizedPath = finalEnvPath.trim();
                const originalPath = normalizedPath;

                // 检查是否是完整URL（http:// 或 https://）
                const isFullUrl = normalizedPath.startsWith("http://") || normalizedPath.startsWith("https://");

                if (isFullUrl) {
                    // 如果是完整URL，确保以 / 结尾（用于拼接路径）
                    if (!normalizedPath.endsWith("/")) {
                        normalizedPath = normalizedPath + "/";
                        this.logger.log(`完整URL规范化: 添加尾随斜杠 "${originalPath}" -> "${normalizedPath}"`);
                    }
                    this.logger.log(`检测到完整URL格式，将作为基础URL使用: "${normalizedPath}"`);
                } else {
                    // 如果是相对路径，确保以 / 开头和结尾
                    if (!normalizedPath.startsWith("/")) {
                        normalizedPath = "/" + normalizedPath;
                        this.logger.log(`路径规范化: 添加前导斜杠 "${originalPath}" -> "${normalizedPath}"`);
                    }
                    if (!normalizedPath.endsWith("/")) {
                        normalizedPath = normalizedPath + "/";
                        this.logger.log(
                            `路径规范化: 添加尾随斜杠 "${normalizedPath.slice(0, -1)}" -> "${normalizedPath}"`,
                        );
                    }
                }

                this.envPathCache = normalizedPath;
                this.logger.log(`最终使用的代理路径: "${normalizedPath}"`);
            } else {
                const defaultPath = "/api/proxy/file/";
                this.envPathCache = defaultPath;
                this.logger.warn(`环境变量未设置，使用默认值: "${defaultPath}"`);
            }

            this.logger.log("========================================");
            this.envPathInitialized = true;
        }

        return this.envPathCache || "/api/proxy/file/";
    }

    /**
     * 获取存储格式的 OSS 代理前缀标识
     * 返回固定的 /OSS_FILE_PROXY/ 标识，用于数据库存储
     *
     * 注意：这与 getApiProxyPathInternal() 不同
     * - getOssProxyPrefixInternal()：返回固定的 /OSS_FILE_PROXY/（用于数据库存储）
     * - getApiProxyPathInternal()：返回环境变量配置的路径（用于实际访问）
     *
     * @returns OSS 文件代理前缀：/OSS_FILE_PROXY/
     */
    private static getOssProxyPrefixInternal(): string {
        return "/OSS_FILE_PROXY/";
    }

    /**
     * 将文件键名或代理前缀格式的URL转换为代理访问 URL
     * @param fileKeyOrUrl 文件键名或包含代理前缀的URL
     * @param options 生成选项
     * @returns 代理访问 URL（相对路径格式）
     *
     * @example
     * // 从代理前缀格式转换
     * generateProxyUrl('/api/proxy/file/production/private/test.png?provider=minio', {
     *   provider: 'minio'
     * })
     * // => '/api/proxy/file/production%2Fprivate%2Ftest.png?provider=minio'
     *
     * @example
     * // 从 fileKey 转换
     * generateProxyUrl('production/private/test.png', {
     *   provider: 'minio'
     * })
     * // => '/api/proxy/file/production%2Fprivate%2Ftest.png?provider=minio'
     */
    static generateProxyUrl(fileKeyOrUrl: string, options: GenerateProxyUrlOptions): string {
        if (!fileKeyOrUrl) {
            return fileKeyOrUrl;
        }

        const { provider, logger } = options;
        const log = logger || this.logger;

        const apiProxyPath = this.getApiProxyPathInternal();
        const ossProxyPrefix = this.getOssProxyPrefixInternal();

        log.debug(`[generateProxyUrl] 输入: "${fileKeyOrUrl}", provider: "${provider}"`);
        log.debug(`[generateProxyUrl] 使用的代理路径: "${apiProxyPath}"`);
        log.debug(`[generateProxyUrl] 使用的代理前缀: "${ossProxyPrefix}"`);

        // 如果已经是代理路径格式（旧数据），直接返回
        if (fileKeyOrUrl.includes(apiProxyPath)) {
            log.debug(`[generateProxyUrl] 输入已包含代理路径，直接返回: "${fileKeyOrUrl}"`);
            return fileKeyOrUrl;
        }

        let fileKey: string;

        // 如果输入是代理前缀格式的URL，提取 fileKey
        if (fileKeyOrUrl.includes(ossProxyPrefix)) {
            try {
                // 格式: {proxyPrefix}{fileKey}?provider={provider}
                const escapedPrefix = ossProxyPrefix.replace(/\//g, "\\/");
                const match = fileKeyOrUrl.match(new RegExp(`${escapedPrefix}(.+?)(?:\\?|$)`));
                if (match && match[1]) {
                    fileKey = decodeURIComponent(match[1]);
                    log.debug(`[generateProxyUrl] 从代理前缀格式提取 fileKey: "${fileKey}"`);
                } else {
                    // 如果无法提取，使用原值
                    fileKey = fileKeyOrUrl;
                    log.warn(`[generateProxyUrl] 无法从代理前缀格式提取 fileKey，使用原值: "${fileKeyOrUrl}"`);
                }
            } catch (error) {
                log.warn(`[generateProxyUrl] 提取 fileKey 失败: ${fileKeyOrUrl}`, error);
                fileKey = fileKeyOrUrl;
            }
        } else {
            // 如果输入是 fileKey，直接使用
            fileKey = fileKeyOrUrl;
            log.debug(`[generateProxyUrl] 输入是 fileKey，直接使用: "${fileKey}"`);
        }

        // 构建代理路径
        // apiProxyPath 可能是完整URL（http:// 或 https://）或相对路径（/api/proxy/file/）
        const proxyPath = `${encodeURIComponent(fileKey)}?provider=${provider}`;
        const result = `${apiProxyPath}${proxyPath}`;

        log.debug(`[generateProxyUrl] 生成的代理URL: "${result}"`);
        return result;
    }

    /**
     * 从URL中提取文件键名
     * 支持多种URL格式：代理前缀格式、阿里云OSS、MinIO等
     * @param url 文件URL
     * @param logger Logger 实例（可选），用于记录警告信息
     * @returns 文件键名，如果无法提取则返回 null
     *
     * @example
     * // 从代理前缀格式提取
     * extractFileKeyFromUrl('/api/proxy/file/production%2Fprivate%2Ftest.png?provider=minio')
     * // => 'production/private/test.png'
     */
    static extractFileKeyFromUrl(url: string, logger?: Logger): string | null {
        if (!url || typeof url !== "string") {
            return null;
        }

        try {
            // 处理代理路径格式的URL
            // 格式: {proxyPath}{fileKey}?provider={provider}
            const apiProxyPath = this.getApiProxyPathInternal();
            const ossProxyPrefix = this.getOssProxyPrefixInternal();

            // 先检查代理路径格式
            if (url.includes(apiProxyPath)) {
                const escapedPath = apiProxyPath.replace(/\//g, "\\/");
                const match = url.match(new RegExp(`${escapedPath}(.+?)(?:\\?|$)`));
                if (match && match[1]) {
                    return decodeURIComponent(match[1]);
                }
            }

            // 检查代理前缀格式（向后兼容）
            if (url.includes(ossProxyPrefix)) {
                const escapedPrefix = ossProxyPrefix.replace(/\//g, "\\/");
                const match = url.match(new RegExp(`${escapedPrefix}(.+?)(?:\\?|$)`));
                if (match && match[1]) {
                    return decodeURIComponent(match[1]);
                }
            }

            // 处理不同类型的 URL
            if (url.includes("aliyuncs.com")) {
                // 阿里云 OSS URL: https://bucket.region.aliyuncs.com/filekey
                const urlParts = url.split("/");
                return urlParts.slice(3).join("/"); // 去掉协议、域名部分
            } else if (url.includes("minio") || url.includes("localhost")) {
                // MinIO URL: http://localhost:9000/bucket/filekey
                const urlParts = url.split("/");
                return urlParts.slice(4).join("/"); // 去掉协议、域名、端口、bucket部分
            } else {
                // 通用处理：取最后一部分
                const urlParts = url.split("/");
                return urlParts[urlParts.length - 1] || null;
            }
        } catch (error) {
            if (logger) {
                logger.warn(`Failed to extract file key from URL: ${url}`, error);
            }
            return null;
        }
    }

    /**
     * 检查URL是否为代理前缀格式
     * @param url URL字符串
     * @returns 是否为代理前缀格式
     *
     * @example
     * isOssProxyUrl('/api/proxy/file/file.png?provider=minio') // => true
     */
    static isOssProxyUrl(url: string): boolean {
        if (!url || typeof url !== "string") {
            return false;
        }
        const ossProxyPrefix = this.getOssProxyPrefixInternal();
        return url.includes(ossProxyPrefix);
    }

    /**
     * 检查URL是否为代理URL格式
     * @param url URL字符串
     * @returns 是否为代理URL格式
     *
     * @example
     * isProxyUrl('/api/proxy/file/file.png?provider=minio') // => true
     * isProxyUrl('https://example.com/file.png') // => false
     */
    static isProxyUrl(url: string): boolean {
        if (!url || typeof url !== "string") {
            return false;
        }
        const apiProxyPath = this.getApiProxyPathInternal();
        const ossProxyPrefix = this.getOssProxyPrefixInternal();
        return url.includes(ossProxyPrefix) || url.includes(apiProxyPath);
    }

    /**
     * 获取存储格式的 OSS 代理前缀（公开方法）
     * 返回固定的 /OSS_FILE_PROXY/ 标识，用于数据库存储
     *
     * 使用场景：
     * - MinioService/AliyunOssService 的 getFileUrl() 方法
     * - 任何需要生成数据库存储格式 URL 的地方
     *
     * 注意：这个前缀用于数据库存储，不是实际的访问路径！
     * 实际访问路径通过 getApiProxyPath() 获取（从环境变量读取）
     *
     * @returns OSS 代理前缀：/OSS_FILE_PROXY/
     */
    static getOssProxyPrefix(): string {
        return this.getOssProxyPrefixInternal();
    }

    /**
     * 获取 API 代理文件路径
     * 从环境变量 REACT_APP_FILE_API_PREFIX 读取，如果未设置则使用默认值 /api/proxy/file/
     * @returns API 代理文件路径
     */
    static getApiProxyPath(): string {
        return this.getApiProxyPathInternal();
    }

    /**
     * 初始化并检查环境变量（公开方法，可在模块启动时调用）
     * 强制输出环境变量检查日志
     */
    static initialize(): void {
        // 调用内部方法会触发环境变量检查和日志输出
        this.getApiProxyPathInternal();
        this.getOssProxyPrefixInternal();
    }

    /**
     * 检查环境变量状态（用于调试）
     * @returns 环境变量状态信息
     */
    static checkEnvironmentVariable(): {
        envVarName: string;
        envVarValue: string | undefined;
        envVarType: string;
        isSet: boolean;
        finalPath: string;
    } {
        const envVarName = "REACT_APP_FILE_API_PREFIX";
        const envVarValue = process.env[envVarName];
        const finalPath = this.getApiProxyPathInternal();

        return {
            envVarName,
            envVarValue,
            envVarType: typeof envVarValue,
            isSet: !!envVarValue,
            finalPath,
        };
    }
}

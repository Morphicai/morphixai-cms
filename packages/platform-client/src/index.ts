/**
 * Optimus 平台能力的服务端客户端。
 *
 * 解决的问题是"每个子服务读一遍 controller 源码，自己写一份 fetch 封装"——
 * partner-service 的 `shared/utils/optimus-api-client.ts` 就是那个第一个实例。
 * 这里把契约（路径、请求体格式、响应解包、字段名不一致）收在一处，消费方装包即用。
 *
 * 零第三方依赖（Node 18+ 原生 fetch/FormData/Blob），和 `@optimus/server-sdk` 一样
 * 可以被平台外的团队独立安装。
 *
 * **刻意不依赖 `@optimus/server-sdk`。** 本包封装的三个能力，两个要求
 * `@ClientUserAuth()`（也就是发起请求那个**用户**的 clientAccessToken），一个匿名，
 * 没有一个吃 service token。真加个依赖只为了"看起来分层正确"，会引入一个当前用不上的
 * 运行时依赖。等出现按 grant 授权的服务身份接口（如按 uid 查用户资料）时再加，
 * 且首选让消费方把已签发的 token 传进来，而不是本包反向依赖 server-sdk。
 */

/** 平台返回的统一响应壳：`{ code, data, msg }` */
interface Envelope<T> {
    code?: number;
    data?: T;
    msg?: string;
}

/**
 * 平台**返回了**响应但业务失败（code != 200 / 关键字段缺失）。
 *
 * 与网络/超时失败分开：后者按原始错误抛出，不包装。
 * "平台说不行" 和 "没能问到平台" 是两回事——前者重试没用，后者可能值得重试。
 */
export class PlatformApiError extends Error {
    readonly endpoint: string;
    /** HTTP 状态码 */
    readonly status: number;
    /** 响应体里的业务 code，缺失时为 undefined */
    readonly code?: number;

    constructor(endpoint: string, status: number, code: number | undefined, message: string) {
        super(message);
        this.name = "PlatformApiError";
        this.endpoint = endpoint;
        this.status = status;
        this.code = code;
    }
}

export interface PlatformClientOptions {
    /** 平台 API 地址，如 `http://optimus-api:8084/api` */
    baseUrl: string;
    /** 常规请求超时（ms），默认 10s */
    timeoutMs?: number;
    /** 上传超时（ms），默认 30s——文件大小差异大，和常规请求共用一个值不合适 */
    uploadTimeoutMs?: number;
    /**
     * 环境信息缓存 TTL（ms），默认 5min；0 关缓存。
     * 部署环境在进程生命周期内不变，每次调用都打一次网络没有意义。
     */
    environmentCacheTtlMs?: number;
}

/** 上传入参。字段名对齐 Express.Multer.File，消费方多半直接把 multer 的对象传进来 */
export interface PlatformUploadFile {
    buffer: Uint8Array;
    mimetype: string;
    originalname: string;
}

export interface UploadOptions {
    /** 发起者自己的 clientAccessToken（不带 `Bearer ` 前缀） */
    token: string;
    /** 业务来源标记，落库用于归类。建议填 */
    business?: string;
    /** 需要缩略图时才传 true——见下方 needThumbnail 的说明 */
    needThumbnail?: boolean;
    width?: number;
    height?: number;
    quality?: number;
}

export interface UploadedFile {
    url: string;
    /** 平台字段名是 `thumbnail_url`（entity 属性本身就是蛇形），这里统一成驼峰 */
    thumbnailUrl?: string;
    fileKey?: string;
    ossKey?: string;
    size?: number;
    /** 平台字段名是 `type` */
    mimeType?: string;
    cdnUrl?: string;
    /** 平台原始记录。契约演进期用得上，不要在业务里长期依赖 */
    raw: Record<string, unknown>;
}

export interface ShortLinkOptions {
    /** 发起者自己的 clientAccessToken */
    token: string;
    /** 目标：字符串直接用，对象会被平台按 URLSearchParams 序列化 */
    target: string | Record<string, unknown>;
    remark?: string;
}

export interface ShortLink {
    token: string;
    /**
     * **站点根相对路径**，形如 `/public/short-link/resolve/<token>`，不是绝对 URL。
     * 平台返回的就是相对路径，本包不替消费方拼域名——拼错域名的短链比没有短链更糟，
     * 而"该用哪个域名"取决于分发渠道（站内/短信/二维码），只有消费方知道。
     * 需要绝对地址时用 `getEnvironment().rootDomain` 自行拼接。
     */
    url: string;
}

/**
 * 跨服务查到的用户基础资料。
 *
 * `username` 在这里是有意给的：本能力的由来就是业务方各自冗余存一份会漂移的
 * username 快照——查得到当前值，就不必再存快照。
 */
export interface UserProfileBasic {
    userId: string;
    username: string | null;
    nickname: string | null;
    avatar: string | null;
}

/** 完整资料。额外含邮箱、状态与注册时间；**不含手机号**（平台两档都不给） */
export interface UserProfileFull extends UserProfileBasic {
    email: string | null;
    status: string;
    /** ISO 字符串（JSON 传输后不是 Date） */
    createdAt: string;
}

export interface UserProfileOptions {
    /**
     * **service token**，不是用户 token。由 `@optimus/server-sdk` 的
     * `getServiceToken(serviceKey)` 本地签发。
     *
     * 本包不代签：签名要用主密钥派生的专属密钥，那属于"你是谁"，是 server-sdk
     * 的职责；这里只负责"帮我做件事"。
     */
    serviceToken: string;
    userId: string;
}

export type EnvironmentName = "dev" | "test" | "staging" | "prod";

export interface EnvironmentInfo {
    environment: EnvironmentName;
    rootDomain: string;
    cookieDomain: string;
}

/**
 * 从请求里取发起者自己的 clientAccessToken：header 优先，其次 cookie。
 *
 * 和框架解耦——只读 `headers.authorization` 与 `cookies.clientAccessToken`，
 * Express/Fastify/Next 的 request 都能喂进来。
 */
export function extractClientToken(req: unknown): string | undefined {
    const r = req as { headers?: Record<string, unknown>; cookies?: Record<string, unknown> } | null;
    const auth = r?.headers?.authorization;
    if (typeof auth === "string" && auth.startsWith("Bearer ")) return auth.substring(7);
    const cookie = r?.cookies?.clientAccessToken;
    return typeof cookie === "string" ? cookie : undefined;
}

interface EnvironmentCacheEntry {
    info: EnvironmentInfo;
    expiresAt: number;
}

export class PlatformClient {
    private readonly baseUrl: string;
    private readonly timeoutMs: number;
    private readonly uploadTimeoutMs: number;
    private readonly environmentCacheTtlMs: number;
    private environmentCache?: EnvironmentCacheEntry;

    constructor(options: PlatformClientOptions) {
        if (!options?.baseUrl) throw new Error("baseUrl is required");
        this.baseUrl = options.baseUrl.replace(/\/$/, "");
        this.timeoutMs = options.timeoutMs ?? 10_000;
        this.uploadTimeoutMs = options.uploadTimeoutMs ?? 30_000;
        this.environmentCacheTtlMs = options.environmentCacheTtlMs ?? 300_000;
    }

    /**
     * 上传文件到平台存储，返回可访问的 URL。
     * 走 `POST /files/client-upload`，以**发起者用户**的身份署名，不是服务身份。
     */
    async uploadFile(file: PlatformUploadFile, options: UploadOptions): Promise<UploadedFile> {
        requireToken(options?.token);
        if (!file?.buffer) throw new Error("file.buffer is required");

        const form = new FormData();
        form.append("file", new Blob([file.buffer], { type: file.mimetype }), file.originalname);
        if (options.business) form.append("business", options.business);
        if (options.width !== undefined) form.append("width", String(options.width));
        if (options.height !== undefined) form.append("height", String(options.height));
        if (options.quality !== undefined) form.append("quality", String(options.quality));
        // needThumbnail 只在 true 时附带。平台 DTO 上是 `@Type(() => Boolean)`，而
        // multipart 的值一律是字符串——`Boolean("false") === true`，传 false 会被反向
        // 解读成"要缩略图"。省略才是表达 false 的唯一安全方式
        if (options.needThumbnail) form.append("needThumbnail", "true");

        const record = await this.request<Record<string, unknown>[]>("/files/client-upload", {
            method: "POST",
            headers: { Authorization: `Bearer ${options.token}` },
            body: form,
            timeoutMs: this.uploadTimeoutMs,
        });

        const first = Array.isArray(record) ? record[0] : undefined;
        const url = typeof first?.url === "string" ? first.url : "";
        if (!url) {
            throw new PlatformApiError("/files/client-upload", 200, 200, "上传成功但响应里没有 url");
        }
        return {
            url,
            thumbnailUrl: pickString(first, "thumbnail_url") || pickString(first, "thumbnailUrl"),
            fileKey: pickString(first, "fileKey"),
            ossKey: pickString(first, "ossKey"),
            size: typeof first?.size === "number" ? first.size : undefined,
            mimeType: pickString(first, "type"),
            cdnUrl: pickString(first, "cdnUrl"),
            raw: first ?? {},
        };
    }

    /** 生成短链。走 `POST /system/short-link/client-shorten`，同样是用户身份。 */
    async createShortLink(options: ShortLinkOptions): Promise<ShortLink> {
        requireToken(options?.token);
        if (options.target === undefined || options.target === null || options.target === "") {
            throw new Error("target is required");
        }

        const data = await this.request<{ token?: unknown; url?: unknown }>("/system/short-link/client-shorten", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${options.token}` },
            body: JSON.stringify({ target: options.target, remark: options.remark }),
            timeoutMs: this.timeoutMs,
        });

        if (typeof data?.token !== "string" || !data.token) {
            throw new PlatformApiError("/system/short-link/client-shorten", 200, 200, "短链服务未返回 token");
        }
        return { token: data.token, url: typeof data.url === "string" ? data.url : "" };
    }

    /**
     * 查询当前部署环境信息。匿名接口，不需要 token。
     * 结果按 TTL 缓存（见 `environmentCacheTtlMs`）。
     */
    async getEnvironment(): Promise<EnvironmentInfo> {
        const now = Date.now();
        if (this.environmentCache && this.environmentCache.expiresAt > now) {
            return this.environmentCache.info;
        }

        const data = await this.request<Partial<EnvironmentInfo>>("/environment", {
            method: "GET",
            timeoutMs: this.timeoutMs,
        });

        const info: EnvironmentInfo = {
            // 认不出来的环境名按 prod 处理，与平台侧 normalizeEnvironment 的方向一致：
            // 把生产误判成开发的代价更大
            environment: isEnvironmentName(data?.environment) ? data.environment : "prod",
            // 空串而非 undefined：消费方拿它做字符串拼接，undefined 会拼出 "undefined/path"
            rootDomain: typeof data?.rootDomain === "string" ? data.rootDomain : "",
            cookieDomain: typeof data?.cookieDomain === "string" ? data.cookieDomain : "",
        };
        if (this.environmentCacheTtlMs > 0) {
            this.environmentCache = { info, expiresAt: now + this.environmentCacheTtlMs };
        }
        return info;
    }

    /**
     * 按 uid 查用户基础资料。需要 `user-profile:read-basic` grant。
     *
     * 错误按 `PlatformApiError.code` 区分，两种含义完全不同，别一起 catch 掉：
     * - `404` 用户不存在
     * - `403` 本服务没被授予这项 grant（或未登记/已下线）
     * - `401` token 不是有效的 service token（比如误传了用户 token）
     */
    async getUserProfileBasic(options: UserProfileOptions): Promise<UserProfileBasic> {
        return this.fetchProfile<UserProfileBasic>("basic", options);
    }

    /** 按 uid 查完整资料。需要 `user-profile:read-full` grant，错误语义同上。 */
    async getUserProfileFull(options: UserProfileOptions): Promise<UserProfileFull> {
        return this.fetchProfile<UserProfileFull>("full", options);
    }

    private async fetchProfile<T>(level: "basic" | "full", options: UserProfileOptions): Promise<T> {
        if (typeof options?.serviceToken !== "string" || !options.serviceToken) {
            throw new Error("serviceToken is required");
        }
        if (typeof options?.userId !== "string" || !options.userId) {
            throw new Error("userId is required");
        }

        // uid 进的是路径段，必须编码——否则带 `/` 或 `?` 的值会改变请求的含义
        const endpoint = `/service/user-profile/${level}/${encodeURIComponent(options.userId)}`;
        const data = await this.request<T>(endpoint, {
            method: "GET",
            headers: { Authorization: `Bearer ${options.serviceToken}` },
            timeoutMs: this.timeoutMs,
        });
        if (!data) {
            throw new PlatformApiError(endpoint, 200, 200, "平台未返回用户资料");
        }
        return data;
    }

    /** 测试/长驻进程用：清空环境信息缓存 */
    clearCache(): void {
        this.environmentCache = undefined;
    }

    /**
     * 统一的请求 + 解包。网络/超时错误原样抛出（调用方决定降级），
     * 平台返回的业务失败包装成 PlatformApiError。
     */
    private async request<T>(
        endpoint: string,
        init: { method: string; headers?: Record<string, string>; body?: unknown; timeoutMs: number },
    ): Promise<T | undefined> {
        const res = await fetch(`${this.baseUrl}${endpoint}`, {
            method: init.method,
            headers: init.headers,
            body: init.body as BodyInit | undefined,
            signal: AbortSignal.timeout(init.timeoutMs),
        });

        // 响应体不是 JSON（网关 HTML 错误页、502 之类）也要给出可诊断的错误，
        // 而不是抛一个 "Unexpected token <" 让人去猜
        const body = (await res.json().catch(() => null)) as Envelope<T> | null;
        if (!body || body.code !== 200) {
            throw new PlatformApiError(
                endpoint,
                res.status,
                body?.code,
                body?.msg || `平台接口调用失败(HTTP ${res.status})`,
            );
        }
        return body.data;
    }
}

function requireToken(token: unknown): void {
    if (typeof token !== "string" || !token) throw new Error("token is required");
}

function pickString(source: Record<string, unknown> | undefined, key: string): string | undefined {
    const value = source?.[key];
    return typeof value === "string" && value ? value : undefined;
}

function isEnvironmentName(value: unknown): value is EnvironmentName {
    return value === "dev" || value === "test" || value === "staging" || value === "prod";
}

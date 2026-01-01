import { Readable } from "stream";

/**
 * 文件上传选项
 */
export interface UploadOptions {
    /** 文件夹路径（已废弃，使用新的路径结构） */
    folder?: string;
    /** 是否生成缩略图 */
    generateThumbnail?: boolean;
    /** 缩略图选项 */
    thumbnailOptions?: {
        width?: number;
        height?: number;
        quality?: number;
    };
    /** 业务标识，默认为 'common' */
    business?: string;
    /** 权限类型：'private' | 'public'，默认为 'private' */
    accessType?: "private" | "public";
    /** 环境标识，默认从 NODE_ENV 读取 */
    environment?: string;
    /** 路径前缀，从环境变量读取 */
    pathPrefix?: string;
}

/**
 * 文件上传结果
 */
export interface FileResult {
    /** 文件ID */
    id?: number;
    /** 文件名 */
    fileName: string;
    /** 原始文件名 */
    originalName?: string;
    /** 文件访问URL */
    url: string;
    /** 缩略图URL */
    thumbnailUrl?: string;
    /** 文件大小 */
    size: number;
    /** MIME类型 */
    mimeType: string;
    /** 文件键名 */
    fileKey?: string;
}

/**
 * 文件信息
 */
export interface FileInfo {
    /** 文件名 */
    fileName: string;
    /** 文件大小 */
    size: number;
    /** MIME类型 */
    mimeType: string;
    /** 最后修改时间 */
    lastModified?: Date;
    /** 文件标签 */
    tags?: Record<string, string>;
}

/**
 * 临时 URL 生成选项
 */
export interface TemporaryUrlOptions {
    /** 过期时间（秒），默认 3600 秒（1小时） */
    expiresIn?: number;
    /** 存储桶名称，可选，默认使用配置中的存储桶 */
    bucket?: string;
}

/**
 * 对象列表项
 */
export interface ObjectListItem {
    /** 对象键名（完整路径） */
    name: string;
    /** 文件大小（字节） */
    size: number;
    /** 最后修改时间 */
    lastModified: Date;
    /** ETag */
    etag?: string;
}

/**
 * 列出对象的选项
 */
export interface ListObjectsOptions {
    /** 前缀过滤 */
    prefix?: string;
    /** 最大返回数量 */
    maxKeys?: number;
    /** 是否递归列出所有子目录 */
    recursive?: boolean;
}

/**
 * 统一存储服务接口
 */
export interface IStorageService {
    /**
     * 上传文件
     * @param file 文件对象
     * @param options 上传选项
     * @returns 文件上传结果
     */
    uploadFile(file: Express.Multer.File, options?: UploadOptions): Promise<FileResult>;

    /**
     * 下载文件流
     * @param fileKey 文件键名
     * @returns 文件流
     */
    downloadFile(fileKey: string): Promise<Readable>;

    /**
     * 删除文件
     * @param fileKey 文件键名
     */
    deleteFile(fileKey: string): Promise<void>;

    /**
     * @deprecated 已废弃 - 不再使用永久URL，请使用 generateTemporaryUrl 方法
     * 获取文件访问URL
     * @param fileKey 文件键名
     * @returns 文件访问URL
     */
    getFileUrl(fileKey: string): Promise<string>;

    /**
     * 生成临时访问 URL
     * @param fileKey 文件键名
     * @param options 临时 URL 选项
     * @returns 临时访问 URL
     */
    generateTemporaryUrl(fileKey: string, options?: TemporaryUrlOptions): Promise<string>;

    /**
     * 上传缩略图
     * @param buffer 图片缓冲区
     * @param fileName 文件名
     * @returns 缩略图URL
     */
    uploadThumbnail(buffer: Buffer, fileName: string): Promise<string>;

    /**
     * 检查文件是否存在
     * @param fileKey 文件键名
     * @returns 是否存在
     */
    fileExists(fileKey: string): Promise<boolean>;

    /**
     * 获取文件信息
     * @param fileKey 文件键名
     * @returns 文件信息
     */
    getFileInfo(fileKey: string): Promise<FileInfo>;

    /**
     * 列出对象
     * @param options 列出选项
     * @returns 对象列表的异步迭代器
     */
    listObjects(options?: ListObjectsOptions): AsyncIterable<ObjectListItem>;

    /**
     * 上传 Buffer 数据
     * @param buffer 数据缓冲区
     * @param fileKey 文件键名
     * @param metadata 元数据
     * @returns 上传结果
     */
    uploadBuffer(buffer: Buffer, fileKey: string, metadata?: Record<string, string>): Promise<{ fileKey: string }>;
}

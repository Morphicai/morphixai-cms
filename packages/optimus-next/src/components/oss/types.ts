/**
 * OSS 组件相关的 TypeScript 类型定义
 */

/**
 * OSS 文件路径前缀
 */
export const OSS_FILE_PROXY = '/OSS_FILE_PROXY/' as const;

/**
 * 支持的图片格式
 */
export type ImageFormat = 
  | 'jpg'
  | 'jpeg'
  | 'png'
  | 'gif'
  | 'webp'
  | 'svg'
  | 'bmp'
  | 'ico';

/**
 * 支持的视频格式
 */
export type VideoFormat = 
  | 'mp4'
  | 'webm'
  | 'ogg'
  | 'avi'
  | 'mov'
  | 'wmv'
  | 'flv';

/**
 * 支持的音频格式
 */
export type AudioFormat = 
  | 'mp3'
  | 'wav'
  | 'ogg'
  | 'aac'
  | 'm4a'
  | 'flac';

/**
 * 支持的文档格式
 */
export type DocumentFormat = 
  | 'pdf'
  | 'doc'
  | 'docx'
  | 'xls'
  | 'xlsx'
  | 'ppt'
  | 'pptx'
  | 'txt'
  | 'csv';

/**
 * 所有支持的文件格式
 */
export type SupportedFormat = 
  | ImageFormat 
  | VideoFormat 
  | AudioFormat 
  | DocumentFormat;

/**
 * OSS 文件路径类型
 */
export type OssFilePath = `${typeof OSS_FILE_PROXY}${string}`;

/**
 * 普通 URL 路径类型
 */
export type HttpUrl = `http://${string}` | `https://${string}`;

/**
 * 所有可能的文件路径类型
 */
export type FilePath = OssFilePath | HttpUrl | string;

/**
 * 图片加载状态
 */
export type ImageLoadingState = 
  | 'idle'
  | 'loading'
  | 'loaded'
  | 'error';

/**
 * 图片尺寸
 */
export interface ImageSize {
  width: number;
  height: number;
}

/**
 * 图片元数据
 */
export interface ImageMetadata {
  src: string;
  alt: string;
  size?: ImageSize;
  format?: ImageFormat;
  loadingState: ImageLoadingState;
}

/**
 * URL 转换选项
 */
export interface UrlTransformOptions {
  /**
   * 是否转换所有 URL 类型
   * @default true
   */
  transformAllUrls?: boolean;
  
  /**
   * 自定义 CDN 前缀（覆盖环境变量）
   */
  customCdnPrefix?: string;
  
  /**
   * 是否保留查询参数
   * @default true
   */
  preserveQueryParams?: boolean;
}

/**
 * HTML 转换选项
 */
export interface HtmlTransformOptions extends UrlTransformOptions {
  /**
   * 需要转换的 HTML 属性列表
   * @default ['src', 'href']
   */
  attributes?: string[];
  
  /**
   * 是否转换 CSS 中的 URL
   * @default true
   */
  transformCssUrls?: boolean;
}

/**
 * 富文本配置选项
 */
export interface RichTextOptions {
  /**
   * 是否启用代码高亮
   * @default false
   */
  enableCodeHighlight?: boolean;
  
  /**
   * 是否启用自动链接
   * @default false
   */
  enableAutoLink?: boolean;
  
  /**
   * 最大内容长度（字符数）
   */
  maxContentLength?: number;
  
  /**
   * 允许的 HTML 标签白名单
   */
  allowedTags?: string[];
}

/**
 * CDN 配置
 */
export interface CdnConfig {
  /**
   * CDN 域名
   */
  domain: string;
  
  /**
   * CDN 区域
   */
  region?: string;
  
  /**
   * 是否使用 HTTPS
   * @default true
   */
  useHttps?: boolean;
  
  /**
   * 自定义路径前缀
   */
  pathPrefix?: string;
}

/**
 * 文件上传响应
 */
export interface FileUploadResponse {
  /**
   * 上传是否成功
   */
  success: boolean;
  
  /**
   * 文件 URL（包含 OSS_FILE_PROXY 前缀）
   */
  url?: string;
  
  /**
   * 错误信息
   */
  error?: string;
  
  /**
   * 文件元数据
   */
  metadata?: {
    filename: string;
    size: number;
    mimeType: string;
    uploadedAt: Date;
  };
}

/**
 * 批量文件上传响应
 */
export interface BatchUploadResponse {
  /**
   * 成功上传的文件列表
   */
  succeeded: FileUploadResponse[];
  
  /**
   * 失败的文件列表
   */
  failed: FileUploadResponse[];
  
  /**
   * 总文件数
   */
  total: number;
}

/**
 * OSS 服务接口
 */
export interface OssService {
  /**
   * 上传单个文件
   */
  uploadFile(file: File): Promise<FileUploadResponse>;
  
  /**
   * 批量上传文件
   */
  uploadFiles(files: File[]): Promise<BatchUploadResponse>;
  
  /**
   * 删除文件
   */
  deleteFile(url: string): Promise<boolean>;
  
  /**
   * 获取文件元数据
   */
  getFileMetadata(url: string): Promise<ImageMetadata | null>;
}

/**
 * 环境变量类型扩展
 */
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      /**
       * OSS 文件 CDN 地址前缀
       */
      NEXT_PUBLIC_FILE_API_PREFIX: string;
      
      /**
       * API 基础 URL
       */
      NEXT_PUBLIC_API_URL: string;
      
      /**
       * 应用名称
       */
      NEXT_PUBLIC_APP_NAME: string;
      
      /**
       * 应用版本
       */
      NEXT_PUBLIC_APP_VERSION: string;
    }
  }
}

/**
 * 工具函数类型
 */
export interface OssUtils {
  /**
   * 转换 OSS URL
   */
  transformUrl: (url: string, options?: UrlTransformOptions) => string;
  
  /**
   * 转换 HTML 内容
   */
  transformHtml: (html: string, options?: HtmlTransformOptions) => string;
  
  /**
   * 检查是否为 OSS 路径
   */
  isOssPath: (path: string) => boolean;
  
  /**
   * 获取文件扩展名
   */
  getFileExtension: (filename: string) => string | null;
  
  /**
   * 检查文件类型
   */
  isImageFile: (filename: string) => boolean;
  isVideoFile: (filename: string) => boolean;
  isAudioFile: (filename: string) => boolean;
  isDocumentFile: (filename: string) => boolean;
}

export {};





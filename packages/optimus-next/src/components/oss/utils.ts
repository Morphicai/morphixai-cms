/**
 * OSS 工具函数
 * 
 * 提供文件路径处理、类型检查等实用工具
 */

import type {
  ImageFormat,
  VideoFormat,
  AudioFormat,
  DocumentFormat,
  OssFilePath,
} from './types';

/**
 * OSS 文件路径前缀常量
 */
export const OSS_FILE_PROXY = '/OSS_FILE_PROXY/';

/**
 * 支持的图片格式列表
 */
export const IMAGE_FORMATS: ImageFormat[] = [
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'
];

/**
 * 支持的视频格式列表
 */
export const VIDEO_FORMATS: VideoFormat[] = [
  'mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv', 'flv'
];

/**
 * 支持的音频格式列表
 */
export const AUDIO_FORMATS: AudioFormat[] = [
  'mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'
];

/**
 * 支持的文档格式列表
 */
export const DOCUMENT_FORMATS: DocumentFormat[] = [
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'
];

/**
 * 检查路径是否为 OSS 代理路径
 * 
 * @param path 文件路径
 * @returns 是否为 OSS 路径
 * 
 * @example
 * ```ts
 * isOssPath('/OSS_FILE_PROXY/image.jpg') // true
 * isOssPath('https://example.com/image.jpg') // false
 * ```
 */
export function isOssPath(path: string): path is OssFilePath {
  return typeof path === 'string' && path.startsWith(OSS_FILE_PROXY);
}

/**
 * 检查 URL 是否为 HTTP(S) 协议
 * 
 * @param url URL 字符串
 * @returns 是否为 HTTP URL
 * 
 * @example
 * ```ts
 * isHttpUrl('https://example.com/image.jpg') // true
 * isHttpUrl('/OSS_FILE_PROXY/image.jpg') // false
 * ```
 */
export function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/**
 * 从文件名或路径中提取文件扩展名
 * 
 * @param filename 文件名或路径
 * @returns 文件扩展名（小写，不含点号），如果没有扩展名返回 null
 * 
 * @example
 * ```ts
 * getFileExtension('image.jpg') // 'jpg'
 * getFileExtension('/path/to/document.PDF') // 'pdf'
 * getFileExtension('noextension') // null
 * ```
 */
export function getFileExtension(filename: string): string | null {
  if (!filename) return null;
  
  const match = filename.match(/\.([^./?#]+)(?:[?#]|$)/);
  return match ? match[1].toLowerCase() : null;
}

/**
 * 检查文件是否为图片格式
 * 
 * @param filename 文件名或路径
 * @returns 是否为图片文件
 * 
 * @example
 * ```ts
 * isImageFile('photo.jpg') // true
 * isImageFile('video.mp4') // false
 * ```
 */
export function isImageFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ext !== null && IMAGE_FORMATS.includes(ext as ImageFormat);
}

/**
 * 检查文件是否为视频格式
 * 
 * @param filename 文件名或路径
 * @returns 是否为视频文件
 * 
 * @example
 * ```ts
 * isVideoFile('movie.mp4') // true
 * isVideoFile('photo.jpg') // false
 * ```
 */
export function isVideoFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ext !== null && VIDEO_FORMATS.includes(ext as VideoFormat);
}

/**
 * 检查文件是否为音频格式
 * 
 * @param filename 文件名或路径
 * @returns 是否为音频文件
 * 
 * @example
 * ```ts
 * isAudioFile('song.mp3') // true
 * isAudioFile('photo.jpg') // false
 * ```
 */
export function isAudioFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ext !== null && AUDIO_FORMATS.includes(ext as AudioFormat);
}

/**
 * 检查文件是否为文档格式
 * 
 * @param filename 文件名或路径
 * @returns 是否为文档文件
 * 
 * @example
 * ```ts
 * isDocumentFile('report.pdf') // true
 * isDocumentFile('photo.jpg') // false
 * ```
 */
export function isDocumentFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ext !== null && DOCUMENT_FORMATS.includes(ext as DocumentFormat);
}

/**
 * 获取文件类型分类
 * 
 * @param filename 文件名或路径
 * @returns 文件类型分类
 * 
 * @example
 * ```ts
 * getFileType('photo.jpg') // 'image'
 * getFileType('video.mp4') // 'video'
 * getFileType('unknown.xyz') // 'unknown'
 * ```
 */
export function getFileType(filename: string): 'image' | 'video' | 'audio' | 'document' | 'unknown' {
  if (isImageFile(filename)) return 'image';
  if (isVideoFile(filename)) return 'video';
  if (isAudioFile(filename)) return 'audio';
  if (isDocumentFile(filename)) return 'document';
  return 'unknown';
}

/**
 * 从 OSS 路径中提取实际的文件路径（去除 OSS_FILE_PROXY 前缀）
 * 
 * @param ossPath OSS 完整路径
 * @returns 去除前缀后的路径
 * 
 * @example
 * ```ts
 * extractFilePath('/OSS_FILE_PROXY/images/logo.png') // '/images/logo.png'
 * extractFilePath('https://cdn.com/file.jpg') // 'https://cdn.com/file.jpg'
 * ```
 */
export function extractFilePath(ossPath: string): string {
  if (isOssPath(ossPath)) {
    return ossPath.substring(OSS_FILE_PROXY.length - 1);
  }
  return ossPath;
}

/**
 * 构建 OSS 路径（添加 OSS_FILE_PROXY 前缀）
 * 
 * @param filePath 文件路径
 * @returns OSS 完整路径
 * 
 * @example
 * ```ts
 * buildOssPath('/images/logo.png') // '/OSS_FILE_PROXY/images/logo.png'
 * buildOssPath('images/logo.png') // '/OSS_FILE_PROXY/images/logo.png'
 * ```
 */
export function buildOssPath(filePath: string): OssFilePath {
  // 如果已经是 OSS 路径，直接返回
  if (isOssPath(filePath)) {
    return filePath;
  }
  
  // 确保路径以 / 开头
  const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
  
  return `${OSS_FILE_PROXY}${normalizedPath}` as OssFilePath;
}

/**
 * 格式化文件大小
 * 
 * @param bytes 字节数
 * @param decimals 小数位数
 * @returns 格式化后的文件大小字符串
 * 
 * @example
 * ```ts
 * formatFileSize(1024) // '1 KB'
 * formatFileSize(1536, 2) // '1.50 KB'
 * formatFileSize(1048576) // '1 MB'
 * ```
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * 从 URL 中提取文件名
 * 
 * @param url 完整 URL 或路径
 * @returns 文件名
 * 
 * @example
 * ```ts
 * getFilename('/OSS_FILE_PROXY/images/logo.png') // 'logo.png'
 * getFilename('https://cdn.com/path/to/file.jpg?v=1') // 'file.jpg'
 * ```
 */
export function getFilename(url: string): string {
  if (!url) return '';
  
  // 移除查询参数和 hash
  const cleanUrl = url.split('?')[0].split('#')[0];
  
  // 提取文件名
  const parts = cleanUrl.split('/');
  return parts[parts.length - 1] || '';
}

/**
 * 验证 CDN 前缀配置
 * 
 * @returns 是否已配置 CDN 前缀
 */
export function hasCdnConfig(): boolean {
  return !!(process.env.NEXT_PUBLIC_FILE_API_PREFIX && 
            process.env.NEXT_PUBLIC_FILE_API_PREFIX.trim());
}

/**
 * 获取 CDN 前缀
 * 
 * @param throwIfMissing 如果未配置是否抛出错误
 * @returns CDN 前缀
 */
export function getCdnPrefix(throwIfMissing: boolean = false): string {
  const prefix = process.env.NEXT_PUBLIC_FILE_API_PREFIX || '';
  
  if (!prefix && throwIfMissing) {
    throw new Error(
      'NEXT_PUBLIC_FILE_API_PREFIX 环境变量未配置。' +
      '请在 .env.local 或 .env.development 中配置此变量。'
    );
  }
  
  return prefix;
}

/**
 * 批量转换 OSS 路径
 * 
 * @param paths 路径数组
 * @returns 转换后的路径数组
 * 
 * @example
 * ```ts
 * batchTransformUrls([
 *   '/OSS_FILE_PROXY/img1.jpg',
 *   '/OSS_FILE_PROXY/img2.jpg',
 * ])
 * // ['https://cdn.com/img1.jpg', 'https://cdn.com/img2.jpg']
 * ```
 */
export function batchTransformUrls(paths: string[]): string[] {
  const cdnPrefix = getCdnPrefix();
  if (!cdnPrefix) return paths;
  
  return paths.map(path => {
    if (isOssPath(path)) {
      return path.replace(OSS_FILE_PROXY, cdnPrefix);
    }
    return path;
  });
}

/**
 * 验证 URL 格式
 * 
 * @param url URL 字符串
 * @returns 是否为有效 URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取文件的 MIME 类型
 * 
 * @param filename 文件名或路径
 * @returns MIME 类型
 */
export function getMimeType(filename: string): string {
  const ext = getFileExtension(filename);
  if (!ext) return 'application/octet-stream';
  
  const mimeTypes: Record<string, string> = {
    // 图片
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'ico': 'image/x-icon',
    
    // 视频
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'ogg': 'video/ogg',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'wmv': 'video/x-ms-wmv',
    'flv': 'video/x-flv',
    
    // 音频
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'aac': 'audio/aac',
    'm4a': 'audio/mp4',
    'flac': 'audio/flac',
    
    // 文档
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'csv': 'text/csv',
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * 工具函数集合
 */
export const ossUtils = {
  isOssPath,
  isHttpUrl,
  getFileExtension,
  isImageFile,
  isVideoFile,
  isAudioFile,
  isDocumentFile,
  getFileType,
  extractFilePath,
  buildOssPath,
  formatFileSize,
  getFilename,
  hasCdnConfig,
  getCdnPrefix,
  batchTransformUrls,
  isValidUrl,
  getMimeType,
};

export default ossUtils;





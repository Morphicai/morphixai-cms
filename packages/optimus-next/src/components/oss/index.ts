/**
 * OSS 文件处理组件
 * 
 * 提供了处理 OSS 文件路径的组件和工具函数
 */

// 组件
export { OssImage, transformOssUrl } from './OssImage';
export type { OssImageProps } from './OssImage';

export { RichTextContent, transformOssHtml } from './RichTextContent';
export type { RichTextContentProps } from './RichTextContent';

// 工具函数
export {
  ossUtils,
  OSS_FILE_PROXY,
  IMAGE_FORMATS,
  VIDEO_FORMATS,
  AUDIO_FORMATS,
  DOCUMENT_FORMATS,
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
} from './utils';

// 类型定义
export type {
  ImageFormat,
  VideoFormat,
  AudioFormat,
  DocumentFormat,
  SupportedFormat,
  OssFilePath,
  HttpUrl,
  FilePath,
  ImageLoadingState,
  ImageSize,
  ImageMetadata,
  UrlTransformOptions,
  HtmlTransformOptions,
  RichTextOptions,
  CdnConfig,
  FileUploadResponse,
  BatchUploadResponse,
  OssService,
  OssUtils,
} from './types';


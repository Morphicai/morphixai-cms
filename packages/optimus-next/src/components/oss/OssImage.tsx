'use client';

import React, { ImgHTMLAttributes } from 'react';

/**
 * OSS_FILE_PROXY 前缀标识
 * 用于标识需要处理的 OSS 文件路径
 */
const OSS_FILE_PROXY = '/OSS_FILE_PROXY/';

/**
 * 将 OSS 代理路径转换为实际的 CDN 路径
 * 支持服务端和客户端渲染
 * @param src 原始图片路径
 * @returns 转换后的路径
 */
export const transformOssUrl = (src: string): string => {
  if (!src) return '';
  
  // 如果路径包含 OSS_FILE_PROXY 前缀，替换为环境变量配置的 CDN 地址
  if (src.startsWith(OSS_FILE_PROXY)) {
    let fileApiPrefix = process.env.NEXT_PUBLIC_FILE_API_PREFIX || '';
    // 确保 fileApiPrefix 以斜杠结尾
    if (fileApiPrefix && !fileApiPrefix.endsWith('/')) {
      fileApiPrefix += '/';
    }
    return src.replace(OSS_FILE_PROXY, fileApiPrefix);
  }
  
  return src;
};

export interface OssImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  /**
   * 图片路径，支持以下格式：
   * 1. 普通 URL: https://example.com/image.jpg
   * 2. OSS 代理路径: /OSS_FILE_PROXY/path/to/image.jpg
   */
  src: string;
  /**
   * 图片描述
   */
  alt: string;
  /**
   * 是否显示加载状态
   */
  showLoading?: boolean;
  /**
   * 加载失败时的占位图
   */
  fallbackSrc?: string;
  /**
   * 自定义类名
   */
  className?: string;
}

/**
 * OssImage 组件
 * 
 * 用于处理 OSS 文件路径的图片组件，自动将 /OSS_FILE_PROXY/ 前缀替换为环境变量配置的 CDN 地址
 * 
 * @example
 * ```tsx
 * // 使用 OSS 代理路径
 * <OssImage src="/OSS_FILE_PROXY/images/logo.png" alt="Logo" />
 * 
 * // 使用普通 URL
 * <OssImage src="https://example.com/image.jpg" alt="Example" />
 * 
 * // 使用加载状态和占位图
 * <OssImage 
 *   src="/OSS_FILE_PROXY/images/banner.jpg" 
 *   alt="Banner"
 *   showLoading={true}
 *   fallbackSrc="/placeholder.jpg"
 * />
 * ```
 */
export const OssImage: React.FC<OssImageProps> = ({
  src,
  alt,
  showLoading = false,
  fallbackSrc = '/placeholder.jpg',
  className = '',
  onError,
  ...props
}) => {
  const [isLoading, setIsLoading] = React.useState(showLoading);
  const [hasError, setHasError] = React.useState(false);
  const [imageSrc, setImageSrc] = React.useState(() => transformOssUrl(src));

  // 当 src 变化时更新 imageSrc
  React.useEffect(() => {
    setImageSrc(transformOssUrl(src));
    setHasError(false);
    setIsLoading(showLoading);
  }, [src, showLoading]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false);
    setHasError(true);
    
    // 如果有备用图片，使用备用图片
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
    }
    
    // 调用外部传入的 onError 回调
    onError?.(e);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      <img
        {...props}
        src={imageSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
      />
      
      {hasError && !fallbackSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <span className="text-gray-400 text-sm">图片加载失败</span>
        </div>
      )}
    </div>
  );
};

export default OssImage;


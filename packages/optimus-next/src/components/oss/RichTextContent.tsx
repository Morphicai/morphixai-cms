'use client';

import React, { useMemo } from 'react';

/**
 * OSS_FILE_PROXY 前缀标识
 * 用于标识需要处理的 OSS 文件路径
 */
const OSS_FILE_PROXY = '/OSS_FILE_PROXY/';

export interface RichTextContentProps {
  /**
   * 富文本 HTML 内容
   */
  content: string;
  /**
   * 自定义类名
   */
  className?: string;
  /**
   * 是否自动转换所有 OSS 路径（包括图片、视频、音频、链接等）
   */
  transformAllUrls?: boolean;
  /**
   * 自定义样式
   */
  style?: React.CSSProperties;
}

/**
 * 转换 HTML 内容中的 OSS 路径
 * 支持服务端和客户端渲染
 * @param html 原始 HTML 内容
 * @param transformAllUrls 是否转换所有 URL
 * @returns 转换后的 HTML 内容
 */
export const transformOssHtml = (html: string, transformAllUrls = true): string => {
  if (!html) return '';
  
  let fileApiPrefix = process.env.NEXT_PUBLIC_FILE_API_PREFIX || '';
  
  if (!fileApiPrefix) {
    console.warn('NEXT_PUBLIC_FILE_API_PREFIX 环境变量未配置');
    return html;
  }

  // 确保 fileApiPrefix 以斜杠结尾
  if (!fileApiPrefix.endsWith('/')) {
    fileApiPrefix += '/';
  }

  let transformedHtml = html;

  if (transformAllUrls) {
    // 转换所有包含 OSS_FILE_PROXY 的 URL
    // 匹配 src="...", href="...", url('...') 等格式
    const patterns = [
      // img src, video src, audio src, source src
      /(src\s*=\s*["'])\/OSS_FILE_PROXY\//gi,
      // a href, link href
      /(href\s*=\s*["'])\/OSS_FILE_PROXY\//gi,
      // CSS url()
      /(url\s*\(\s*["']?)\/OSS_FILE_PROXY\//gi,
    ];

    patterns.forEach(pattern => {
      transformedHtml = transformedHtml.replace(pattern, `$1${fileApiPrefix}`);
    });
  } else {
    // 只转换图片的 src
    transformedHtml = transformedHtml.replace(
      /(src\s*=\s*["'])\/OSS_FILE_PROXY\//gi,
      `$1${fileApiPrefix}`
    );
  }

  return transformedHtml;
};

/**
 * RichTextContent 组件
 * 
 * 用于渲染富文本内容，自动将内容中的 /OSS_FILE_PROXY/ 前缀替换为环境变量配置的 CDN 地址
 * 
 * 支持的转换：
 * - 图片路径: <img src="/OSS_FILE_PROXY/..." />
 * - 视频路径: <video src="/OSS_FILE_PROXY/..." />
 * - 音频路径: <audio src="/OSS_FILE_PROXY/..." />
 * - 链接路径: <a href="/OSS_FILE_PROXY/..." />
 * - CSS 背景: background: url('/OSS_FILE_PROXY/...')
 * 
 * @example
 * ```tsx
 * // 基本使用
 * <RichTextContent content="<p>文章内容 <img src='/OSS_FILE_PROXY/image.jpg' /></p>" />
 * 
 * // 只转换图片路径
 * <RichTextContent 
 *   content={htmlContent} 
 *   transformAllUrls={false}
 * />
 * 
 * // 自定义样式
 * <RichTextContent 
 *   content={htmlContent}
 *   className="prose prose-lg"
 *   style={{ maxWidth: '800px' }}
 * />
 * ```
 */
export const RichTextContent: React.FC<RichTextContentProps> = ({
  content,
  className = '',
  transformAllUrls = true,
  style,
}) => {
  // 使用 useMemo 缓存转换结果，避免每次渲染都重新转换
  const transformedContent = useMemo(() => {
    return transformOssHtml(content, transformAllUrls);
  }, [content, transformAllUrls]);

  return (
    <div
      className={`rich-text-content ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: transformedContent }}
    />
  );
};

export default RichTextContent;


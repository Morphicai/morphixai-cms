/**
 * 内容工具函数
 * 用于处理富文本内容中的图片URL转换
 */

import { OSS_FILE_PROXY_PREFIX, getFileApiPrefix } from '../constants/oss';
import { getFullFileUrl } from './fileUtils';

/**
 * 将 HTML 内容中的图片 URL 转换为可访问 URL（用于展示）
 * 将 /OSS_FILE_PROXY/ 开头的URL转换为实际可访问的 URL
 * 
 * @param {string} htmlContent - HTML内容
 * @returns {string} 转换后的HTML内容
 * 
 * @example
 * const html = '<img src="/OSS_FILE_PROXY/production/private/test.png?provider=minio" />';
 * const converted = convertContentImageUrls(html);
 * // 返回: '<img src="/api/proxy/file/production/private/test.png?provider=minio" />'
 */
export function convertContentImageUrls(htmlContent) {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return htmlContent || '';
  }

  return htmlContent.replace(
    /<img([^>]*)\ssrc=["']([^"']+)["']([^>]*)>/gi,
    (match, before, src, after) => {
      const convertedUrl = getFullFileUrl(src);
      return `<img${before} src="${convertedUrl}"${after}>`;
    }
  );
}

/**
 * 将 HTML 内容中的图片 URL 转换为存储格式（用于保存）
 * 确保保存时使用 /OSS_FILE_PROXY/ 格式
 * 
 * @param {string} htmlContent - HTML内容
 * @returns {string} 转换后的HTML内容
 * 
 * @example
 * const html = '<img src="/api/proxy/file/production/private/test.png?provider=minio" />';
 * const converted = convertContentImageUrlsToStorage(html);
 * // 返回: '<img src="/OSS_FILE_PROXY/production/private/test.png?provider=minio" />'
 */
export function convertContentImageUrlsToStorage(htmlContent) {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return htmlContent || '';
  }

  const PROXY_PREFIX = getFileApiPrefix();

  return htmlContent.replace(
    /<img([^>]*)\ssrc=["']([^"']+)["']([^>]*)>/gi,
    (match, before, src, after) => {
      let convertedUrl = src;

      // 如果是实际 API 前缀，转换回 /OSS_FILE_PROXY/
      if (src.startsWith(PROXY_PREFIX)) {
        const actualPath = src.replace(PROXY_PREFIX, '');
        convertedUrl = `${OSS_FILE_PROXY_PREFIX}${actualPath}`;
      }
      // 如果已经是 /OSS_FILE_PROXY/，保持不变
      else if (src.startsWith(OSS_FILE_PROXY_PREFIX)) {
        convertedUrl = src;
      }
      // 外部 URL 保持不变
      else if (src.startsWith('http://') || src.startsWith('https://')) {
        convertedUrl = src;
      }

      return `<img${before} src="${convertedUrl}"${after}>`;
    }
  );
}

/**
 * 获取存储格式的 URL（/OSS_FILE_PROXY/ 格式）
 * 如果后端返回的是 /OSS_FILE_PROXY/ 格式，直接返回
 * 如果后端返回的是代理URL格式，转换为 /OSS_FILE_PROXY/ 格式
 * 
 * @param {string} url - 后端返回的URL
 * @returns {string} 原始存储路径（/OSS_FILE_PROXY/ 格式）
 * 
 * @example
 * getStorageUrl('/OSS_FILE_PROXY/production/private/test.png?provider=minio')
 * // 返回: '/OSS_FILE_PROXY/production/private/test.png?provider=minio'
 * 
 * getStorageUrl('/api/proxy/file/production/private/test.png?provider=minio')
 * // 返回: '/OSS_FILE_PROXY/production/private/test.png?provider=minio'
 */
export function getStorageUrl(url) {
  if (!url) return '';

  // 如果已经是 /OSS_FILE_PROXY/ 格式，直接返回
  if (url.startsWith(OSS_FILE_PROXY_PREFIX)) {
    return url;
  }

  // 如果是实际 API 前缀，转换为 /OSS_FILE_PROXY/
  const PROXY_PREFIX = getFileApiPrefix();
  if (url.startsWith(PROXY_PREFIX)) {
    const actualPath = url.replace(PROXY_PREFIX, '');
    return `${OSS_FILE_PROXY_PREFIX}${actualPath}`;
  }

  // 外部 URL 保持不变
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // 其他情况直接返回
  return url;
}


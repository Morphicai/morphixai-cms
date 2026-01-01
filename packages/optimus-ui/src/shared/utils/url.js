/**
 * URL 工具函数
 * @deprecated 请使用 fileUtils.js 中的 getFullFileUrl 函数
 */

import { getFullFileUrl, getFullFileUrls } from './fileUtils';

/**
 * 获取完整的文件访问 URL
 * @deprecated 请使用 fileUtils.js 中的 getFullFileUrl 函数
 * @param {string} url - 文件 URL（可能是完整 URL 或相对路径）
 * @returns {string} 完整的文件访问 URL
 */
export function getFullUrl(url) {
  console.warn('getFullUrl is deprecated. Please use getFullFileUrl from fileUtils.js');
  return getFullFileUrl(url);
}

/**
 * 批量获取完整的文件访问 URL
 * @deprecated 请使用 fileUtils.js 中的 getFullFileUrls 函数
 * @param {string[]} urls - 文件 URL 数组
 * @returns {string[]} 完整的文件访问 URL 数组
 */
export function getFullUrls(urls) {
  console.warn('getFullUrls is deprecated. Please use getFullFileUrls from fileUtils.js');
  return getFullFileUrls(urls);
}

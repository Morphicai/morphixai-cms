/**
 * OSS 文件代理前缀标识
 * 后端返回的文件 URL 使用此前缀标识
 * 前端展示时需要替换为实际可访问的 URL
 */
export const OSS_FILE_PROXY_PREFIX = '/OSS_FILE_PROXY/';

/**
 * 获取文件 API 前缀
 * 从环境变量读取实际的文件访问路径
 * @returns {string} 文件 API 前缀（带末尾斜杠）
 */
export function getFileApiPrefix() {
  const prefix = process.env.REACT_APP_FILE_API_PREFIX || '/api/proxy/file';
  return prefix.endsWith('/') ? prefix : `${prefix}/`;
}


import { OSS_FILE_PROXY_PREFIX, getFileApiPrefix } from '../constants/oss';

/**
 * 将文件路径转换为完整的可访问 URL
 * @param {string} filePath - 后端返回的文件路径（/OSS_FILE_PROXY/ 格式）
 * @returns {string} 完整的可访问 URL
 * 
 * @example
 * // 输入: /OSS_FILE_PROXY/production%2Fprivate%2Ftest%2Fxxx.png?provider=minio
 * // 输出: /api/proxy/file/production%2Fprivate%2Ftest%2Fxxx.png?provider=minio
 * 
 * @example
 * // 输入: https://example.com/image.png
 * // 输出: https://example.com/image.png (不变)
 */
export function getFullFileUrl(filePath) {
    if (!filePath) return '';
    
    // 如果已经是完整 URL（外部链接），直接返回
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        return filePath;
    }
    
    // 如果是 /OSS_FILE_PROXY/ 格式，替换为实际 API 前缀
    if (filePath.startsWith(OSS_FILE_PROXY_PREFIX)) {
        const actualPath = filePath.replace(OSS_FILE_PROXY_PREFIX, '');
        const prefix = getFileApiPrefix();
        return `${prefix}${actualPath}`;
    }
    
    // 其他情况直接返回（异常情况）
    return filePath;
}

/**
 * 批量转换文件 URL
 * @param {Array<string>} filePaths - 文件路径数组
 * @returns {Array<string>} 完整 URL 数组
 */
export function getFullFileUrls(filePaths) {
    if (!Array.isArray(filePaths)) return [];
    return filePaths.map(getFullFileUrl);
}

/**
 * 检查是否为 OSS 文件路径
 * @param {string} filePath - 文件路径
 * @returns {boolean} 是否为 OSS 文件路径
 * 
 * @example
 * isOssFilePath('/OSS_FILE_PROXY/file.png?provider=minio'); // true
 * isOssFilePath('https://example.com/file.png'); // false
 * isOssFilePath('/api/proxy/file/file.png'); // false
 */
export function isOssFilePath(filePath) {
    return filePath && filePath.startsWith(OSS_FILE_PROXY_PREFIX);
}

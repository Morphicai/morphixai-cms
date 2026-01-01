import BaseService from './base/BaseService';
import { request } from '../shared/utils/axios';
import axiosInstance from '../shared/utils/axios';
import storage from '../shared/utils/storage';

/**
 * 文件管理服务
 */
class FileService extends BaseService {
  constructor() {
    super('/files');
  }

  /**
   * 上传文件
   * @param {FormData} formData - 文件数据
   * @param {Object} options - 上传选项
   * @param {boolean} options.needThumbnail - 是否需要缩略图
   * @param {number} options.width - 缩略图宽度
   * @param {number} options.height - 缩略图高度
   * @param {number} options.quality - 缩略图质量
   * @param {Object} options.business - 业务信息
   * @returns {Promise}
   */
  async upload(formData, options = {}) {
    try {
      // 添加额外参数到 FormData
      if (options.needThumbnail !== undefined) {
        formData.append('needThumbnail', options.needThumbnail);
      }
      if (options.width) {
        formData.append('width', options.width);
      }
      if (options.height) {
        formData.append('height', options.height);
      }
      if (options.quality) {
        formData.append('quality', options.quality);
      }
      if (options.business) {
        // 如果是字符串，直接使用；如果是对象，序列化为JSON
        // 避免对字符串执行 JSON.stringify，否则会产生带引号的字符串
        const businessValue = typeof options.business === 'string' 
          ? options.business 
          : JSON.stringify(options.business);
        formData.append('business', businessValue);
      }

      const response = await request({
        type: 'post',
        url: `${this.baseUrl}/upload`,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return {
        success: response.success || response.code === 200,
        data: response.data,
      };
    } catch (error) {
      console.error('文件上传失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 获取上传接口URL（用于antd Upload组件的action属性）
   * @returns {String}
   */
  getUploadUrl() {
    const baseUrl = process.env.REACT_APP_API_BASE_URL;
    return `${baseUrl}${this.baseUrl}/upload`;
  }

  /**
   * 下载文件
   * @param {String|Number} id - 文件ID
   * @returns {Promise}
   */
  async download(id) {
    try {
      // 直接使用 axios 实例，绕过自定义的 transformResponse
      const response = await axiosInstance.get(`${this.baseUrl}/download/${id}`, {
        responseType: 'blob',
        headers: {
          Authorization: storage("access-token") || "",
        },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('文件下载失败:', error);

      // 处理不同类型的错误
      if (error.response) {
        // 服务器返回了错误状态码
        const { status } = error.response;

        if (status === 404) {
          return {
            success: false,
            error: '文件不存在',
          };
        } else if (status === 500) {
          return {
            success: false,
            error: '服务器内部错误',
          };
        }

        return {
          success: false,
          error: `下载失败 (${status})`,
        };
      } else if (error.request) {
        // 请求已发出但没有收到响应
        return {
          success: false,
          error: '网络连接失败',
        };
      } else {
        // 其他错误
        return {
          success: false,
          error: error.message || '下载失败',
        };
      }
    }
  }

  /**
   * 复制文件链接到剪贴板
   * @param {String} url - 文件URL
   * @returns {Promise}
   */
  async copyToClipboard(url) {
    try {
      await navigator.clipboard.writeText(url);
      return { success: true };
    } catch (error) {
      console.error('复制到剪贴板失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取文件预览URL（兼容旧接口）
   * @param {String|Number} id - 文件ID
   * @returns {String}
   */
  getPreviewUrl(id) {
    const baseUrl = process.env.REACT_APP_API_BASE_URL;
    return `${baseUrl}${this.baseUrl}/preview/${id}`;
  }

  /**
   * 获取文件下载URL（兼容旧接口）
   * @param {String|Number} id - 文件ID
   * @returns {String}
   */
  getDownloadUrl(id) {
    const baseUrl = process.env.REACT_APP_API_BASE_URL;
    return `${baseUrl}${this.baseUrl}/download/${id}`;
  }
}

const fileService = new FileService();
export default fileService;
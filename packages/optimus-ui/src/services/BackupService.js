import { request } from '../shared/utils/axios';
import { handleApiError, isSuccess } from '../utils/errorHandler';

/**
 * 数据库备份服务
 * 封装数据库备份相关的 API 调用
 */
class BackupService {
  /**
   * 获取备份列表
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码（从1开始）
   * @param {number} params.size - 每页数量
   * @param {string} params.backupType - 备份类型筛选 (auto/manual)
   * @param {string} params.startDate - 开始日期
   * @param {string} params.endDate - 结束日期
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async list(params, options = {}) {
    const response = await request({
      type: 'get',
      url: '/backups',
      data: params,
      showTip: false,
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '获取备份列表失败' });
    }

    return response;
  }

  /**
   * 手动触发备份
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async triggerBackup(options = {}) {
    const response = await request({
      type: 'post',
      url: '/backups/trigger',
      showTip: false,
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '触发备份失败' });
    }

    return response;
  }

  /**
   * 下载备份文件（后端自动解密）
   * 后端会自动解密并返回 .sql.gz 文件
   * @param {string} fileKey - 文件键名
   * @returns {Promise}
   */
  async downloadBackup(fileKey) {
    try {
      const accessToken = localStorage.getItem('access-token');

      if (!accessToken) {
        throw new Error('未登录或登录已过期');
      }

      // 使用 fetch 下载文件
      const response = await fetch(`/api/backups/download?fileKey=${encodeURIComponent(fileKey)}`, {
        method: 'GET',
        headers: {
          Authorization: accessToken,
        },
      });

      // 检查响应状态
      if (!response.ok) {
        // 尝试解析错误信息
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.msg || errorData.error || `下载失败 (${response.status})`);
      }

      // 获取文件名（从 Content-Disposition 头或 fileKey）
      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = 'backup.sql.gz';
      if (contentDisposition) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (matches != null && matches[1]) {
          fileName = decodeURIComponent(matches[1].replace(/['"]/g, ''));
        }
      } else {
        // 从 fileKey 提取文件名
        fileName = fileKey.split('/').pop().replace(/\.enc$/, '') || 'backup.sql.gz';
      }

      // 获取文件 Blob
      const blob = await response.blob();

      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('下载备份文件失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取备份统计信息
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async getStats(options = {}) {
    const response = await request({
      type: 'get',
      url: '/backups/stats',
      showTip: false,
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '获取备份统计失败' });
    }

    return response;
  }
}

const backupService = new BackupService();
export default backupService;

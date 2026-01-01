import { request } from '../shared/utils/axios';
import { handleApiError, isSuccess } from '../utils/errorHandler';

/**
 * 版本服务
 * 封装文章版本相关的API调用
 */
class VersionService {
  /**
   * 获取版本列表
   * @param {number} articleId - 文章ID
   * @param {Object} params - 查询参数
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async list(articleId, params, options = {}) {
    const response = await request({
      type: 'get',
      url: `/article/${articleId}/version`,
      data: params,
      showTip: false
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '获取版本列表失败' });
    }

    return response;
  }

  /**
   * 获取版本详情
   * @param {number} articleId - 文章ID
   * @param {number} versionId - 版本ID
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async getById(articleId, versionId, options = {}) {
    const response = await request({
      type: 'get',
      url: `/article/${articleId}/version/${versionId}`,
      showTip: false
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '获取版本详情失败' });
    }

    return response;
  }

  /**
   * 回退到指定版本
   * @param {number} articleId - 文章ID
   * @param {number} versionId - 版本ID
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async revert(articleId, versionId, options = {}) {
    const response = await request({
      type: 'post',
      url: `/article/${articleId}/version/${versionId}/revert`,
      showTip: false
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '版本回退失败' });
    }

    return response;
  }

  /**
   * 设置为当前版本
   * @param {number} articleId - 文章ID
   * @param {number} versionId - 版本ID
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async setCurrent(articleId, versionId, options = {}) {
    const response = await request({
      type: 'post',
      url: `/article/${articleId}/version/${versionId}/set-current`,
      showTip: false
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '设置当前版本失败' });
    }

    return response;
  }

  /**
   * 比较版本
   * @param {number} articleId - 文章ID
   * @param {number} versionId1 - 版本1 ID
   * @param {number} versionId2 - 版本2 ID
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async compare(articleId, versionId1, versionId2, options = {}) {
    const response = await request({
      type: 'get',
      url: `/article/${articleId}/version/${versionId1}/compare/${versionId2}`,
      showTip: false
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '版本比较失败' });
    }

    return response;
  }

  /**
   * 获取版本统计信息
   * @param {number} articleId - 文章ID
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async getStats(articleId, options = {}) {
    const response = await request({
      type: 'get',
      url: `/article/${articleId}/version/stats`,
      showTip: false
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '获取版本统计失败' });
    }

    return response;
  }
}

const versionService = new VersionService();
export default versionService;

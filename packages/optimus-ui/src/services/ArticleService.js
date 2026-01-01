import { request } from '../shared/utils/axios';
import { handleApiError, isSuccess } from '../utils/errorHandler';

/**
 * 文章服务
 * 封装文章相关的API调用
 */
class ArticleService {
  /**
   * 获取文章列表
   * @param {Object} params - 查询参数
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async list(params, options = {}) {
    const response = await request({
      type: 'get',
      url: '/article',
      data: params,
      showTip: false
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '获取文章列表失败' });
    }

    return response;
  }

  /**
   * 创建文章
   * @param {Object} data - 文章数据
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async create(data, options = {}) {
    const response = await request({
      type: 'post',
      url: '/article',
      data,
      showTip: false
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '创建文章失败' });
    }

    return response;
  }

  /**
   * 更新文章
   * @param {number} id - 文章ID
   * @param {Object} data - 文章数据
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async update(id, data, options = {}) {
    const response = await request({
      type: 'put',
      url: `/article/${id}`,
      data,
      showTip: false
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '更新文章失败' });
    }

    return response;
  }

  /**
   * 获取文章详情
   * @param {number} id - 文章ID
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async getById(id, options = {}) {
    const response = await request({
      type: 'get',
      url: `/article/${id}`,
      showTip: false
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '获取文章详情失败' });
    }

    return response;
  }

  /**
   * 发布文章
   * @param {number} id - 文章ID
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async publish(id, options = {}) {
    const response = await request({
      type: 'post',
      url: `/article/${id}/publish`,
      showTip: false
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '发布文章失败' });
    }

    return response;
  }

  /**
   * 归档文章
   * @param {number} id - 文章ID
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async archive(id, options = {}) {
    const response = await request({
      type: 'post',
      url: `/article/${id}/archive`,
      showTip: false
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '归档文章失败' });
    }

    return response;
  }

  /**
   * 删除文章
   * @param {number} id - 文章ID
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async delete(id, options = {}) {
    const response = await request({
      type: 'delete',
      url: `/article/${id}`,
      showTip: false
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '删除文章失败' });
    }

    return response;
  }

  /**
   * 搜索文章
   * @param {string} keyword - 搜索关键词
   * @param {Object} params - 其他查询参数
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async search(keyword, params, options = {}) {
    const response = await request({
      type: 'get',
      url: '/article/search',
      data: { keyword, ...params },
      showTip: false
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '搜索文章失败' });
    }

    return response;
  }

  /**
   * 获取文章统计信息
   * @param {Object} params - 查询参数
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async getStats(params, options = {}) {
    const response = await request({
      type: 'get',
      url: '/article/stats',
      data: params,
      showTip: false
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '获取统计信息失败' });
    }

    return response;
  }
}

const articleService = new ArticleService();
export default articleService;

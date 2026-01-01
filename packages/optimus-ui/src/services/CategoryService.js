import { request } from '../shared/utils/axios';
import { handleApiError, isSuccess } from '../utils/errorHandler';

/**
 * 分类服务
 * 封装分类相关的API调用
 */
class CategoryService {
  /**
   * 获取分类列表
   * @param {Object} params - 查询参数
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async list(params, options = {}) {
    const response = await request({
      type: 'get',
      url: '/category',
      data: params,
      showTip: false
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '获取分类列表失败' });
    }

    return response;
  }

  /**
   * 创建分类
   * @param {Object} data - 分类数据
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async create(data, options = {}) {
    const response = await request({
      type: 'post',
      url: '/category',
      data,
      showTip: false
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '创建分类失败' });
    }

    return response;
  }

  /**
   * 更新分类
   * @param {number} id - 分类ID
   * @param {Object} data - 分类数据
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async update(id, data, options = {}) {
    const response = await request({
      type: 'put',
      url: `/category/${id}`,
      data,
      showTip: false
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '更新分类失败' });
    }

    return response;
  }

  /**
   * 删除分类
   * @param {number} id - 分类ID
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async delete(id, options = {}) {
    const response = await request({
      type: 'delete',
      url: `/category/${id}`,
      showTip: false
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '删除分类失败' });
    }

    return response;
  }

  /**
   * 获取分类详情
   * @param {number} id - 分类ID
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async getById(id, options = {}) {
    const response = await request({
      type: 'get',
      url: `/category/${id}`,
      showTip: false
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '获取分类详情失败' });
    }

    return response;
  }

  /**
   * 获取内置分类
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async getBuiltIn(options = {}) {
    const response = await request({
      type: 'get',
      url: '/category/built-in/list',
      showTip: false
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '获取内置分类失败' });
    }

    return response;
  }

  /**
   * 验证文章是否符合分类配置
   * @param {number} categoryId - 分类ID
   * @param {Object} articleData - 文章数据
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async validateArticle(categoryId, articleData, options = {}) {
    const response = await request({
      type: 'post',
      url: `/category/${categoryId}/validate-article`,
      data: articleData,
      showTip: false
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '验证文章失败' });
    }

    return response;
  }
}

const categoryService = new CategoryService();
export default categoryService;

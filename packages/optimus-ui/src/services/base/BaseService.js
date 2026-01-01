import { request } from '../../shared/utils/axios';

/**
 * 基础服务类，提供通用的 CRUD 操作
 */
class BaseService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  /**
   * 获取列表数据
   * @param {Object} params - 查询参数
   * @returns {Promise}
   */
  async list(params = {}) {
    try {
      const response = await request({
        type: 'get',
        url: `${this.baseUrl}/list`,
        data: params,
      });
      return {
        data: response.data?.data || response.data || [],
        total: response.data?.total || 0,
        success: response.success || response.code === 200,
      };
    } catch (error) {
      console.error('获取列表数据失败:', error);
      return {
        data: [],
        total: 0,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 创建新记录
   * @param {Object} data - 创建数据
   * @returns {Promise}
   */
  async create(data) {
    try {
      const response = await request({
        type: 'post',
        url: `${this.baseUrl}/create`,
        data,
      });
      return {
        success: response.success || response.code === 200,
        data: response.data,
      };
    } catch (error) {
      console.error('创建记录失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 更新记录
   * @param {String|Number} id - 记录ID
   * @param {Object} data - 更新数据
   * @returns {Promise}
   */
  async update(id, data) {
    try {
      const response = await request({
        type: 'put',
        url: `${this.baseUrl}/update/${id}`,
        data,
      });
      return {
        success: response.success || response.code === 200,
        data: response.data,
      };
    } catch (error) {
      console.error('更新记录失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 删除记录
   * @param {String|Number} id - 记录ID
   * @returns {Promise}
   */
  async delete(id) {
    try {
      const response = await request({
        type: 'delete',
        url: `${this.baseUrl}/${id}`, // 修改为RESTful风格：DELETE /api/files/{id}
      });
      return {
        success: response.success || response.code === 200,
        data: response.data,
      };
    } catch (error) {
      console.error('删除记录失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 获取记录详情
   * @param {String|Number} id - 记录ID
   * @returns {Promise}
   */
  async detail(id) {
    try {
      const response = await request({
        type: 'get',
        url: `${this.baseUrl}/detail/${id}`,
      });
      return {
        success: response.success || response.code === 200,
        data: response.data,
      };
    } catch (error) {
      console.error('获取记录详情失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default BaseService;
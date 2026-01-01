import BaseService from './base/BaseService';
import { request } from '../shared/utils/axios';

/**
 * 活动服务类
 */
class ActivityService extends BaseService {
  constructor() {
    super('/biz/activity');
  }

  /**
   * 获取活动列表
   * @param {Object} params - 查询参数
   * @returns {Promise}
   */
  async list(params = {}) {
    try {
      const { page = 1, pageSize = 10, activityCode, name, type, startTime, endTime } = params;

      const response = await request({
        type: 'get',
        url: '/biz/activity',
        data: {
          page,
          pageSize,
          activityCode,
          name,
          type,
          startTime,
          endTime,
        },
      });

      if (response.code === 200 && response.data) {
        return {
          data: response.data.items || [],
          total: response.data.total || 0,
          success: true,
        };
      }

      return {
        data: [],
        total: 0,
        success: false,
        error: response.msg || '获取列表失败',
      };
    } catch (error) {
      console.error('获取活动列表失败:', error);
      return {
        data: [],
        total: 0,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 创建活动
   * @param {Object} data - 活动数据
   * @returns {Promise}
   */
  async create(data) {
    try {
      const response = await request({
        type: 'post',
        url: '/biz/activity',
        data,
      });

      if (response.code === 200) {
        return {
          success: true,
          data: response.data,
          message: response.msg || '创建成功',
        };
      }

      return {
        success: false,
        error: response.msg || '创建失败',
      };
    } catch (error) {
      console.error('创建活动失败:', error);
      return {
        success: false,
        error: error.message || '创建失败',
      };
    }
  }

  /**
   * 更新活动
   * @param {Number} id - 活动ID
   * @param {Object} data - 活动数据
   * @returns {Promise}
   */
  async update(id, data) {
    try {
      const response = await request({
        type: 'put',
        url: `/biz/activity/${id}`,
        data,
      });

      if (response.code === 200) {
        return {
          success: true,
          data: response.data,
          message: response.msg || '更新成功',
        };
      }

      return {
        success: false,
        error: response.msg || '更新失败',
      };
    } catch (error) {
      console.error('更新活动失败:', error);
      return {
        success: false,
        error: error.message || '更新失败',
      };
    }
  }

  /**
   * 删除活动
   * @param {Number} id - 活动ID
   * @returns {Promise}
   */
  async delete(id) {
    try {
      const response = await request({
        type: 'delete',
        url: `/biz/activity/${id}`,
      });

      if (response.code === 200) {
        return {
          success: true,
          message: response.msg || '删除成功',
        };
      }

      return {
        success: false,
        error: response.msg || '删除失败',
      };
    } catch (error) {
      console.error('删除活动失败:', error);
      return {
        success: false,
        error: error.message || '删除失败',
      };
    }
  }

  /**
   * 根据ID获取活动详情
   * @param {Number} id - 活动ID
   * @returns {Promise}
   */
  async getById(id) {
    try {
      const response = await request({
        type: 'get',
        url: `/biz/activity/${id}`,
      });

      if (response.code === 200) {
        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: false,
        error: response.msg || '获取详情失败',
      };
    } catch (error) {
      console.error('获取活动详情失败:', error);
      return {
        success: false,
        error: error.message || '获取详情失败',
      };
    }
  }

  /**
   * 根据活动代码获取活动详情
   * @param {String} activityCode - 活动代码
   * @returns {Promise}
   */
  async getByCode(activityCode) {
    try {
      const response = await request({
        type: 'get',
        url: `/biz/activity/code/${activityCode}`,
      });

      if (response.code === 200) {
        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: false,
        error: response.msg || '获取详情失败',
      };
    } catch (error) {
      console.error('获取活动详情失败:', error);
      return {
        success: false,
        error: error.message || '获取详情失败',
      };
    }
  }

  /**
   * 更新活动状态
   * @param {Number} id - 活动ID
   * @param {String} status - 状态（enabled/disabled）
   * @returns {Promise}
   */
  async updateStatus(id, status) {
    try {
      const response = await request({
        type: 'put',
        url: `/biz/activity/${id}/status/${status}`,
      });

      if (response.code === 200) {
        return {
          success: true,
          data: response.data,
          message: response.msg || '状态更新成功',
        };
      }

      return {
        success: false,
        error: response.msg || '状态更新失败',
      };
    } catch (error) {
      console.error('更新活动状态失败:', error);
      return {
        success: false,
        error: error.message || '状态更新失败',
      };
    }
  }
}

const activityService = new ActivityService();
export default activityService;


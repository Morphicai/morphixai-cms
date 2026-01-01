import BaseService from './base/BaseService';
import { request } from '../shared/utils/axios';

/**
 * 用户服务类
 */
class UserService extends BaseService {
  constructor() {
    super('/user');
  }

  /**
   * 获取用户列表
   * @param {Object} params - 查询参数
   * @returns {Promise}
   */
  async list(params = {}) {
    try {
      const { page = 0, size = 100, ...searchParams } = params;

      const response = await request({
        type: 'get',
        url: '/user/list',
        data: {
          page,
          size,
          ...searchParams,
        },
      });

      return {
        data: response.data?.list || response.data || [],
        total: response.data?.total || 0,
        success: true,
      };
    } catch (error) {
      console.error('获取用户列表失败:', error);
      return {
        data: [],
        total: 0,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 创建用户
   * @param {Object} userData - 用户数据
   * @returns {Promise}
   */
  async create(userData) {
    try {
      const { avatar, confirmPassword, ...data } = userData;
      const avatarString = avatar
        ? typeof avatar === 'object'
          ? avatar.url
          : avatar
        : '';

      // 处理角色ID，确保为字符串数组
      if (data.roleIds) {
        data.roleIds = data.roleIds.map(roleId => String(roleId));
      }

      const response = await request({
        type: 'post',
        url: '/register',
        data: {
          ...data,
          avatar: avatarString,
        },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('创建用户失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 更新用户
   * @param {String|Number} id - 用户ID
   * @param {Object} userData - 用户数据
   * @returns {Promise}
   */
  async update(id, userData) {
    try {
      const { avatar, ...data } = userData;
      const avatarString = avatar
        ? typeof avatar === 'object'
          ? avatar.url
          : avatar
        : '';

      // 处理角色ID
      data.roleIds = (data?.roleIds || []).map((roleId) => {
        return roleId + '';
      });

      const response = await request({
        type: 'put',
        url: '/user',
        data: {
          ...data,
          id,
          avatar: avatarString,
        },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('更新用户失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 获取用户角色
   * @param {String|Number} id - 用户ID
   * @returns {Promise}
   */
  async getUserRoles(id) {
    try {
      const response = await request({
        type: 'get',
        url: `/user/${id}/role`,
      });
      return {
        success: true,
        data: { roleIds: response.data },
      };
    } catch (error) {
      console.error('获取用户角色失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 重置用户密码
   * @param {String|Number} id - 用户ID
   * @param {String} newPassword - 新密码
   * @returns {Promise}
   */
  async resetPassword(id, newPassword) {
    try {
      const response = await request({
        type: 'post',
        url: `/user/reset-password/${id}`,
        data: {
          password: newPassword,
        },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('重置密码失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 更新用户状态
   * @param {String|Number} id - 用户ID
   * @param {Number} status - 状态值
   * @returns {Promise}
   */
  async updateStatus(id, status) {
    try {
      const response = await request({
        type: 'patch',
        url: `/user/status/${id}`,
        data: { status },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('更新用户状态失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

const userService = new UserService();
export default userService;
import BaseService from './base/BaseService';
import { request } from '../shared/utils/axios';

/**
 * 角色服务类
 */
class RoleService extends BaseService {
  constructor() {
    super('/role');
  }

  /**
   * 获取角色列表
   * @param {Object} params - 查询参数
   * @returns {Promise}
   */
  async list(params = {}) {
    try {
      const response = await request({
        type: 'get',
        url: '/role/list',
        data: params
      });
      return {
        data: response.data?.list || response.data || [],
        total: response.data?.total || 0,
        success: response.success,
      };
    } catch (error) {
      console.error('获取角色列表失败:', error);
      return {
        data: [],
        total: 0,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 创建角色
   * @param {Object} roleData - 角色数据
   * @returns {Promise}
   */
  async create(roleData) {
    try {
      const data = { ...roleData };
      // 使用权限编码而不是菜单ID
      data.menuCodes = data?.menuCodes || [];

      const response = await request({
        type: 'post',
        url: '/role',
        data
      });
      return {
        success: response.success,
        data: response.data,
      };
    } catch (error) {
      console.error('创建角色失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 更新角色
   * @param {String|Number} id - 角色ID
   * @param {Object} roleData - 角色数据
   * @returns {Promise}
   */
  async update(id, roleData) {
    try {
      const data = { ...roleData, id };
      // 使用权限编码而不是菜单ID
      if (data.menuCodes) {
        data.menuCodes = data.menuCodes || [];
      }

      const response = await request({
        type: 'put',
        url: '/role',
        data
      });
      return {
        success: response.success,
        data: response.data,
      };
    } catch (error) {
      console.error('更新角色失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 获取角色权限
   * @param {String|Number} id - 角色ID
   * @returns {Promise}
   */
  async getRolePermissions(id) {
    try {
      const response = await request({
        type: 'get',
        url: `/role/one/${id}/perms`
      });
      return {
        success: response.success,
        data: { menuIds: response.data || [] },
      };
    } catch (error) {
      console.error('获取角色权限失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 更新用户角色
   * @param {Object} data - 用户角色数据
   * @returns {Promise}
   */
  async updateUserRole(data) {
    try {
      const response = await request({
        type: 'post',
        url: '/user/role/update',
        data
      });
      return {
        success: response.success,
        data: response.data,
      };
    } catch (error) {
      console.error('更新用户角色失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 设置角色负责人
   * @param {Array} userIds - 用户ID数组
   * @param {String|Number} roleId - 角色ID
   * @returns {Promise}
   */
  async setManager(userIds, roleId) {
    try {
      const response = await request({
        type: 'post',
        url: '/role/createRoleLeaders',
        data: {
          roleId,
          leaders: userIds,
        }
      });
      return {
        success: response.success,
        data: response.data,
      };
    } catch (error) {
      console.error('设置角色负责人失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 移除角色负责人
   * @param {Array} userIds - 用户ID数组
   * @param {String|Number} roleId - 角色ID
   * @returns {Promise}
   */
  async removeManager(userIds, roleId) {
    try {
      const response = await request({
        type: 'post',
        url: '/role/removeRoleLeaders',
        data: {
          roleId,
          leaders: userIds,
        }
      });
      return {
        success: response.success,
        data: response.data,
      };
    } catch (error) {
      console.error('移除角色负责人失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 获取角色负责人
   * @param {String|Number} roleId - 角色ID
   * @returns {Promise}
   */
  async getLeaders(roleId) {
    try {
      const response = await request({
        type: 'get',
        url: `/role/leaders/${roleId}`
      });
      return {
        success: response.success,
        data: response.data,
      };
    } catch (error) {
      console.error('获取角色负责人失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }



  /**
   * 删除角色
   * @param {String|Number} id - 角色ID
   * @returns {Promise}
   */
  async delete(id) {
    try {
      const response = await request({
        type: 'delete',
        url: `/role/${id}`
      });
      return {
        success: response.success,
        data: response.data,
      };
    } catch (error) {
      console.error('删除角色失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * @deprecated 已废弃：系统已改为基于常量菜单，不再从数据库获取菜单列表
   * 获取所有菜单列表（用于权限分配）
   */
  async getAllMenus() {
    console.warn('getAllMenus 方法已废弃：系统已改为基于常量菜单，请使用 SYSTEM_ROUTES 常量');
    return {
      success: false,
      data: [],
      error: '该功能已废弃，请使用常量菜单配置',
    };
  }

  /**
   * 获取角色的菜单权限
   * @param {String|Number} roleId - 角色ID
   * @returns {Promise}
   */
  async getRoleMenus(roleId) {
    try {
      const response = await request({
        type: 'get',
        url: `/role/one/${roleId}/perms`
      });
      return {
        success: response.success,
        data: response.data || [],
      };
    } catch (error) {
      console.error('获取角色菜单权限失败:', error);
      return {
        success: false,
        data: [],
        error: error.message,
      };
    }
  }

  /**
   * 更新角色菜单权限
   * @param {String|Number} roleId - 角色ID
   * @param {Array} menuCodes - 权限编码数组
   * @returns {Promise}
   */
  async updateRoleMenus(roleId, menuCodes) {
    try {
      const response = await request({
        type: 'put',
        url: '/role',
        data: {
          id: String(roleId),
          menuCodes: menuCodes // 直接使用权限编码字符串数组
        }
      });
      
      return {
        success: response.success,
        data: response.data,
      };
    } catch (error) {
      console.error('更新角色菜单权限失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

const roleServiceInstance = new RoleService();
export default roleServiceInstance;
/**
 * 简化的权限管理工具 - 前后端共享
 * 
 * 简化原则：
 * 1. 只控制菜单级别权限，不控制按钮级别
 * 2. 权限检查基于菜单编码
 * 3. 超级管理员拥有所有权限
 */

import { getAllPermissionCodes, getMenuByCode } from '../constants/menus.js';

/**
 * 权限管理器类
 */
export class PermissionManager {
  constructor() {
    this.userPermissions = [];
    this.isSuperAdmin = false;
  }

  /**
   * 设置用户权限
   * @param {Array} permissions 权限编码数组
   */
  setUserPermissions(permissions) {
    this.userPermissions = permissions || [];
    this.isSuperAdmin = this.userPermissions.includes('*');
    return this;
  }

  /**
   * 检查用户是否有指定权限
   * @param {string} permissionCode 权限编码
   * @returns {boolean} 是否有权限
   */
  hasPermission(permissionCode) {
    // 超级管理员拥有所有权限
    if (this.isSuperAdmin) {
      return true;
    }

    return this.userPermissions.includes(permissionCode);
  }

  /**
   * 批量检查权限
   * @param {Array} permissionCodes 权限编码数组
   * @returns {Object} 权限检查结果
   */
  hasPermissions(permissionCodes) {
    const result = {};
    permissionCodes.forEach(code => {
      result[code] = this.hasPermission(code);
    });
    return result;
  }

  /**
   * 获取用户可访问的菜单权限
   * @returns {Array} 可访问的菜单权限数组
   */
  getAccessibleMenus() {
    if (this.isSuperAdmin) {
      return getAllPermissionCodes();
    }

    return this.userPermissions.filter(permission => {
      const menu = getMenuByCode(permission);
      return menu && menu.type === 1; // 只返回菜单类型的权限
    });
  }

  /**
   * 获取权限统计信息
   * @returns {Object} 权限统计
   */
  getPermissionStats() {
    const allPermissions = getAllPermissionCodes();
    const userPermissionCount = this.isSuperAdmin
      ? allPermissions.length
      : this.userPermissions.length;

    return {
      totalPermissions: allPermissions.length,
      userPermissions: userPermissionCount,
      permissionRate: (userPermissionCount / allPermissions.length * 100).toFixed(2) + '%',
      isSuperAdmin: this.isSuperAdmin
    };
  }

  /**
   * 检查是否为超级管理员
   * @returns {boolean} 是否为超级管理员
   */
  isSuperAdministrator() {
    return this.isSuperAdmin;
  }
}

/**
 * 权限检查工具函数
 */
export const PermissionUtils = {
  /**
   * 检查权限并执行回调
   * @param {PermissionManager} permissionManager 权限管理器实例
   * @param {string} permission 权限编码
   * @param {Function} callback 回调函数
   * @param {Function} fallback 无权限时的回调
   */
  checkAndExecute(permissionManager, permission, callback, fallback = null) {
    if (permissionManager.hasPermission(permission)) {
      return callback();
    } else if (fallback) {
      return fallback();
    }
    return null;
  },

  /**
   * 过滤有权限的项目
   * @param {PermissionManager} permissionManager 权限管理器实例
   * @param {Array} items 项目数组
   * @param {Function} getPermission 获取权限的函数
   * @returns {Array} 过滤后的数组
   */
  filterByPermission(permissionManager, items, getPermission) {
    return items.filter(item => {
      const permission = getPermission(item);
      return permissionManager.hasPermission(permission);
    });
  },

  /**
   * 生成权限报告
   * @param {PermissionManager} permissionManager 权限管理器实例
   * @returns {Object} 权限报告
   */
  generateReport(permissionManager) {
    const stats = permissionManager.getPermissionStats();
    const accessibleMenus = permissionManager.getAccessibleMenus();

    return {
      ...stats,
      accessibleMenusCount: accessibleMenus.length,
      accessibleMenus: accessibleMenus.map(code => {
        const menu = getMenuByCode(code);
        return {
          code,
          name: menu?.name,
          path: menu?.path
        };
      })
    };
  }
};

/**
 * 创建权限管理器实例
 * @param {Array} userPermissions 用户权限数组
 * @returns {PermissionManager} 权限管理器实例
 */
export function createPermissionManager(userPermissions = []) {
  return new PermissionManager().setUserPermissions(userPermissions);
}

export default {
  PermissionManager,
  PermissionUtils,
  createPermissionManager
};
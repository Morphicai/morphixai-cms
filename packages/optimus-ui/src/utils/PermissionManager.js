/**
 * 权限管理工具
 * 
 * 提供权限相关的工具函数和管理功能
 */

import {
  getAllPermissionCodes,
  generateCASLRules,
  getFlatRoutes
} from '../constants/routes.js';

/**
 * 权限管理器类
 */
class PermissionManager {
  constructor() {
    this.userPermissions = [];
    this.caslRules = [];
  }

  /**
   * 设置用户权限
   * @param {Array} permissions 权限编码数组
   */
  setUserPermissions(permissions) {
    this.userPermissions = permissions || [];
    this.caslRules = generateCASLRules(this.userPermissions);
    return this;
  }

  /**
   * 检查用户是否有指定权限
   * @param {string} permissionCode 权限编码
   * @returns {boolean} 是否有权限
   */
  hasPermission(permissionCode) {
    // 超级管理员拥有所有权限
    if (this.userPermissions.includes('*')) {
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
   * 检查用户是否有访问指定路由的权限
   * @param {string} path 路由路径
   * @returns {boolean} 是否有权限
   */
  canAccessRoute(path) {
    const routes = getFlatRoutes();
    const route = routes.find(r => r.path === path);

    if (!route) {
      return false;
    }

    return this.hasPermission(route.code);
  }

  /**
   * 获取用户可访问的路由列表
   * @returns {Array} 可访问的路由数组
   */
  getAccessibleRoutes() {
    const routes = getFlatRoutes();
    return routes.filter(route =>
      route.path && this.hasPermission(route.code)
    );
  }

  /**
   * 获取用户的按钮权限（已废弃）
   * @deprecated 按钮级别权限控制已移除，请在组件内部基于菜单权限控制
   * @param {string} module 模块名称（可选）
   * @returns {Object|Array} 空对象或空数组
   */
  getButtonPermissions(module = null) {
    console.warn('getButtonPermissions 已废弃：按钮级别权限控制已移除，请在组件内部基于菜单权限控制');
    return module ? [] : {};
  }

  /**
   * 获取CASL规则
   * @returns {Array} CASL规则数组
   */
  getCASLRules() {
    return this.caslRules;
  }

  /**
   * 获取权限统计信息
   * @returns {Object} 权限统计
   */
  getPermissionStats() {
    const allPermissions = getAllPermissionCodes();
    const userPermissionCount = this.userPermissions.includes('*')
      ? allPermissions.length
      : this.userPermissions.length;

    return {
      totalPermissions: allPermissions.length,
      userPermissions: userPermissionCount,
      permissionRate: (userPermissionCount / allPermissions.length * 100).toFixed(2) + '%',
      isSuperAdmin: this.userPermissions.includes('*')
    };
  }

  /**
   * 导出用户权限配置
   * @returns {Object} 权限配置
   */
  exportPermissionConfig() {
    return {
      userPermissions: this.userPermissions,
      caslRules: this.caslRules,
      accessibleRoutes: this.getAccessibleRoutes(),
      buttonPermissions: this.getButtonPermissions(),
      stats: this.getPermissionStats(),
      exportTime: new Date().toISOString()
    };
  }
}

/**
 * 全局权限管理器实例
 */
export const globalPermissionManager = new PermissionManager();

/**
 * 权限检查装饰器（用于类方法）
 * @param {string} permissionCode 权限编码
 */
export function requirePermission(permissionCode) {
  return function (target, propertyName, descriptor) {
    const method = descriptor.value;

    descriptor.value = function (...args) {
      if (!globalPermissionManager.hasPermission(permissionCode)) {
        console.warn(`权限不足: 需要 ${permissionCode} 权限`);
        return null;
      }
      return method.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * React Hook - 权限检查
 * @param {string|Array} permissions 权限编码或权限编码数组
 * @returns {boolean|Object} 权限检查结果
 */
export function usePermission(permissions) {
  if (typeof permissions === 'string') {
    return globalPermissionManager.hasPermission(permissions);
  }

  if (Array.isArray(permissions)) {
    return globalPermissionManager.hasPermissions(permissions);
  }

  return false;
}

/**
 * React Hook - 路由权限检查
 * @param {string} path 路由路径
 * @returns {boolean} 是否可访问
 */
export function useRoutePermission(path) {
  return globalPermissionManager.canAccessRoute(path);
}

/**
 * React Hook - 按钮权限（已废弃）
 * @deprecated 按钮级别权限控制已移除，请在组件内部基于菜单权限控制
 * @param {string} module 模块名称
 * @returns {Array} 空数组
 */
export function useButtonPermissions(module) {
  console.warn('useButtonPermissions 已废弃：按钮级别权限控制已移除，请在组件内部基于菜单权限控制');
  return [];
}

/**
 * 权限验证中间件（用于路由守卫）
 * @param {string} requiredPermission 必需的权限
 * @returns {Function} 中间件函数
 */
export function createPermissionGuard(requiredPermission) {
  return (to, from, next) => {
    if (globalPermissionManager.hasPermission(requiredPermission)) {
      next();
    } else {
      console.warn(`访问被拒绝: 需要 ${requiredPermission} 权限`);
      next('/403'); // 跳转到无权限页面
    }
  };
}

/**
 * 权限工具函数集合
 */
export const PermissionUtils = {
  /**
   * 检查权限并执行回调
   * @param {string} permission 权限编码
   * @param {Function} callback 回调函数
   * @param {Function} fallback 无权限时的回调
   */
  checkAndExecute(permission, callback, fallback = null) {
    if (globalPermissionManager.hasPermission(permission)) {
      return callback();
    } else if (fallback) {
      return fallback();
    }
    return null;
  },

  /**
   * 过滤有权限的项目
   * @param {Array} items 项目数组
   * @param {Function} getPermission 获取权限的函数
   * @returns {Array} 过滤后的数组
   */
  filterByPermission(items, getPermission) {
    return items.filter(item => {
      const permission = getPermission(item);
      return globalPermissionManager.hasPermission(permission);
    });
  },

  /**
   * 根据权限分组项目
   * @param {Array} items 项目数组
   * @param {Function} getPermission 获取权限的函数
   * @returns {Object} 分组结果
   */
  groupByPermission(items, getPermission) {
    return items.reduce((groups, item) => {
      const permission = getPermission(item);
      const hasPermission = globalPermissionManager.hasPermission(permission);
      const key = hasPermission ? 'allowed' : 'denied';

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);

      return groups;
    }, {});
  },

  /**
   * 生成权限报告
   * @returns {Object} 权限报告
   */
  generateReport() {
    const stats = globalPermissionManager.getPermissionStats();
    const accessibleRoutes = globalPermissionManager.getAccessibleRoutes();

    return {
      ...stats,
      accessibleRoutesCount: accessibleRoutes.length,
      buttonPermissionsCount: 0, // 按钮权限已移除
      detailedPermissions: {
        routes: accessibleRoutes.map(r => ({
          path: r.path,
          name: r.name,
          code: r.code
        })),
        buttons: {} // 按钮权限已移除
      }
    };
  }
};

export default PermissionManager;
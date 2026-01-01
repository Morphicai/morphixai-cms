/**
 * 菜单迁移和验证工具函数
 */

import { SYSTEM_MENUS, getFlatMenus, getMenuTree } from '../constants/menus';

/**
 * 验证菜单配置的完整性和正确性
 * @returns {Object} 验证结果
 */
export function validateMenuConfig() {
  const flatMenus = getFlatMenus();
  const errors = [];
  const warnings = [];

  // 检查ID唯一性
  const ids = flatMenus.map(menu => menu.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    errors.push(`重复的菜单ID: ${duplicateIds.join(', ')}`);
  }

  // 检查权限编码唯一性
  const codes = flatMenus.map(menu => menu.code).filter(Boolean);
  const duplicateCodes = codes.filter((code, index) => codes.indexOf(code) !== index);
  if (duplicateCodes.length > 0) {
    errors.push(`重复的权限编码: ${duplicateCodes.join(', ')}`);
  }

  // 检查父子关系
  flatMenus.forEach(menu => {
    if (menu.parentId && menu.parentId !== null) {
      const parent = flatMenus.find(m => m.id === menu.parentId);
      if (!parent) {
        errors.push(`菜单 ${menu.id} 的父菜单 ${menu.parentId} 不存在`);
      }
    }
  });

  // 检查必填字段
  flatMenus.forEach(menu => {
    if (!menu.id) {
      errors.push(`菜单缺少ID: ${JSON.stringify(menu)}`);
    }
    if (!menu.name) {
      errors.push(`菜单 ${menu.id} 缺少名称`);
    }
    if (!menu.code) {
      warnings.push(`菜单 ${menu.id} 缺少权限编码`);
    }
    if (menu.type === undefined || menu.type === null) {
      errors.push(`菜单 ${menu.id} 缺少类型`);
    }
  });

  // 检查权限编码格式
  flatMenus.forEach(menu => {
    if (menu.code && menu.type === 3) { // 按钮类型
      if (!menu.code.includes(':')) {
        warnings.push(`按钮权限 ${menu.code} 建议使用 "模块:操作" 格式`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    totalMenus: flatMenus.length,
    menusByType: {
      menus: flatMenus.filter(m => m.type === 1).length,
      tabs: flatMenus.filter(m => m.type === 2).length,
      buttons: flatMenus.filter(m => m.type === 3).length
    }
  };
}

/**
 * 生成数据库迁移SQL（用于清理旧的菜单数据）
 * @returns {string} SQL语句
 */
export function generateCleanupSQL() {
  return `
-- 清理旧的菜单数据
-- 注意：执行前请备份数据库

-- 1. 清理角色菜单关联
DELETE FROM sys_role_menu;

-- 2. 清理菜单权限关联  
DELETE FROM sys_menu_perm;

-- 3. 清理菜单数据
DELETE FROM sys_menu;

-- 4. 重置自增ID（可选）
ALTER TABLE sys_menu AUTO_INCREMENT = 1;
ALTER TABLE sys_menu_perm AUTO_INCREMENT = 1;
ALTER TABLE sys_role_menu AUTO_INCREMENT = 1;

-- 注意：执行后需要重新配置角色权限
`;
}

/**
 * 对比数据库菜单和本地菜单配置的差异
 * @param {Array} dbMenus 数据库中的菜单数据
 * @returns {Object} 差异对比结果
 */
export function compareWithDatabase(dbMenus = []) {
  const localMenus = getFlatMenus();
  const localCodes = new Set(localMenus.map(m => m.code).filter(Boolean));
  const dbCodes = new Set(dbMenus.map(m => m.code).filter(Boolean));

  const onlyInLocal = [...localCodes].filter(code => !dbCodes.has(code));
  const onlyInDb = [...dbCodes].filter(code => !localCodes.has(code));
  const common = [...localCodes].filter(code => dbCodes.has(code));

  return {
    onlyInLocal,
    onlyInDb,
    common,
    summary: {
      localTotal: localCodes.size,
      dbTotal: dbCodes.size,
      commonCount: common.length,
      localOnlyCount: onlyInLocal.length,
      dbOnlyCount: onlyInDb.length
    }
  };
}

/**
 * 生成权限编码映射表（用于数据迁移）
 * @returns {Object} 权限编码映射
 */
export function generatePermissionMapping() {
  const flatMenus = getFlatMenus();
  const mapping = {};

  flatMenus.forEach(menu => {
    if (menu.code) {
      mapping[menu.code] = {
        id: menu.id,
        name: menu.name,
        type: menu.type,
        description: menu.description,
        parentId: menu.parentId,
        path: menu.path
      };
    }
  });

  return mapping;
}

/**
 * 根据用户权限生成CASL规则
 * @param {Array} userPermissions 用户权限编码数组
 * @returns {Array} CASL权限规则
 */
export function generateCASLRules(userPermissions = []) {
  const rules = [];

  userPermissions.forEach(permission => {
    if (permission.includes(':')) {
      // 按钮权限：perm_users:edit -> { action: 'edit', subject: 'perm_users' }
      const [subject, action] = permission.split(':');
      rules.push({ action, subject });
    } else {
      // 菜单权限：Dashboard -> { action: 'read', subject: 'dashboard' }
      rules.push({
        action: 'read',
        subject: permission.toLowerCase()
      });
    }
  });

  return rules;
}

/**
 * 生成路由配置（替代原有的动态路由生成）
 * @param {Array} userPermissions 用户权限编码数组
 * @param {Array} routesMap 本地路由映射
 * @returns {Array} 路由配置数组
 */
export function generateRoutes(userPermissions = [], routesMap = []) {
  const menuTree = getMenuTree(userPermissions);
  const routes = [];

  function processMenus(menus) {
    menus.forEach(menu => {
      if (menu.type === 1 && menu.path) { // 只处理有路径的菜单
        // 查找对应的路由配置
        const routeConfig = routesMap.find(route =>
          route.key === menu.code || route.path === menu.path
        );

        if (routeConfig) {
          routes.push({
            ...routeConfig,
            id: menu.id,
            page: menu.name,
            key: menu.code,
            pid: menu.parentId || "0",
            sort: menu.orderNum || 0,
            icon: menu.icon
          });
        }
      }

      if (menu.children) {
        processMenus(menu.children);
      }
    });
  }

  processMenus(menuTree);
  return routes.sort((a, b) => (b.sort || 0) - (a.sort || 0));
}

/**
 * 导出菜单配置为JSON格式（用于备份或导入其他系统）
 * @returns {string} JSON字符串
 */
export function exportMenuConfig() {
  return JSON.stringify({
    version: '1.0.0',
    exportTime: new Date().toISOString(),
    menus: SYSTEM_MENUS,
    metadata: {
      totalMenus: getFlatMenus().length,
      validation: validateMenuConfig()
    }
  }, null, 2);
}

/**
 * 生成权限文档（Markdown格式）
 * @returns {string} Markdown文档
 */
export function generatePermissionDocs() {
  const flatMenus = getFlatMenus();
  const menusByType = {
    1: flatMenus.filter(m => m.type === 1),
    2: flatMenus.filter(m => m.type === 2),
    3: flatMenus.filter(m => m.type === 3)
  };

  let docs = `# 系统权限文档\n\n`;
  docs += `生成时间: ${new Date().toLocaleString()}\n\n`;
  docs += `## 权限统计\n\n`;
  docs += `- 菜单权限: ${menusByType[1].length} 个\n`;
  docs += `- 标签页权限: ${menusByType[2].length} 个\n`;
  docs += `- 按钮权限: ${menusByType[3].length} 个\n`;
  docs += `- 总计: ${flatMenus.length} 个\n\n`;

  docs += `## 菜单权限\n\n`;
  docs += `| 权限编码 | 菜单名称 | 路径 | 描述 |\n`;
  docs += `|---------|---------|------|------|\n`;
  menusByType[1].forEach(menu => {
    docs += `| ${menu.code || ''} | ${menu.name} | ${menu.path || ''} | ${menu.description || ''} |\n`;
  });

  docs += `\n## 按钮权限\n\n`;
  docs += `| 权限编码 | 按钮名称 | 所属模块 | 描述 |\n`;
  docs += `|---------|---------|---------|------|\n`;
  menusByType[3].forEach(menu => {
    const module = menu.code ? menu.code.split(':')[0] : '';
    docs += `| ${menu.code || ''} | ${menu.name} | ${module} | ${menu.description || ''} |\n`;
  });

  return docs;
}

// 开发环境下的调试函数
export function debugMenuConfig() {
  if (process.env.NODE_ENV === 'development') {
    console.group('菜单配置调试信息');

    const validation = validateMenuConfig();
    console.log('验证结果:', validation);

    const flatMenus = getFlatMenus();
    console.log('扁平化菜单:', flatMenus);

    const menuTree = getMenuTree();
    console.log('菜单树结构:', menuTree);

    console.groupEnd();
  }
}

export default {
  validateMenuConfig,
  generateCleanupSQL,
  compareWithDatabase,
  generatePermissionMapping,
  generateCASLRules,
  generateRoutes,
  exportMenuConfig,
  generatePermissionDocs,
  debugMenuConfig
};
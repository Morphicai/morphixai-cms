/**
 * 系统菜单常量配置 - 前后端共享
 * 
 * 简化的权限控制方案：
 * 1. 只控制菜单级别的权限，不再控制按钮级别
 * 2. 菜单信息完全硬编码，不依赖数据库
 * 3. 前后端共用同一套菜单配置
 */

// 菜单类型枚举
export const MENU_TYPES = {
  MENU: 1,      // 菜单/目录
  TAB: 2        // 标签页
  // BUTTON: 3  // 按钮/操作 - 已移除，不再支持按钮级别权限控制
};

// 系统全量菜单配置
export const SYSTEM_MENUS = [
  // 1. 工作台
  {
    id: "dashboard",
    name: "工作台",
    code: "Dashboard",
    type: MENU_TYPES.MENU,
    path: "/",
    icon: "DashboardOutlined",
    orderNum: 10,
    parentId: null,
    description: "系统首页，展示工作台和数据概览"
  },

  // 2. 权限管理
  {
    id: "permission_management",
    name: "权限管理",
    code: "PermissionManagement",
    type: MENU_TYPES.MENU,
    icon: "SafetyOutlined",
    orderNum: 20,
    parentId: null,
    description: "系统权限管理模块",
    children: [
      {
        id: "user_list",
        name: "用户列表",
        code: "PermUsers",
        type: MENU_TYPES.MENU,
        path: "/sys/user",
        icon: "UserOutlined",
        orderNum: 10,
        parentId: "permission_management",
        description: "系统用户列表管理"
      },
      {
        id: "role_management",
        name: "角色管理",
        code: "PermRoles",
        type: MENU_TYPES.MENU,
        path: "/sys/role",
        icon: "TeamOutlined",
        orderNum: 20,
        parentId: "permission_management",
        description: "系统角色管理"
      }
    ]
  },

  // 3. 内容管理
  {
    id: "content_management",
    name: "内容管理",
    code: "ContentManagement",
    type: MENU_TYPES.MENU,
    icon: "FileTextOutlined",
    orderNum: 30,
    parentId: null,
    description: "内容管理中心",
    children: [
      {
        id: "news_management",
        name: "新闻管理",
        code: "NewsManagement",
        type: MENU_TYPES.MENU,
        path: "/news",
        icon: "NotificationOutlined",
        orderNum: 10,
        parentId: "content_management",
        description: "新闻发布和管理"
      },
      {
        id: "activity_management",
        name: "活动管理",
        code: "ActivityManagement",
        type: MENU_TYPES.MENU,
        path: "/activity",
        icon: "CalendarOutlined",
        orderNum: 20,
        parentId: "content_management",
        description: "活动策划和管理"
      },
      {
        id: "document_management",
        name: "文案管理",
        code: "DocumentManagement",
        type: MENU_TYPES.MENU,
        path: "/document",
        icon: "EditOutlined",
        orderNum: 30,
        parentId: "content_management",
        description: "文案编辑和管理"
      },
      {
        id: "file_management",
        name: "文件管理",
        code: "Files",
        type: MENU_TYPES.MENU,
        path: "/files",
        icon: "FolderOutlined",
        orderNum: 40,
        parentId: "content_management",
        description: "系统文件管理"
      }
    ]
  },

  // 4. 系统管理
  {
    id: "system_management",
    name: "系统管理",
    code: "SystemManagement",
    type: MENU_TYPES.MENU,
    icon: "SettingOutlined",
    orderNum: 40,
    parentId: null,
    description: "系统管理模块",
    children: [
      {
        id: "database_backup",
        name: "数据库备份",
        code: "DatabaseBackup",
        type: MENU_TYPES.MENU,
        path: "/sys/database-backup",
        icon: "DatabaseOutlined",
        orderNum: 10,
        parentId: "system_management",
        description: "数据库备份管理，仅超级管理员可访问",
        requiresSuperAdmin: true
      }
    ]
  },

  // 隐藏页面（不在菜单中显示，但需要权限控制）
  {
    id: "user_profile",
    name: "个人中心",
    code: "UserProfile",
    type: MENU_TYPES.MENU,
    path: "/sys/profile",
    orderNum: 0,
    parentId: null,
    displayNone: true,
    description: "用户个人信息设置页面"
  }
];

/**
 * 获取扁平化的菜单列表
 * @returns {Array} 扁平化的菜单数组
 */
export function getFlatMenus() {
  const flatMenus = [];

  function flatten(menus, parentPath = '') {
    menus.forEach(menu => {
      const menuItem = {
        ...menu,
        fullPath: parentPath ? `${parentPath}.${menu.id}` : menu.id
      };
      flatMenus.push(menuItem);

      if (menu.children && menu.children.length > 0) {
        flatten(menu.children, menuItem.fullPath);
      }
    });
  }

  flatten(SYSTEM_MENUS);
  return flatMenus;
}

/**
 * 根据类型获取菜单
 * @param {number} type 菜单类型
 * @returns {Array} 指定类型的菜单数组
 */
export function getMenusByType(type) {
  return getFlatMenus().filter(menu => menu.type === type);
}

/**
 * 获取所有菜单权限编码
 * @returns {Array} 权限编码数组
 */
export function getAllPermissionCodes() {
  return getFlatMenus().map(menu => menu.code).filter(Boolean);
}

/**
 * 根据权限编码获取菜单信息
 * @param {string} code 权限编码
 * @returns {Object|null} 菜单信息
 */
export function getMenuByCode(code) {
  return getFlatMenus().find(menu => menu.code === code) || null;
}

/**
 * 获取菜单树结构（用于前端渲染）
 * @param {Array} userPermissions 用户权限编码数组
 * @returns {Array} 过滤后的菜单树
 */
export function getMenuTree(userPermissions = []) {
  // 超级管理员拥有所有权限
  if (userPermissions.includes('*')) {
    return SYSTEM_MENUS.filter(menu => !menu.displayNone);
  }

  function filterMenus(menus) {
    return menus
      .filter(menu => {
        // 如果没有传入权限数组，返回所有菜单
        if (!userPermissions.length) return true;

        // 检查当前菜单是否有权限
        const hasPermission = userPermissions.includes(menu.code);

        // 检查子菜单是否有权限
        const hasChildPermission = menu.children &&
          menu.children.some(child => userPermissions.includes(child.code));

        return hasPermission || hasChildPermission;
      })
      .map(menu => ({
        ...menu,
        children: menu.children ? filterMenus(menu.children) : undefined
      }))
      .filter(menu => !menu.displayNone); // 过滤掉不显示的菜单
  }

  return filterMenus(SYSTEM_MENUS);
}

/**
 * 验证菜单配置
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

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    totalMenus: flatMenus.length,
    menusByType: {
      menus: flatMenus.filter(m => m.type === MENU_TYPES.MENU).length,
      tabs: flatMenus.filter(m => m.type === MENU_TYPES.TAB).length
      // buttons: 已移除按钮级别权限控制
    }
  };
}

// 导出默认配置
export default {
  MENU_TYPES,
  SYSTEM_MENUS,
  getFlatMenus,
  getMenusByType,
  getAllPermissionCodes,
  getMenuByCode,
  getMenuTree,
  validateMenuConfig
};
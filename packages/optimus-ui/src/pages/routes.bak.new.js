/**
 * 新的路由配置文件 - 使用本地菜单常量
 * 
 * 主要改进：
 * 1. 使用本地菜单常量替代数据库菜单
 * 2. 只从后端获取用户权限编码
 * 3. 提高性能，减少数据库查询
 */

import Edit from "./document/views/Edit";
import DocumentNew from "./document-center";
import Contact from "./contact/views/Contact";
import Perm from "./perm";
import User from "./user/views";
import Setting from "./system/views/Setting";
import FilesView from "./files/views";

// 导入菜单常量和工具函数
import { getMenuTree, getAllPermissionCodes } from "../constants/menus";
import { generateRoutes, generateCASLRules } from "../utils/menuMigration";
import { getMenusFromDocument } from "../apis/document";

// 本地路由映射（组件映射）
export const routesMap = [
  // Dashboard component removed - was using table-engine
  {
    path: "/sys/document",
    key: "Document",
    component: DocumentNew,
  },
  {
    code: "perm_users",
    key: "PermUsers",
    path: "/sys/user",
    component: User,
  },
  // Role component removed - was using table-engine
  {
    path: "/biz/contact",
    key: "ContactUs",
    component: Contact,
  },
  {
    key: "PermGroup",
  },
  {
    path: "/sys/perm",
    key: "Perm",
    component: Perm,
  },
  {
    key: "SystemSetting",
  },
  {
    key: "Files",
    path: "/sys/files",
    page: "文件管理",
    component: FilesView,
  },
];

/**
 * 获取用户权限编码（需要修改后端API）
 * @returns {Promise<Array>} 用户权限编码数组
 */
async function getUserPermissions() {
  try {
    // 新的API接口，只返回权限编码数组
    const response = await fetch('/api/perm/user/codes');
    const result = await response.json();
    return result.success ? result.data : [];
  } catch (error) {
    console.error('获取用户权限失败:', error);
    return [];
  }
}

/**
 * 初始化异步路由（新版本）
 */
export const initAsyncRoutes = async () => {
  // 1. 获取用户权限编码
  const userPermissions = await getUserPermissions();

  // 2. 获取文档资源（保持原有逻辑）
  const docResources = await getMenusFromDocument();

  // 3. 使用本地菜单配置生成路由
  const routes = generateRoutes(userPermissions, routesMap);

  // 4. 生成CASL权限规则
  const calsRules = generateCASLRules(userPermissions);

  // 5. 添加固定路由（不需要权限控制的页面）
  const fixedRoutes = [
    // Test component removed - was using table-engine
    {
      path: "/sys/profile",
      page: "个人中心",
      component: Setting,
      displayNone: true,
      pid: "0",
    },
    {
      key: "config-center",
      page: "配置中心",
      component: Contact,
      pid: "0",
      children: (docResources?.data?.list || [])
        .filter((d) => Boolean(d.description))
        .map((doc) => {
          return {
            path: `/edit-doc/${doc.id}`,
            page: doc.description,
            component: Edit,
          };
        }),
    },
  ];

  // 6. 开发环境添加文件管理
  if (process.env.NODE_ENV === "development") {
    fixedRoutes.push({
      key: "Files",
      path: "/sys/files",
      page: "文件管理",
      component: FilesView,
    });
  }

  return {
    calsRules,
    routes: [...routes, ...fixedRoutes],
    userPermissions, // 返回用户权限供其他地方使用
  };
};

/**
 * 获取用户菜单树（用于侧边栏渲染）
 */
export const getUserMenuTree = async () => {
  const userPermissions = await getUserPermissions();
  return getMenuTree(userPermissions);
};

/**
 * 检查用户是否有指定权限
 * @param {string} permissionCode 权限编码
 * @returns {Promise<boolean>} 是否有权限
 */
export const hasPermission = async (permissionCode) => {
  const userPermissions = await getUserPermissions();
  return userPermissions.includes(permissionCode);
};

/**
 * 获取所有可用权限（用于权限管理页面）
 */
export const getAllAvailablePermissions = () => {
  return getAllPermissionCodes();
};

// 兼容性导出（逐步迁移时使用）
export const getDynamicRoutes = async () => {
  console.warn('getDynamicRoutes 已废弃，请使用 initAsyncRoutes');
  const result = await initAsyncRoutes();
  return {
    calsRules: result.calsRules,
    routes: result.routes,
  };
};

export default {
  routesMap,
  initAsyncRoutes,
  getUserMenuTree,
  hasPermission,
  getAllAvailablePermissions,
  getDynamicRoutes, // 兼容性
};
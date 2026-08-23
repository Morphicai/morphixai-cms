/**
 * 系统全量路由和菜单配置
 *
 * 完全基于常量的菜单和路由系统
 * - 所有菜单配置在此文件中定义
 * - 所有路由配置在此文件中定义
 * - 支持动态组件加载
 * - 支持权限控制
 */

import React from 'react';
import * as Icons from '@ant-design/icons';
import { getMenusFromDocument } from '../apis/document';
import { serviceOpsApi } from '../apis/serviceOps';
import storage from '../shared/utils/storage';

// 菜单类型枚举
export const MENU_TYPES = {
  MENU: 1, // 菜单/目录
  TAB: 2, // 标签页
  // BUTTON: 3  // 按钮/操作 - 已移除，不再支持按钮级别权限控制
};

// 组件动态导入映射
export const COMPONENT_MAP = {
  Dashboard: React.lazy(() => import('../pages/dashboard')), // 工作台页面
  PermUsers: React.lazy(() => import('../pages/user/views')),
  PermRoles: React.lazy(() => import('../pages/role')), // 角色管理页面
  ContentManagement: React.lazy(() => import('../pages/document')), // 内容管理（父菜单，不直接使用）
  NewsManagement: React.lazy(() => import('../pages/news')), // 新闻管理页面
  ActivityManagement: React.lazy(() => import('../pages/activity')), // 活动管理页面
  Files: React.lazy(() => import('../pages/files/views')),
  DocumentManagement: React.lazy(() =>
    import('../pages/document/views/DocumentProTablePage')
  ), // 文案管理 - 使用 ProTable 版本
  UserProfile: React.lazy(() => import('../pages/system/views/Setting')),
  DocumentEdit: React.lazy(() => import('../pages/document/views/Edit')),
  DocumentPreviewEditor: React.lazy(() =>
    import('../pages/document/views/PreviewEditor')
  ), // 文档可视化编辑器
  HelpPage: React.lazy(() => import('../pages/help')), // 使用说明页面
  ConfigCenter: React.lazy(() => import('../pages/contact/views/Contact')), // 配置中心组件
  // 文章管理系统组件
  CategoryManagement: React.lazy(() => import('../pages/categories')), // 分类管理页面
  ArticleManagement: React.lazy(() => import('../pages/articles')), // 统一文章管理页面
  ArticleEditor: React.lazy(() =>
    import('../pages/articles/views/ArticleEditor')
  ), // 文章编辑器
  // 系统管理组件
  OperationLog: React.lazy(() => import('../pages/operation-log')), // 操作日志页面
  DatabaseBackup: React.lazy(() => import('../pages/database-backup')), // 数据库备份页面
  // 业务管理组件
  Appointment: React.lazy(() => import('../pages/appointment')), // 预约记录管理页面
  // 活动配置中心组件
  ActivityCenter: React.lazy(() => import('../pages/activity-center')), // 活动管理页面
  RewardClaimRecord: React.lazy(() => import('../pages/reward-claim-record')), // 奖励发放记录查看页面
  // 订单管理组件
  OrderManagement: React.lazy(() => import('../pages/order')), // 订单管理页面
  // 字典管理组件
  DictionaryManagement: React.lazy(() =>
    import('../pages/system/views/DictionaryManagement')
  ), // 字典管理页面（集合管理）
  DictionaryDataManagement: React.lazy(() =>
    import('../pages/system/views/DictionaryDataManagement')
  ), // 字典数据管理页面
  DictionaryList: React.lazy(() =>
    import('../pages/system/views/DictionaryList')
  ), // 字典集合列表页面
  DictionaryDetail: React.lazy(() =>
    import('../pages/system/views/DictionaryDetail')
  ), // 字典数据详情页面
  // 短链管理组件
  ContentShortLink: React.lazy(() => import('../pages/content/short-link')), // 短链管理页面（内容管理）
  ShortToken: React.lazy(() => import('../pages/system/short-token')), // ShortToken管理页面（系统管理）
  PartnerDataManagement: React.lazy(() =>
    import('../pages/system/views/PartnerDataManagement')
  ), // 合伙人数据管理页面（系统管理）
  // 合伙人计划组件
  PartnerManagement: React.lazy(() => import('../pages/partner')), // 合伙人计划管理页面
  // 外部任务审核组件
  ExternalTaskReview: React.lazy(() => import('../pages/external-task-review')), // 外部任务审核管理页面
  // 商品管理组件
  ProductManagement: React.lazy(() => import('../pages/product')), // 商品管理页面
  // 动态表单组件
  FormManagement: React.lazy(() => import('../pages/form')), // 表单管理
  DataCollectionManagement: React.lazy(() => import('../pages/data-collection')), // 数据集合
  I18nManagement: React.lazy(() => import('../pages/i18n')), // 多语言管理(CMS 自己的文案存储)
  AgentConsole: React.lazy(() => import('../pages/agent')), // 智能助理(agent-service 控制台)
  ServiceOps: React.lazy(() => import('../pages/service-ops')), // 服务状态(探测面板+事件流+目录登记)
  EmbedApp: React.lazy(() => import('../pages/embed')), // 服务目录动态入口宿主(/embed/:serviceKey)
  FormFill: React.lazy(() => import('../pages/form/FillPage')), // 公开填报页(免登录)
  // 系统安装组件
  Setup: React.lazy(() => import('../pages/setup')), // 系统安装页面
};

// 系统全量菜单和路由配置
export const SYSTEM_ROUTES = [
  // 1. 工作台
  {
    id: 'dashboard',
    name: '工作台',
    code: 'Dashboard',
    type: MENU_TYPES.MENU,
    path: '/',
    component: 'Dashboard',
    icon: 'DashboardOutlined',
    orderNum: 10,
    parentId: null,
    exact: true,
    description: '系统首页，展示工作台和数据概览',
  },

  // 2. 权限管理
  {
    id: 'permission_management',
    name: '权限管理',
    code: 'PermissionManagement',
    type: MENU_TYPES.MENU,
    icon: 'SafetyOutlined',
    orderNum: 20,
    parentId: null,
    description: '系统权限管理模块',
    children: [
      {
        id: 'user_list',
        name: '用户列表',
        code: 'PermUsers',
        type: MENU_TYPES.MENU,
        path: '/sys/user',
        component: 'PermUsers',
        icon: 'UserOutlined',
        orderNum: 10,
        parentId: 'permission_management',
        exact: true,
        description: '系统用户列表管理',
      },
      {
        id: 'role_management',
        name: '角色管理',
        code: 'PermRoles',
        type: MENU_TYPES.MENU,
        path: '/sys/role',
        component: 'PermRoles',
        icon: 'TeamOutlined',
        orderNum: 20,
        parentId: 'permission_management',
        exact: true,
        description: '系统角色管理',
      },
    ],
  },
  // 4. 文章管理系统
  {
    id: 'article_management',
    name: '文章管理',
    code: 'ArticleManagement',
    type: MENU_TYPES.MENU,
    icon: 'FileTextOutlined',
    orderNum: 32,
    parentId: null,
    description: '文章管理系统，包含分类管理和文章管理',
    children: [
      {
        id: 'category_management',
        name: '分类管理',
        code: 'CategoryManagement',
        type: MENU_TYPES.MENU,
        path: '/articles/categories',
        component: 'CategoryManagement',
        icon: 'FolderOutlined',
        orderNum: 10,
        parentId: 'article_management',
        exact: true,
        description: '文章分类管理',
      },
      {
        id: 'all_articles',
        name: '全部文章',
        code: 'AllArticles',
        type: MENU_TYPES.MENU,
        path: '/articles',
        component: 'ArticleManagement',
        icon: 'FileTextOutlined',
        orderNum: 20,
        parentId: 'article_management',
        exact: true,
        description: '统一文章管理入口',
      },
      {
        id: 'news_articles',
        name: '新闻管理',
        code: 'NewsArticles',
        type: MENU_TYPES.MENU,
        path: '/articles/news',
        component: 'NewsManagement',
        icon: 'NotificationOutlined',
        orderNum: 30,
        parentId: 'article_management',
        exact: true,
        description: '新闻文章管理',
      },
      {
        id: 'activity_articles',
        name: '活动管理',
        code: 'ActivityArticles',
        type: MENU_TYPES.MENU,
        path: '/articles/activity',
        component: 'ActivityManagement',
        icon: 'CalendarOutlined',
        orderNum: 40,
        parentId: 'article_management',
        exact: true,
        description: '活动文章管理',
      },
      {
        id: 'article_create',
        name: '创建文章',
        code: 'ArticleCreate',
        type: MENU_TYPES.MENU,
        path: '/articles/create',
        component: 'ArticleEditor',
        orderNum: 0,
        parentId: null,
        exact: true,
        displayNone: true,
        description: '创建新文章',
      },
      {
        id: 'article_edit',
        name: '编辑文章',
        code: 'ArticleEdit',
        type: MENU_TYPES.MENU,
        path: '/articles/edit/:id',
        component: 'ArticleEditor',
        orderNum: 0,
        parentId: null,
        exact: true,
        displayNone: true,
        description: '编辑文章，支持动态文章ID',
      },
    ],
  },
  // 3. 内容管理
  // 表单管理(动态表单:定义/数据/智能生成)
  {
    id: 'form_management',
    name: '表单管理',
    code: 'FormManagement',
    type: MENU_TYPES.MENU,
    path: '/form',
    component: 'FormManagement',
    icon: 'FormOutlined',
    orderNum: 44,
    parentId: null,
    exact: true,
    description: '动态表单定义与数据收集',
  },
  {
    id: 'data_collections',
    name: '数据集合',
    code: 'DataCollections',
    type: MENU_TYPES.MENU,
    path: '/data-collections',
    component: 'DataCollectionManagement',
    icon: 'DatabaseOutlined',
    orderNum: 45,
    parentId: null,
    exact: true,
    description: 'entity schema 驱动的数据增删改查(无代码地基)',
  },
  // 多语言管理:CMS 自己的文案键值存储,多语言能力唯一入口
  {
    id: 'i18n_management',
    name: '多语言管理',
    code: 'I18nManagement',
    type: MENU_TYPES.MENU,
    path: '/i18n',
    component: 'I18nManagement',
    icon: 'GlobalOutlined',
    orderNum: 44,
    parentId: null,
    exact: true,
    description: 'namespace/key 维度的多语言文案,支持 AI 补全缺失语言',
  },
  // 智能助理:agent-service(独立进程)的控制台,工具由业务服务在代码里注册
  {
    id: 'agent_console',
    name: '智能助理',
    code: 'AgentConsole',
    type: MENU_TYPES.MENU,
    path: '/agent',
    component: 'AgentConsole',
    icon: 'RobotOutlined',
    orderNum: 43,
    parentId: null,
    exact: true,
    description: '给目标,Agent 自主调用平台工具完成任务;基座零业务,工具注册即能力',
  },
  // 服务状态:注册服务的探测面板 + outbox 事件流。清单在 services-registry 集合维护
  {
    id: 'service_ops',
    name: '服务状态',
    code: 'ServiceOps',
    type: MENU_TYPES.MENU,
    path: '/service-ops',
    component: 'ServiceOps',
    icon: 'CloudServerOutlined',
    orderNum: 42,
    parentId: null,
    exact: true,
    description: '各服务健康与轻量指标,事件流(agent.run.finished 等)',
  },
  // 服务目录动态入口的宿主:菜单项由目录生成(getDynamicServiceMenus),
  // 都指向这个固定参数化路由。public 指路由可达,权限在页内按目录 permCode 校验,
  // 真正的门在子应用自己的后端(introspect+hasPerm)
  {
    id: 'embed_app',
    name: '子应用',
    code: 'EmbedApp',
    type: MENU_TYPES.MENU,
    path: '/embed/:serviceKey',
    component: 'EmbedApp',
    orderNum: 998,
    parentId: null,
    exact: true,
    public: true,
    hidden: true,
    description: '服务目录 embed 入口的通用宿主页',
  },
  // 公开填报页:免登录,不进菜单
  {
    id: 'form_fill',
    name: '表单填报',
    code: 'FormFill',
    type: MENU_TYPES.MENU,
    path: '/f/:slug',
    component: 'FormFill',
    orderNum: 999,
    parentId: null,
    exact: true,
    public: true,
    hidden: true,
    description: '动态表单公开填报页',
  },
  {
    id: 'content_management',
    name: '内容管理',
    code: 'ContentManagement',
    type: MENU_TYPES.MENU,
    icon: 'FileTextOutlined',
    orderNum: 30,
    parentId: null,
    description: '内容管理中心',
    children: [
      {
        id: 'document_management',
        name: '文案管理',
        code: 'DocumentManagement',
        type: MENU_TYPES.MENU,
        path: '/document',
        component: 'DocumentManagement',
        icon: 'EditOutlined',
        orderNum: 30,
        parentId: 'content_management',
        exact: true,
        description: '文案编辑和管理',
        children: [
          // 文档编辑页面（固定路由，支持动态ID）
          {
            id: 'document_edit',
            name: '文档编辑',
            code: 'DocumentEdit',
            type: MENU_TYPES.MENU,
            path: '/edit-doc/:id',
            component: 'DocumentEdit',
            orderNum: 0,
            parentId: null,
            exact: true,
            displayNone: true, // 不在菜单中显示，但路由始终存在
            description: '文档编辑页面，支持动态文档ID',
          },
        ],
      },
      {
        id: 'file_management',
        name: '文件管理',
        code: 'Files',
        type: MENU_TYPES.MENU,
        path: '/files',
        component: 'Files',
        icon: 'FolderOutlined',
        orderNum: 40,
        parentId: 'content_management',
        exact: true,
        description: '系统文件管理',
      },
      // 官网编辑器（放在文件管理下方）
      {
        id: 'document_preview_editor',
        name: '官网编辑器',
        code: 'DocumentPreviewEditor',
        type: MENU_TYPES.MENU,
        path: '/document-preview-editor',
        component: 'DocumentPreviewEditor',
        icon: 'GlobalOutlined',
        orderNum: 50,
        parentId: 'content_management',
        exact: true,
        description: '官网编辑器，实时预览和编辑官网页面内容',
      },
      // 短链管理
      {
        id: 'content_short_link',
        name: '短链管理',
        code: 'ContentShortLink',
        type: MENU_TYPES.MENU,
        path: '/content/short-link',
        component: 'ContentShortLink',
        icon: 'LinkOutlined',
        orderNum: 60,
        parentId: 'content_management',
        exact: true,
        description: '短链管理，支持多平台配置',
      },
    ],
  },
  // 5. 活动配置中心
  {
    id: 'activity_config_center',
    name: '活动配置中心',
    code: 'ActivityConfigCenter',
    type: MENU_TYPES.MENU,
    icon: 'GiftOutlined',
    orderNum: 34,
    parentId: null,
    description: '活动配置中心，包含活动管理和奖励发放记录查看',
    children: [
      {
        id: 'activity_management',
        name: '活动管理',
        code: 'ActivityCenter',
        type: MENU_TYPES.MENU,
        path: '/biz/activity-center',
        component: 'ActivityCenter',
        icon: 'CalendarOutlined',
        orderNum: 10,
        parentId: 'activity_config_center',
        exact: true,
        description: '活动管理，支持创建、编辑、删除活动',
      },
      {
        id: 'reward_claim_record',
        name: '奖励发放记录',
        code: 'RewardClaimRecord',
        type: MENU_TYPES.MENU,
        path: '/biz/reward-claim-record',
        component: 'RewardClaimRecord',
        icon: 'FileTextOutlined',
        orderNum: 20,
        parentId: 'activity_config_center',
        exact: true,
        description: '奖励发放记录查看，支持按用户、活动、状态筛选',
      },
    ],
  },

  // 6. 配置中心（动态文档菜单的父级）
  {
    id: 'config_center',
    name: '配置中心',
    code: 'ConfigCenter',
    type: MENU_TYPES.MENU,
    icon: 'SettingOutlined',
    orderNum: 35,
    parentId: null,
    description: '配置中心，包含动态文档管理',
    // 注意：这个菜单的子项会通过 getMenusFromDocument 动态生成
    isDynamic: true, // 标记为动态菜单
  },

  // 7. 业务数据
  {
    id: 'business_data',
    name: '业务数据',
    code: 'BusinessData',
    type: MENU_TYPES.MENU,
    icon: 'DatabaseOutlined',
    orderNum: 36,
    parentId: null,
    description: '业务数据管理模块',
    children: [
      {
        id: 'order_management',
        name: '订单管理',
        code: 'OrderManagement',
        type: MENU_TYPES.MENU,
        path: '/biz/order',
        component: 'OrderManagement',
        icon: 'ShoppingCartOutlined',
        orderNum: 30,
        parentId: 'business_data',
        exact: true,
        description: '订单查看和查询管理',
      },
      {
        id: 'appointment',
        name: '预约管理',
        code: 'Appointment',
        type: MENU_TYPES.MENU,
        path: '/biz/appointment',
        component: 'Appointment',
        icon: 'CalendarOutlined',
        orderNum: 40,
        parentId: 'business_data',
        exact: true,
        description: '预约记录管理，支持查看和导出',
      },
      {
        id: 'partner_management',
        name: '合伙人计划',
        code: 'PartnerManagement',
        type: MENU_TYPES.MENU,
        path: '/biz/partner',
        component: 'PartnerManagement',
        icon: 'TeamOutlined',
        orderNum: 50,
        parentId: 'business_data',
        exact: true,
        description: '合伙人计划管理，包含团队仪表板、团队成员和渠道管理',
      },
      {
        id: 'external_task_review',
        name: '外部任务审核',
        code: 'ExternalTaskReview',
        type: MENU_TYPES.MENU,
        path: '/biz/external-task-review',
        component: 'ExternalTaskReview',
        icon: 'AuditOutlined',
        orderNum: 60,
        parentId: 'business_data',
        exact: true,
        description: '外部任务审核管理，包含任务提交审核、统计和查询',
      },
    ],
  },

  // 9. 系统管理
  {
    id: 'system_management',
    name: '系统管理',
    code: 'SystemManagement',
    type: MENU_TYPES.MENU,
    icon: 'SettingOutlined',
    orderNum: 37,
    parentId: null,
    description: '系统管理模块',
    children: [
      {
        id: 'operation_log',
        name: '操作日志',
        code: 'OperationLog',
        type: MENU_TYPES.MENU,
        path: '/sys/operation-log',
        component: 'OperationLog',
        icon: 'FileTextOutlined',
        orderNum: 10,
        parentId: 'system_management',
        exact: true,
        description: '系统操作日志查看和管理',
      },
      {
        id: 'database_backup',
        name: '数据库备份',
        code: 'DatabaseBackup',
        type: MENU_TYPES.MENU,
        path: '/sys/database-backup',
        component: 'DatabaseBackup',
        icon: 'DatabaseOutlined',
        orderNum: 20,
        parentId: 'system_management',
        exact: true,
        description: '数据库备份管理，仅超级管理员可访问',
      },
      {
        id: 'dictionary_management',
        name: '字典管理',
        code: 'DictionaryManagement',
        type: MENU_TYPES.MENU,
        path: '/sys/dictionary',
        component: 'DictionaryManagement',
        icon: 'DatabaseOutlined',
        orderNum: 30,
        parentId: 'system_management',
        exact: true,
        description: '字典数据管理',
      },
      {
        id: 'short_token',
        name: 'ShortToken',
        code: 'ShortToken',
        type: MENU_TYPES.MENU,
        path: '/sys/short-token',
        component: 'ShortToken',
        icon: 'KeyOutlined',
        orderNum: 40,
        parentId: 'system_management',
        exact: true,
        description: 'ShortToken管理，管理所有来源的短链',
      },
      {
        id: 'partner_data_management',
        name: '合伙人数据管理',
        code: 'PartnerDataManagement',
        type: MENU_TYPES.MENU,
        path: '/sys/partner-data',
        component: 'PartnerDataManagement',
        icon: 'TeamOutlined',
        orderNum: 50,
        parentId: 'system_management',
        exact: true,
        description: '合伙人数据管理，包括缓存刷新和数据清理',
      },
    ],
  },

  // 隐藏的字典数据管理页面（不在菜单中显示）
  {
    id: 'dictionary_data_management',
    name: '字典数据管理',
    code: 'DictionaryDataManagement',
    type: MENU_TYPES.MENU,
    path: '/sys/dictionary/:collection',
    component: 'DictionaryDataManagement',
    orderNum: 0,
    parentId: null,
    exact: true,
    displayNone: true,
    description: '字典集合数据管理页面',
  },

  // 10. 帮助中心
  {
    id: 'help_center',
    name: '使用说明',
    code: 'HelpPage',
    type: MENU_TYPES.MENU,
    path: '/help',
    component: 'HelpPage',
    icon: 'QuestionCircleOutlined',
    orderNum: 40,
    parentId: null,
    exact: true,
    description: '系统使用说明和帮助文档',
    public: true, // 标记为公开页面，不需要登录
  },
  {
    id: 'setup_page',
    name: '系统安装',
    code: 'Setup',
    type: MENU_TYPES.MENU,
    path: '/setup',
    component: 'Setup',
    icon: 'SettingOutlined',
    orderNum: 998,
    parentId: null,
    exact: true,
    public: true, // 标记为公开页面，不需要登录
    // 安装页只在未初始化时由 App 强制跳转进入,不需要出现在侧边栏——
    // 已初始化的系统常年挂着"系统安装"只会吓人
    hidden: true,
    description: '系统安装和初始化页面',
  },

  // 隐藏页面（不在菜单中显示，但需要权限控制）
  {
    id: 'user_profile',
    name: '个人中心',
    code: 'UserProfile',
    type: MENU_TYPES.MENU,
    path: '/sys/profile',
    component: 'UserProfile',
    orderNum: 0,
    parentId: null,
    exact: true,
    displayNone: true,
    description: '用户个人信息设置页面',
  },

  // 文章编辑页面（固定路由，支持创建和编辑）

  // 测试页面（开发环境）- Test component removed (was using table-engine)
  // {
  //   id: "test_page",
  //   name: "测试页面",
  //   code: "Test",
  //   type: MENU_TYPES.MENU,
  //   path: "/test",
  //   component: "Test",
  //   orderNum: 0,
  //   parentId: null,
  //   exact: true,
  //   displayNone: true,
  //   description: "开发测试页面"
  // }
];

/**
 * 获取扁平化的路由列表（仅静态路由）
 * @returns {Array} 扁平化的路由数组
 */
export function getFlatRoutes() {
  const flatRoutes = [];

  function flatten(routes, parentPath = '') {
    routes.forEach(route => {
      const routeItem = {
        ...route,
        fullPath: parentPath ? `${parentPath}.${route.id}` : route.id,
      };
      flatRoutes.push(routeItem);

      if (route.children && route.children.length > 0) {
        flatten(route.children, routeItem.fullPath);
      }
    });
  }

  flatten(SYSTEM_ROUTES);
  return flatRoutes;
}

/**
 * 获取扁平化的菜单列表（包含动态菜单项）
 * @returns {Promise<Array>} 扁平化的菜单数组
 */
export async function getFlatMenusWithDynamic() {
  const fullMenus = await getFullMenuConfig();
  const flatMenus = [];

  function flatten(menus, parentPath = '') {
    menus.forEach(menu => {
      const menuItem = {
        ...menu,
        fullPath: parentPath ? `${parentPath}.${menu.id}` : menu.id,
      };
      flatMenus.push(menuItem);

      if (menu.children && menu.children.length > 0) {
        flatten(menu.children, menuItem.fullPath);
      }
    });
  }

  flatten(fullMenus);
  return flatMenus;
}

/**
 * 根据类型获取路由
 * @param {number} type 路由类型
 * @returns {Array} 指定类型的路由数组
 */
export function getRoutesByType(type) {
  return getFlatRoutes().filter(route => route.type === type);
}

/**
 * 获取所有权限编码（仅静态路由）
 * @returns {Array} 权限编码数组
 */
export function getAllPermissionCodes() {
  return getFlatRoutes()
    .map(route => route.code)
    .filter(Boolean);
}

/**
 * 获取所有权限编码（包含动态菜单项）
 * @returns {Promise<Array>} 权限编码数组
 */
export async function getAllPermissionCodesWithDynamic() {
  const flatMenus = await getFlatMenusWithDynamic();
  return flatMenus.map(menu => menu.code).filter(Boolean);
}

/**
 * 根据权限编码获取路由信息
 * @param {string} code 权限编码
 * @returns {Object|null} 路由信息
 */
export function getRouteByCode(code) {
  return getFlatRoutes().find(route => route.code === code) || null;
}

/**
 * 获取有路径的路由（用于React Router）
 * 注意：现在只使用静态路由，动态文档通过固定的 /edit-doc/:id 路由处理
 * @param {Array} userPermissions 用户权限编码数组
 * @returns {Array} 路由配置数组
 */
export function getReactRoutes(userPermissions = []) {
  const flatRoutes = getFlatRoutes();

  return flatRoutes
    .filter(route => {
      // 过滤条件：
      // 1. 有路径的路由
      // 2. 用户有权限或者是超级管理员或者是公开页面
      return (
        route.path &&
        route.component &&
        (route.public ||
          userPermissions.includes('*') ||
          userPermissions.includes(route.code))
      );
    })
    .map(route => ({
      id: route.id,
      path: route.path,
      component: COMPONENT_MAP[route.component],
      exact: route.exact || false,
      name: route.name,
      code: route.code,
      public: route.public,
    }));
}

/**
 * 获取动态文档菜单项（仅用于菜单显示，不生成路由）
 * @returns {Promise<Array>} 动态文档菜单项数组
 */
export async function getDynamicDocumentMenus() {
  try {
    // 检查登录状态，未登录不请求
    const accessToken = storage("access-token");
    if (!accessToken) {
      console.warn('🔒 [Routes] 未登录，跳过获取动态文档菜单');
      return [];
    }

    const docResources = await getMenusFromDocument();
    
    // 检查响应是否成功
    if (!docResources?.success && docResources?.code === 401) {
      console.warn('🔒 [Routes] 获取文档菜单时认证失败，返回空菜单');
      return [];
    }
    
    const documentList = docResources?.data?.list || [];

    return documentList
      .filter(doc => Boolean(doc.description) && doc.showOnMenu) // 只显示有描述且开启菜单显示的文档
      .map(doc => ({
        id: `doc_${doc.id}`,
        name: doc.description,
        code: `ConfigCenter`,
        type: MENU_TYPES.MENU,
        path: `/edit-doc/${doc.id}`, // 路径指向固定的动态路由
        icon: 'EditOutlined',
        orderNum: parseInt(doc.id) || 0,
        parentId: 'config_center',
        description: `编辑文档：${doc.description}`,
        isDynamicMenu: true, // 标记为动态菜单项
        docId: doc.id,
        docKey: doc.docKey,
      }));
  } catch (error) {
    console.error('❌ [Routes] 获取动态文档菜单失败:', error);
    return [];
  }
}

/**
 * 服务目录的动态入口菜单项(仅菜单显示,路由走固定的 /embed/:serviceKey 宿主)。
 * code 用条目自己的 permCode——getMenuTree 按用户权限过滤,没码的人看不见;
 * 条目没配 permCode 时缺省从紧,只有 ServiceOps 能看见
 */
export async function getDynamicServiceMenus() {
  try {
    if (!storage('access-token')) return [];
    const res = await serviceOpsApi.entries();
    return (res?.data || []).map((e) => ({
      id: `svc_${e.key}`,
      name: e.menuTitle || e.key,
      code: e.permCode || 'ServiceOps',
      type: MENU_TYPES.MENU,
      path: `/embed/${e.key}`,
      icon: e.menuIcon && Icons[e.menuIcon] ? e.menuIcon : 'AppstoreOutlined',
      orderNum: 50,
      parentId: null,
      isDynamicMenu: true,
    }));
  } catch (error) {
    // 目录接口打不通只影响动态入口,静态菜单照常
    console.warn('[Routes] 获取服务目录入口失败:', error?.message || error);
    return [];
  }
}

/**
 * 获取完整的菜单配置（包含动态文档菜单项与服务目录动态入口）
 * @returns {Promise<Array>} 完整的菜单配置数组
 */
export async function getFullMenuConfig() {
  const [dynamicDocMenus, dynamicServiceMenus] = await Promise.all([
    getDynamicDocumentMenus(),
    getDynamicServiceMenus(),
  ]);

  // 将动态文档菜单项添加到配置中心的子菜单
  const menusWithDynamic = SYSTEM_ROUTES.map(route => {
    if (route.id === 'config_center') {
      return {
        ...route,
        children: dynamicDocMenus,
      };
    }
    return route;
  });

  // 服务目录 embed 条目作为顶层菜单项追加
  return [...menusWithDynamic, ...dynamicServiceMenus];
}

/**
 * 获取菜单树结构（用于侧边栏渲染，包含动态文档菜单）
 * @param {Array} userPermissions 用户权限编码数组
 * @returns {Promise<Array>} 过滤后的菜单树
 */
export async function getMenuTree(userPermissions = []) {
  // 获取包含动态菜单项的完整配置
  const fullMenus = await getFullMenuConfig();

  function filterMenus(menus) {
    return menus
      .filter(menu => {
        // 标记为 hidden 的路由不进侧边栏(路由本身仍可达)
        if (menu.hidden) return false;

        // 如果是超级管理员，显示所有菜单
        if (userPermissions.includes('*')) return true;

        // 如果没有传入权限数组，返回所有菜单
        if (!userPermissions.length) return true;

        // 检查当前菜单是否有权限或者是公开页面
        const hasPermission =
          menu.public || userPermissions.includes(menu.code);

        // 检查子菜单是否有权限
        const hasChildPermission =
          menu.children &&
          menu.children.some(
            child =>
              child.isDynamicMenu ||
              child.public ||
              userPermissions.includes(child.code) ||
              (child.children &&
                child.children.some(
                  grandChild =>
                    grandChild.isDynamicMenu ||
                    grandChild.public ||
                    userPermissions.includes(grandChild.code)
                ))
          );

        return hasPermission || hasChildPermission;
      })
      .map(menu => ({
        ...menu,
        icon: menu.icon ? React.createElement(Icons[menu.icon]) : null,
        children: menu.children ? filterMenus(menu.children) : undefined,
      }))
      .filter(menu => {
        // 过滤掉隐藏的菜单和非菜单类型
        if (menu.displayNone || menu.type !== MENU_TYPES.MENU) return false;

        return menu.path || menu?.children?.length > 0;
      });
  }

  return filterMenus(fullMenus);
}

// 按钮权限相关函数已移除 - 不再支持按钮级别权限控制

/**
 * 生成CASL权限规则（简化版本）
 * @param {Array} userPermissions 用户权限编码数组
 * @returns {Array} CASL权限规则
 */
export function generateCASLRules(userPermissions = []) {
  // 超级管理员拥有所有权限
  if (userPermissions.includes('*')) {
    return [{ action: 'manage', subject: 'all' }];
  }

  const rules = [];

  userPermissions.forEach(permission => {
    // 简化版本：所有权限都转换为read权限
    rules.push({
      action: 'read',
      subject: permission.toLowerCase(),
    });
  });

  return rules;
}

/**
 * 验证路由配置
 * @returns {Object} 验证结果
 */
export function validateRouteConfig() {
  const flatRoutes = getFlatRoutes();
  const errors = [];
  const warnings = [];

  // 检查ID唯一性
  const ids = flatRoutes.map(route => route.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    errors.push(`重复的路由ID: ${duplicateIds.join(', ')}`);
  }

  // 检查权限编码唯一性
  const codes = flatRoutes.map(route => route.code).filter(Boolean);
  const duplicateCodes = codes.filter(
    (code, index) => codes.indexOf(code) !== index
  );
  if (duplicateCodes.length > 0) {
    errors.push(`重复的权限编码: ${duplicateCodes.join(', ')}`);
  }

  // 检查路径唯一性
  const paths = flatRoutes.map(route => route.path).filter(Boolean);
  const duplicatePaths = paths.filter(
    (path, index) => paths.indexOf(path) !== index
  );
  if (duplicatePaths.length > 0) {
    errors.push(`重复的路由路径: ${duplicatePaths.join(', ')}`);
  }

  // 检查组件映射
  flatRoutes.forEach(route => {
    if (route.component && !COMPONENT_MAP[route.component]) {
      errors.push(
        `路由 ${route.id} 的组件 ${route.component} 未在 COMPONENT_MAP 中定义`
      );
    }
  });

  // 检查父子关系
  flatRoutes.forEach(route => {
    if (route.parentId && route.parentId !== null) {
      const parent = flatRoutes.find(r => r.id === route.parentId);
      if (!parent) {
        errors.push(`路由 ${route.id} 的父路由 ${route.parentId} 不存在`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    totalRoutes: flatRoutes.length,
    routesByType: {
      menus: flatRoutes.filter(r => r.type === MENU_TYPES.MENU).length,
      tabs: flatRoutes.filter(r => r.type === MENU_TYPES.TAB).length,
      // buttons: 已移除按钮级别权限控制
    },
  };
}

// 导出默认配置
const routeConfig = {
  MENU_TYPES,
  COMPONENT_MAP,
  SYSTEM_ROUTES,
  getFlatRoutes,
  getFlatMenusWithDynamic,
  getRoutesByType,
  getAllPermissionCodes,
  getAllPermissionCodesWithDynamic,
  getRouteByCode,
  getReactRoutes,
  getMenuTree,
  getDynamicDocumentMenus,
  getFullMenuConfig,
  // getButtonPermissions, // 已移除按钮权限功能
  generateCASLRules,
  validateRouteConfig,
};

export default routeConfig;

/*
 Optimus Database Schema - Minimal Version
 Optimized for development with essential data only
 
 IMPORTANT CHANGES:
 - Updated op_sys_role_menu table to use permission_code instead of menu_id
 - Menu structure is now managed entirely by constants in code (packages/optimus-ui/src/constants/routes.js)
 - Simplified role-based permission system using permission codes
 - sys_menu and sys_menu_perm tables have been completely removed
 - Permission codes are stored in op_sys_role_menu and defined in frontend constants
 
 Version: 2024-11-11 - Menu Tables Removal
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for op_sys_database_info
-- ----------------------------
CREATE TABLE IF NOT EXISTS `op_sys_database_info` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `schema_version` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '数据库结构版本',
  `seed_version` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '种子数据版本',
  `environment` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '环境标识 (development, production, e2e)',
  `initialized_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '初始化时间',
  `last_updated_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '最后更新时间',
  `node_env` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'NODE_ENV环境变量',
  `app_version` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '应用版本',
  `initialization_source` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'auto' COMMENT '初始化来源 (auto, manual, migration)',
  `metadata` json DEFAULT NULL COMMENT '额外的元数据信息',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_environment` (`environment`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据库信息表，记录数据库初始化和版本信息';

-- ----------------------------
-- Table structure for op_biz_contact
-- ----------------------------
-- DROP TABLE IF EXISTS `op_biz_contact`;
CREATE TABLE IF NOT EXISTS `op_biz_contact` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '邮箱',
  `phone_num` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '用户手机号码',
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '地址',
  `eng_address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '英文地址',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Records of op_biz_contact (No demo data - will be created as needed)
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for op_biz_feedback
-- ----------------------------
-- DROP TABLE IF EXISTS `op_biz_feedback`;
CREATE TABLE IF NOT EXISTS `op_biz_feedback` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '邮箱',
  `nick_name` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '昵称',
  `message` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '意见信息',
  `create_date` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Records of op_biz_feedback (No demo data - will be created as needed)
-- ----------------------------
BEGIN;
COMMIT;



-- ----------------------------
-- Table structure for sys_document
-- ----------------------------
-- DROP TABLE IF EXISTS `op_sys_document`;
CREATE TABLE IF NOT EXISTS `op_sys_document` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `doc_key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '文案中心 Key',
  `source` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '描述当前 Item 来源',
  `type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '当前文案 Item 类型',
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '文案内容',
  `create_date` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `user_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '操作人',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '对当前文案 Item 的简要描述',
  `is_public` tinyint NOT NULL DEFAULT '0' COMMENT '是否对外公开',
  `show_on_menu` tinyint NOT NULL DEFAULT '0' COMMENT '该文案中心是否需要展示在菜单上',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_doc_key_unique` (`doc_key`),
  KEY `idx_is_public` (`is_public`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Records of sys_document (Essential demo data only)
-- ----------------------------
BEGIN;
INSERT IGNORE INTO `op_sys_document` (`id`, `doc_key`, `source`, `type`, `content`, `create_date`, `user_id`, `description`, `is_public`, `show_on_menu`) VALUES (1, 'copyright', 'home', 'html', '<p>© 2024 Optimus CMS. Built with modern technologies for powerful content management.</p>', '2024-01-01 10:00:00.000000', '1', 'Copyright notice for Optimus CMS', 1, 1);
COMMIT;

-- ----------------------------
-- Table structure for op_sys_document_perm
-- ----------------------------
-- DROP TABLE IF EXISTS `op_sys_document_perm`;
CREATE TABLE IF NOT EXISTS `op_sys_document_perm` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL DEFAULT '0' COMMENT '用户id',
  `role_id` bigint NOT NULL DEFAULT '0' COMMENT '角色id',
  `document_id` bigint NOT NULL COMMENT '文案中心id',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of op_sys_document_perm (Essential demo data only)
-- ----------------------------
BEGIN;
INSERT IGNORE INTO `op_sys_document_perm` (`id`, `user_id`, `role_id`, `document_id`) VALUES (1, 0, 1, 1);
COMMIT;

-- ----------------------------
-- NOTE: op_sys_menu table has been removed
-- Menu structure is now managed entirely by constants in code
-- See: packages/optimus-ui/src/constants/routes.js
-- ----------------------------

-- ----------------------------
-- NOTE: op_sys_menu_perm table has been removed
-- API permissions are now controlled through permission codes in op_sys_role_menu
-- Menu structure and permission codes are managed in code
-- See: packages/optimus-ui/src/constants/routes.js
-- ----------------------------

-- ----------------------------
-- Table structure for op_sys_oss
-- ----------------------------
-- DROP TABLE IF EXISTS `op_sys_oss`;
CREATE TABLE IF NOT EXISTS `op_sys_oss` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '文件 url',
  `ossKey` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '文件hash key',
  `thumbnail_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '文件缩略图 url',
  `size` int NOT NULL COMMENT '文件size',
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '文件mimetype类型',
  `location` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '文件存放位置',
  `create_date` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `business` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '业务描述字段，可以字符串，也可以是 JSON 字符串',
  `user_id` bigint NOT NULL COMMENT '上传用户id',
  `user_account` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '上传用户帐号',
  `storage_provider` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'local' COMMENT '存储提供商类型 (minio, aliyun, local)',
  `file_key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '存储文件键名',
  `cdn_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'CDN加速地址',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_storage_provider` (`storage_provider`),
  KEY `idx_file_key` (`file_key`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_create_date` (`create_date`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Records of op_sys_oss (Empty for now - files will be uploaded as needed)
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for op_sys_operation_log
-- ----------------------------
-- DROP TABLE IF EXISTS `op_sys_operation_log`;
CREATE TABLE IF NOT EXISTS `op_sys_operation_log` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `module` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '模块名称，如：user, role, menu',
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '操作类型，如：create, update, delete',
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '操作描述',
  `user_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '操作用户ID',
  `before_data` json DEFAULT NULL COMMENT '操作前数据',
  `after_data` json DEFAULT NULL COMMENT '操作后数据',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'success' COMMENT '操作状态: success, failed',
  `error_message` text COLLATE utf8mb4_unicode_ci COMMENT '错误信息',
  `duration` int DEFAULT NULL COMMENT '操作耗时(毫秒)',
  `ip` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '操作者IP地址',
  `user_agent` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '用户代理信息',
  `method` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'HTTP请求方法',
  `path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '请求路径',
  `create_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  PRIMARY KEY (`id`),
  KEY `idx_module_action` (`module`,`action`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_create_date` (`create_date`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统操作日志表';

-- ----------------------------
-- Records of op_sys_operation_log (No initial data)
-- ----------------------------

-- ----------------------------
-- Table structure for sys_role
-- ----------------------------
-- DROP TABLE IF EXISTS `op_sys_role`;
CREATE TABLE IF NOT EXISTS `op_sys_role` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '角色名称',
  `remark` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '角色备注',
  `create_date` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `update_date` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Records of sys_role (Essential roles)
-- ----------------------------
BEGIN;
INSERT IGNORE INTO `op_sys_role` (`id`, `name`, `remark`, `create_date`, `update_date`) VALUES (1, '管理员', '系统管理员，拥有所有权限', '2024-01-01 10:00:00.000000', '2024-01-01 10:00:00.000000');
INSERT IGNORE INTO `op_sys_role` (`id`, `name`, `remark`, `create_date`, `update_date`) VALUES (2, '运营', '运营人员，拥有内容管理权限', '2024-01-01 10:00:00.000000', '2024-01-01 10:00:00.000000');
INSERT IGNORE INTO `op_sys_role` (`id`, `name`, `remark`, `create_date`, `update_date`) VALUES (3, '普通用户', '普通用户，基础权限', '2024-01-01 10:00:00.000000', '2024-01-01 10:00:00.000000');
COMMIT;

-- ----------------------------
-- Table structure for op_sys_role_leader
-- ----------------------------
-- DROP TABLE IF EXISTS `op_sys_role_leader`;
CREATE TABLE IF NOT EXISTS `op_sys_role_leader` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `role_id` bigint NOT NULL COMMENT 'role id',
  `leader_id` bigint NOT NULL COMMENT 'leader id(userId)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_babb0caa56e025a527cdc238b5` (`leader_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of op_sys_role_leader (Empty for now)
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for op_sys_role_menu
-- ----------------------------
-- DROP TABLE IF EXISTS `op_sys_role_menu`;
CREATE TABLE IF NOT EXISTS `op_sys_role_menu` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `role_id` bigint NOT NULL COMMENT '角色 id',
  `permission_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '权限编码',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_role_id` (`role_id`),
  KEY `idx_permission_code` (`permission_code`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Records of op_sys_role_menu (Essential role-permission mappings)
-- ----------------------------
BEGIN;
-- 管理员角色拥有所有权限
INSERT IGNORE INTO `op_sys_role_menu` (`id`, `role_id`, `permission_code`) VALUES (1, 1, 'Dashboard');
INSERT IGNORE INTO `op_sys_role_menu` (`id`, `role_id`, `permission_code`) VALUES (2, 1, 'PermissionManagement');
INSERT IGNORE INTO `op_sys_role_menu` (`id`, `role_id`, `permission_code`) VALUES (3, 1, 'PermUsers');
INSERT IGNORE INTO `op_sys_role_menu` (`id`, `role_id`, `permission_code`) VALUES (4, 1, 'PermRoles');
INSERT IGNORE INTO `op_sys_role_menu` (`id`, `role_id`, `permission_code`) VALUES (5, 1, 'ContentManagement');
INSERT IGNORE INTO `op_sys_role_menu` (`id`, `role_id`, `permission_code`) VALUES (6, 1, 'NewsManagement');
INSERT IGNORE INTO `op_sys_role_menu` (`id`, `role_id`, `permission_code`) VALUES (7, 1, 'ActivityManagement');
INSERT IGNORE INTO `op_sys_role_menu` (`id`, `role_id`, `permission_code`) VALUES (8, 1, 'DocumentManagement');
INSERT IGNORE INTO `op_sys_role_menu` (`id`, `role_id`, `permission_code`) VALUES (9, 1, 'Files');
INSERT IGNORE INTO `op_sys_role_menu` (`id`, `role_id`, `permission_code`) VALUES (10, 1, 'UserProfile');

-- 运营角色拥有内容管理权限
INSERT IGNORE INTO `op_sys_role_menu` (`id`, `role_id`, `permission_code`) VALUES (11, 2, 'Dashboard');
INSERT IGNORE INTO `op_sys_role_menu` (`id`, `role_id`, `permission_code`) VALUES (12, 2, 'ContentManagement');
INSERT IGNORE INTO `op_sys_role_menu` (`id`, `role_id`, `permission_code`) VALUES (13, 2, 'NewsManagement');
INSERT IGNORE INTO `op_sys_role_menu` (`id`, `role_id`, `permission_code`) VALUES (14, 2, 'ActivityManagement');
INSERT IGNORE INTO `op_sys_role_menu` (`id`, `role_id`, `permission_code`) VALUES (15, 2, 'DocumentManagement');
INSERT IGNORE INTO `op_sys_role_menu` (`id`, `role_id`, `permission_code`) VALUES (16, 2, 'Files');
INSERT IGNORE INTO `op_sys_role_menu` (`id`, `role_id`, `permission_code`) VALUES (17, 2, 'UserProfile');

-- 普通用户只有基础权限
INSERT IGNORE INTO `op_sys_role_menu` (`id`, `role_id`, `permission_code`) VALUES (18, 3, 'Dashboard');
INSERT IGNORE INTO `op_sys_role_menu` (`id`, `role_id`, `permission_code`) VALUES (19, 3, 'UserProfile');
COMMIT;

-- ----------------------------
-- Table structure for sys_user
-- ----------------------------
-- DROP TABLE IF EXISTS `op_sys_user`;
CREATE TABLE IF NOT EXISTS `op_sys_user` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `password` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户登录密码',
  `salt` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '盐',
  `account` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户登录账号',
  `phone_num` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '用户手机号码',
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '邮箱地址',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '所属状态: 1-有效，0-禁用',
  `is_deleted` tinyint NOT NULL DEFAULT '1' COMMENT '所属状态: 1-有效，0-已经被虚拟删除',
  `deleted_date` timestamp NULL DEFAULT NULL COMMENT '删除时间',
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '头像地址',
  `type` tinyint NOT NULL DEFAULT '1' COMMENT '帐号类型：0-超管， 1-普通用户',
  `create_date` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `update_date` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  `full_name` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_login_time` timestamp NULL DEFAULT NULL COMMENT '最后一次登录时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Records of op_sys_user (No default users - users will be created during initialization)
-- ----------------------------
BEGIN;
-- 管理员账号将在系统初始化时通过 /api/setup/initialize 接口创建
-- 不再预设管理员账号，避免与初始化时创建的管理员账号冲突
-- 如需测试用户，可以在初始化后手动创建
COMMIT;

-- ----------------------------
-- Table structure for op_sys_user_role
-- ----------------------------
-- DROP TABLE IF EXISTS `op_sys_user_role`;
CREATE TABLE IF NOT EXISTS `op_sys_user_role` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL COMMENT '用户id',
  `role_id` bigint NOT NULL COMMENT '角色id',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Records of op_sys_user_role (No default user-role mappings)
-- ----------------------------
BEGIN;
-- 用户角色关联将在系统初始化时通过 /api/setup/initialize 接口创建
-- 不再预设用户角色关联，避免与初始化时创建的管理员账号冲突
COMMIT;

-- ----------------------------
-- Table structure for op_sys_category
-- ----------------------------
-- DROP TABLE IF EXISTS `op_sys_category`;
CREATE TABLE IF NOT EXISTS `op_sys_category` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  `name` varchar(100) NOT NULL COMMENT '分类名称',
  `code` varchar(100) NOT NULL UNIQUE COMMENT '分类标识符',
  `description` text DEFAULT NULL COMMENT '分类描述',
  `config` json DEFAULT NULL COMMENT '分类配置',
  `is_built_in` boolean DEFAULT false COMMENT '是否内置分类',
  `sort_weight` int DEFAULT 0 COMMENT '排序权重',
  `parent_id` bigint DEFAULT NULL COMMENT '父分类ID',
  `create_date` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_date` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_is_built_in` (`is_built_in`),
  KEY `idx_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章分类表';

-- ----------------------------
-- Records of op_sys_category (Temporary default category for demo article only)
-- ----------------------------
BEGIN;
-- Note: This category is only for the demo article. In production, create categories as needed.
INSERT IGNORE INTO `op_sys_category` (`id`, `name`, `code`, `description`, `is_built_in`, `config`, `sort_weight`) VALUES 
(1, 'General', 'general', 'General category for demo content', false, '{}', 0);
COMMIT;

-- ----------------------------
-- Table structure for sys_article
-- ----------------------------
-- DROP TABLE IF EXISTS `op_sys_article`;
CREATE TABLE IF NOT EXISTS `op_sys_article` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '文章ID',
  `slug` varchar(200) DEFAULT NULL COMMENT 'URL友好的标识符',
  `status` enum('draft','published','archived') NOT NULL DEFAULT 'draft' COMMENT '当前发布状态',
  `scheduled_at` timestamp NULL DEFAULT NULL COMMENT '预定发布时间',
  `published_at` timestamp NULL DEFAULT NULL COMMENT '实际发布时间',
  `current_version_id` bigint DEFAULT NULL COMMENT '当前版本ID',
  `published_version_id` bigint DEFAULT NULL COMMENT '已发布版本ID',
  `category_id` bigint NOT NULL COMMENT '分类ID',
  `user_id` varchar(255) NOT NULL COMMENT '创建者ID',
  `is_deleted` tinyint NOT NULL DEFAULT 0 COMMENT '是否已删除（软删除标记）',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT '删除时间',
  `deleted_by` varchar(255) DEFAULT NULL COMMENT '删除者ID',
  `create_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_slug` (`slug`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_status` (`status`),
  KEY `idx_is_deleted` (`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章主表';

-- ----------------------------
-- Records of sys_article (Sample article - Optimus CMS introduction)
-- ----------------------------
BEGIN;
-- Note: category_id is required, so a category must be created first if needed
-- For minimal seed data, we'll use a placeholder category_id (1)
-- In production, categories should be created before articles
INSERT IGNORE INTO `op_sys_article` (`id`, `slug`, `status`, `published_at`, `current_version_id`, `published_version_id`, `category_id`, `user_id`, `is_deleted`, `create_date`, `update_date`) VALUES 
(1, 'welcome-to-optimus-cms', 'published', '2024-01-01 10:00:00', 1, 1, 1, '1', 0, '2024-01-01 10:00:00', '2024-01-01 10:00:00');
COMMIT;

-- ----------------------------
-- Table structure for op_sys_article_version
-- ----------------------------
-- DROP TABLE IF EXISTS `op_sys_article_version`;
CREATE TABLE IF NOT EXISTS `op_sys_article_version` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '版本ID',
  `article_id` bigint NOT NULL COMMENT '文章ID',
  `version_number` int NOT NULL COMMENT '版本号',
  `title` varchar(200) NOT NULL COMMENT '文章标题',
  `summary` text DEFAULT NULL COMMENT '文章摘要',
  `content` longtext NOT NULL COMMENT '文章内容(HTML格式)',
  `cover_images` json DEFAULT NULL COMMENT '封面图片数组',
  `sort_weight` int NOT NULL DEFAULT 0 COMMENT '排序权重，数值越大越靠前',
  `seo_title` varchar(200) DEFAULT NULL COMMENT 'SEO标题',
  `seo_description` text DEFAULT NULL COMMENT 'SEO描述',
  `seo_keywords` varchar(500) DEFAULT NULL COMMENT 'SEO关键词',
  `status` enum('draft','published','archived') NOT NULL COMMENT '版本状态',
  `is_current` tinyint NOT NULL DEFAULT 0 COMMENT '是否为当前版本',
  `user_id` varchar(255) NOT NULL COMMENT '版本创建者ID',
  `create_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '版本创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_article_version` (`article_id`, `version_number`),
  KEY `idx_article_id` (`article_id`),
  KEY `idx_status` (`status`),
  KEY `idx_is_current` (`is_current`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章版本表';

-- ----------------------------
-- Records of op_sys_article_version (Sample article version - plain text format)
-- ----------------------------
BEGIN;
INSERT IGNORE INTO `op_sys_article_version` (`id`, `article_id`, `version_number`, `title`, `summary`, `content`, `cover_images`, `sort_weight`, `seo_title`, `seo_description`, `seo_keywords`, `status`, `is_current`, `user_id`, `create_date`) VALUES 
(1, 1, 1, 'Welcome to Optimus CMS', 'Optimus CMS is a powerful, modern content management system built with NestJS, React, and Next.js', 'Welcome to Optimus CMS

Optimus CMS is a full-stack content management system designed for modern web applications. Built with cutting-edge technologies including NestJS for the backend, React for the admin interface, and Next.js for the client-facing frontend, Optimus CMS provides a robust foundation for managing content, users, permissions, and more.

Key Features:
- Flexible content management with article versioning
- Role-based access control and permissions
- File upload and storage management
- Modern admin dashboard
- RESTful API architecture
- TypeScript throughout for type safety

Optimus CMS empowers developers and content creators to build and manage sophisticated web applications with ease.', NULL, 100, 'Welcome to Optimus CMS', 'Optimus CMS - A modern content management system built with NestJS, React, and Next.js', 'Optimus,CMS,Content Management System,NestJS,React,Next.js', 'published', 1, '1', '2024-01-01 10:00:00');
COMMIT;

-- ----------------------------
-- Table structure for op_sys_article_operation_log
-- ----------------------------
-- DROP TABLE IF EXISTS `op_sys_article_operation_log`;
CREATE TABLE IF NOT EXISTS `op_sys_article_operation_log` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `article_id` bigint NOT NULL COMMENT '文章ID',
  `operationType` varchar(50) NOT NULL COMMENT '操作类型',
  `description` text DEFAULT NULL COMMENT '操作描述',
  `beforeData` json DEFAULT NULL COMMENT '操作前数据',
  `afterData` json DEFAULT NULL COMMENT '操作后数据',
  `user_id` varchar(50) NOT NULL COMMENT '操作用户ID',
  `status` varchar(20) NOT NULL DEFAULT 'success' COMMENT '操作状态: success, failed',
  `errorMessage` text DEFAULT NULL COMMENT '错误信息',
  `create_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  PRIMARY KEY (`id`),
  KEY `idx_article_id` (`article_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_create_date` (`create_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章操作日志表';

-- ----------------------------
-- Records of op_sys_article_operation_log (Empty for now - logs will be created automatically)
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for op_biz_order
-- ----------------------------
-- DROP TABLE IF EXISTS `op_biz_order`;
CREATE TABLE IF NOT EXISTS `op_biz_order` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `order_no` varchar(100) NOT NULL COMMENT '订单号（唯一）',
  `uid` varchar(100) NOT NULL COMMENT 'GameWemade 用户ID',
  `product_id` varchar(50) NOT NULL COMMENT '产品ID',
  `amount` decimal(10,2) NOT NULL COMMENT '订单金额',
  `status` enum('pending','paid','confirmed') NOT NULL DEFAULT 'pending' COMMENT '订单状态: pending-待支付, paid-已支付, confirmed-已确认收货',
  `cp_order_no` varchar(100) DEFAULT NULL COMMENT '游戏订单号',
  `channel_order_no` varchar(100) DEFAULT NULL COMMENT '支付渠道订单号',
  `pay_type` int DEFAULT NULL COMMENT '支付方式ID',
  `pay_time` timestamp NULL DEFAULT NULL COMMENT '支付时间',
  `confirm_time` timestamp NULL DEFAULT NULL COMMENT '确认收货时间',
  `role_name` varchar(100) DEFAULT NULL COMMENT '角色名',
  `server_name` varchar(100) DEFAULT NULL COMMENT '区服名',
  `extras_params` json DEFAULT NULL COMMENT '扩展参数（JSON格式）',
  `create_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_order_no` (`order_no`),
  KEY `idx_uid` (`uid`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- ----------------------------
-- Records of op_biz_order (Empty for now - orders will be created through API)
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for op_biz_recharge_record
-- ----------------------------
-- DROP TABLE IF EXISTS `op_biz_recharge_record`;
CREATE TABLE IF NOT EXISTS `op_biz_recharge_record` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '充值记录ID',
  `uid` varchar(100) NOT NULL COMMENT '用户ID（唯一）',
  `amount` bigint NOT NULL COMMENT '充值金额（单位：分）',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `extras` json DEFAULT NULL COMMENT '扩展字段（JSON格式）',
  `create_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_uid` (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='充值记录表';

-- ----------------------------
-- Records of op_biz_recharge_record (Empty for now - records will be imported through admin)
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for op_biz_activity
-- ----------------------------
-- DROP TABLE IF EXISTS `op_biz_activity`;
CREATE TABLE IF NOT EXISTS `op_biz_activity` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '活动ID',
  `activity_code` varchar(100) NOT NULL COMMENT '活动唯一代码，用于识别唯一活动',
  `name` varchar(200) NOT NULL COMMENT '活动名称',
  `start_time` timestamp NOT NULL COMMENT '活动开始时间',
  `end_time` timestamp NOT NULL COMMENT '活动结束时间',
  `rules` text DEFAULT NULL COMMENT '活动规则（暂时不用，预留字段）',
  `type` enum('recharge_rebate', 'daily_checkin', 'task_reward', 'other') NOT NULL COMMENT '活动类型，用于识别走哪一类的活动',
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否已删除（软删除标记）',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT '删除时间',
  `create_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_activity_code` (`activity_code`),
  KEY `idx_type` (`type`),
  KEY `idx_is_deleted` (`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动中心表';

-- ----------------------------
-- Records of op_biz_activity (Empty for now - activities will be created through admin)
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for op_biz_reward_claim_record
-- ----------------------------
-- DROP TABLE IF EXISTS `op_biz_reward_claim_record`;
CREATE TABLE IF NOT EXISTS `op_biz_reward_claim_record` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `uid` varchar(100) NOT NULL COMMENT '用户ID',
  `activity_code` varchar(100) NOT NULL COMMENT '活动代码，关联到活动中心',
  `role_id` varchar(100) NOT NULL COMMENT '角色ID',
  `server_id` varchar(100) NOT NULL COMMENT '服务器ID',
  `status` enum('claiming','claimed','failed') NOT NULL DEFAULT 'claiming' COMMENT '领取状态：CLAIMING(领取中)、CLAIMED(已发放)、FAILED(领取失败)',
  `claim_start_time` timestamp NOT NULL COMMENT '开始领取时间',
  `claim_success_time` timestamp NULL DEFAULT NULL COMMENT '成功时间',
  `claim_fail_time` timestamp NULL DEFAULT NULL COMMENT '失败时间',
  `fail_reason` varchar(500) DEFAULT NULL COMMENT '失败原因',
  `rewards` json NOT NULL COMMENT '奖励信息数组，格式：[{ id: string, name: string, quantity: number }]',
  `create_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='奖励发放记录表';

-- ----------------------------
-- Records of op_biz_reward_claim_record (Empty for now - records will be created through API)
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for op_sys_database_backup
-- ----------------------------
-- DROP TABLE IF EXISTS `op_sys_database_backup`;
CREATE TABLE IF NOT EXISTS `op_sys_database_backup` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `fileName` varchar(255) NOT NULL COMMENT '备份文件名',
  `fileKey` varchar(500) NOT NULL COMMENT '文件键名（OSS路径）',
  `fileSize` bigint(20) NOT NULL COMMENT '文件大小（字节）',
  `backupType` varchar(20) NOT NULL COMMENT '备份类型：auto/manual',
  `storageProvider` varchar(50) NOT NULL COMMENT '存储提供商：minio/aliyun',
  `status` varchar(20) NOT NULL DEFAULT 'pending' COMMENT '备份状态：pending/completed/failed',
  `startTime` datetime NOT NULL COMMENT '备份开始时间',
  `completedTime` datetime DEFAULT NULL COMMENT '备份完成时间',
  `duration` int(11) DEFAULT NULL COMMENT '备份耗时（毫秒）',
  `errorMessage` text DEFAULT NULL COMMENT '错误信息',
  `description` varchar(500) DEFAULT NULL COMMENT '备份描述',
  `createdBy` int(11) DEFAULT NULL COMMENT '创建人ID',
  `createDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updateDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `isDeleted` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否已删除：0-否，1-是',
  `deletedAt` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  KEY `idx_backup_type` (`backupType`),
  KEY `idx_status` (`status`),
  KEY `idx_start_time` (`startTime`),
  KEY `idx_storage_provider` (`storageProvider`),
  KEY `idx_is_deleted` (`isDeleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据库备份记录表';

-- ----------------------------
-- Records of op_sys_database_backup (Empty for now - backup records will be created automatically)
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for op_biz_partner_profile (根据实体定义添加)
-- ----------------------------
CREATE TABLE IF NOT EXISTS `op_biz_partner_profile` (
  `partner_id` bigint NOT NULL AUTO_INCREMENT COMMENT '合伙人ID',
  `user_id` varchar(255) NOT NULL COMMENT '通用用户标识',
  `user_source` varchar(50) NOT NULL DEFAULT 'wemade' COMMENT '用户来源',
  `uid` varchar(100) NULL COMMENT '用户ID（向后兼容）',
  `username` varchar(100) NULL COMMENT '用户名（向后兼容）',
  `partner_code` varchar(32) NOT NULL COMMENT '合伙人代码',
  `status` enum('active', 'frozen', 'deleted') NOT NULL DEFAULT 'active' COMMENT '状态',
  `current_star` varchar(16) NOT NULL DEFAULT 'NEW' COMMENT '当前星级',
  `total_mira` bigint NOT NULL DEFAULT 0 COMMENT '总积分',
  `join_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  `last_update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  `remark` varchar(255) NULL COMMENT '备注',
  `extra_data` json NULL COMMENT '扩展数据',
  `team_name` varchar(100) NULL COMMENT '团队名称',
  PRIMARY KEY (`partner_id`),
  UNIQUE KEY `idx_partner_code` (`partner_code`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_user_source` (`user_source`),
  KEY `idx_uid` (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='合伙人资料表';

-- ----------------------------
-- Table structure for client_user (根据实体定义添加)
-- ----------------------------
CREATE TABLE IF NOT EXISTS `op_biz_client_user` (
  `user_id` bigint NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` varchar(50) NULL COMMENT '用户名',
  `email` varchar(100) NULL COMMENT '邮箱',
  `phone` varchar(20) NULL COMMENT '手机号',
  `password_hash` varchar(255) NULL COMMENT '密码哈希',
  `nickname` varchar(50) NULL COMMENT '昵称',
  `avatar` varchar(500) NULL COMMENT '头像',
  `status` enum('active', 'inactive', 'banned') NOT NULL DEFAULT 'active' COMMENT '状态',
  `register_source` varchar(50) NOT NULL DEFAULT 'direct' COMMENT '注册来源',
  `register_ip` varchar(45) NULL COMMENT '注册IP',
  `last_login_at` timestamp NULL COMMENT '最后登录时间',
  `last_login_ip` varchar(45) NULL COMMENT '最后登录IP',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `extra_data` json NULL COMMENT '扩展数据',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `idx_username` (`username`),
  UNIQUE KEY `idx_email` (`email`),
  UNIQUE KEY `idx_phone` (`phone`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客户端用户表';

-- ----------------------------
-- Table structure for op_biz_appointment (根据实体定义添加)
-- ----------------------------
CREATE TABLE IF NOT EXISTS `op_biz_appointment` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '预约记录ID',
  `phone` varchar(20) NOT NULL COMMENT '手机号',
  `uid` varchar(100) NULL COMMENT '用户UID',
  `stage` varchar(100) NOT NULL COMMENT '阶段',
  `channel` varchar(100) NOT NULL COMMENT '渠道',
  `appointment_time` timestamp NOT NULL COMMENT '预约时间',
  `extra_field_1` varchar(500) NULL COMMENT '额外字段1',
  `create_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_phone` (`phone`),
  KEY `idx_uid` (`uid`),
  KEY `idx_appointment_time` (`appointment_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预约表';

-- ----------------------------
-- Table structure for op_biz_partner_hierarchy (根据实体定义添加)
-- ----------------------------
CREATE TABLE IF NOT EXISTS `op_biz_partner_hierarchy` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `parent_partner_id` bigint NOT NULL COMMENT '父合伙人ID',
  `child_partner_id` bigint NOT NULL COMMENT '子合伙人ID',
  `level` tinyint NOT NULL COMMENT '层级',
  `source_channel_id` bigint NULL COMMENT '来源渠道ID',
  `bind_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '绑定时间',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否激活',
  PRIMARY KEY (`id`),
  KEY `idx_parent_level` (`parent_partner_id`, `level`),
  KEY `idx_child_level_active` (`child_partner_id`, `level`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='合伙人层级关系表';

-- ----------------------------
-- Table structure for op_biz_partner_channel (根据实体定义添加)
-- ----------------------------
CREATE TABLE IF NOT EXISTS `op_biz_partner_channel` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `partner_id` bigint NOT NULL COMMENT '合伙人ID',
  `channel_code` varchar(32) NOT NULL COMMENT '渠道代码',
  `name` varchar(64) NOT NULL COMMENT '渠道名称',
  `short_url` varchar(255) NULL COMMENT '短链接',
  `status` enum('active', 'disabled') NOT NULL DEFAULT 'active' COMMENT '状态',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_partner_channel` (`partner_id`, `channel_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='合伙人渠道表';

-- ----------------------------
-- Table structure for op_biz_client_user_external_account (根据实体定义添加)
-- ----------------------------
CREATE TABLE IF NOT EXISTS `op_biz_client_user_external_account` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `platform` varchar(50) NOT NULL COMMENT '平台',
  `external_user_id` varchar(255) NOT NULL COMMENT '外部用户ID',
  `external_username` varchar(100) NULL COMMENT '外部用户名',
  `external_email` varchar(100) NULL COMMENT '外部邮箱',
  `external_avatar` varchar(500) NULL COMMENT '外部头像',
  `bind_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '绑定时间',
  `last_sync_time` timestamp NULL COMMENT '最后同步时间',
  `is_primary` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否主账号',
  `extra_data` json NULL COMMENT '扩展数据',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_platform` (`user_id`, `platform`),
  UNIQUE KEY `idx_platform_external` (`platform`, `external_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客户端用户外部账号表';

SET FOREIGN_KEY_CHECKS = 1;
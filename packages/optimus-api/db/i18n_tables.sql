-- 多语言键值表(i18n-foundation 迭代)
-- dev 库 DB_SYNCHRONIZE=false,与 form_tables.sql 同惯例:模块建表 SQL 独立成文件,
-- 新环境安装时随 optimus-minimal.sql 之后执行

CREATE TABLE IF NOT EXISTS `op_sys_i18n_entry` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `namespace` varchar(64) NOT NULL COMMENT '命名空间,如 portal/docs',
  `key` varchar(128) NOT NULL COMMENT '文案键,如 hero.title',
  `translations` json NOT NULL COMMENT '{locale: 文本}。zh-CN 是回退源语言',
  `remark` varchar(255) DEFAULT NULL COMMENT '给译者(或翻译模型)的上下文备注',
  `create_date` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `update_date` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ns_key` (`namespace`, `key`),
  KEY `idx_namespace` (`namespace`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='多语言键值';

-- 权限码:多语言管理菜单
INSERT IGNORE INTO `op_sys_role_menu` (`id`, `role_id`, `permission_code`) VALUES (64, 1, 'I18nManagement'), (65, 2, 'I18nManagement');

-- 演示 namespace: portal(仅 zh-CN,验收 AI 补全用)
INSERT IGNORE INTO `op_sys_i18n_entry` (`id`, `namespace`, `key`, `translations`, `remark`) VALUES
(1, 'portal', 'hero.title', JSON_OBJECT('zh-CN', '一体化内容管理平台'), '官网首屏主标题'),
(2, 'portal', 'hero.subtitle', JSON_OBJECT('zh-CN', '内容、表单、数据集合与多语言，一个后台全管理'), '官网首屏副标题'),
(3, 'portal', 'cta.contact', JSON_OBJECT('zh-CN', '联系我们'), '按钮文案,保持简短');

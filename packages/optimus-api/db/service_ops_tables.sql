-- service-ops:服务事件 outbox 表 + ServiceOps 权限码 + 服务目录专表(op_sys_service_registry)
-- 执行方式(dev): docker exec -i morphixai-cms-db-1 mysql -uroot -p*** optimus --default-character-set=utf8mb4 < 本文件

-- ----------------------------
-- 服务事件表:事务性 outbox,id 兼作消费游标。
-- 不引 broker;将来引 NATS 时本表升级为 relay 源
-- ----------------------------
CREATE TABLE IF NOT EXISTS `op_sys_service_event` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID,兼作消费游标',
  `source` varchar(50) NOT NULL COMMENT '事件来源服务(slug)',
  `type` varchar(100) NOT NULL COMMENT '事件类型,如 agent.run.finished',
  `payload` json DEFAULT NULL COMMENT '事件载荷',
  `by` varchar(50) DEFAULT NULL COMMENT '发起人账号(服务端记录)',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务事件(outbox)';

BEGIN;
-- ServiceOps 权限码:服务状态面板与事件流读取
INSERT IGNORE INTO `op_sys_role_menu` (`id`, `role_id`, `permission_code`) VALUES (68, 1, 'ServiceOps'), (69, 2, 'ServiceOps');


-- ----------------------------
-- 服务目录专表:探测/动态菜单/Agent 工具/zone 路由四个消费者的唯一事实源。
-- 曾复用字典集合行,但字典页(DataCollections 权限)一个删除就能端掉整个目录——
-- 基础设施数据与业务数据物理隔离,本表只有 ServiceOps 门后的接口能写。
-- path_prefix 唯一索引兜底 zone 前缀撞车(MySQL 多个 NULL 不冲突)
-- ----------------------------
CREATE TABLE IF NOT EXISTS `op_sys_service_registry` (
  `id` int NOT NULL AUTO_INCREMENT,
  `key` varchar(50) NOT NULL COMMENT '服务标识(slug)',
  `name` varchar(100) NOT NULL COMMENT '服务名',
  `base_url` varchar(500) NOT NULL COMMENT 'API 根,可含路径前缀,各 path 直接串接',
  `health_path` varchar(200) DEFAULT NULL,
  `metrics_path` varchar(200) DEFAULT NULL,
  `tools_path` varchar(200) DEFAULT NULL COMMENT 'Agent 工具声明端点',
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `entry_type` varchar(10) NOT NULL DEFAULT 'none' COMMENT 'none/embed/zone',
  `embed_url` varchar(500) DEFAULT NULL,
  `menu_title` varchar(100) DEFAULT NULL,
  `menu_icon` varchar(50) DEFAULT NULL,
  `perm_code` varchar(50) DEFAULT NULL,
  `path_prefix` varchar(50) DEFAULT NULL COMMENT 'zone 专用 URL 前缀,全域唯一',
  `api_path_prefixes` json DEFAULT NULL COMMENT 'C 端 API 代理路由前缀(可多个),唯一性应用层校验',
  `trust_level` varchar(20) NOT NULL DEFAULT 'first-party' COMMENT '代码提供方可信程度:first-party/second-party/third-party。非业务重要性分级',
  `grants` json DEFAULT NULL COMMENT '该服务被授予的平台能力(服务的权限码,与用户权限码体系独立)',
  `parent_key` varchar(50) DEFAULT NULL COMMENT '归组到哪条记录之下(指向另一行的 key)。空=顶层;只支持两层',
  `sort_order` int NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_key` (`key`),
  UNIQUE KEY `uk_path_prefix` (`path_prefix`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务目录(基础设施,勿手工删改)';

-- 内置服务 seed:key 有唯一索引,INSERT IGNORE 天然幂等
--
-- **grants 必须显式写出**,不能靠列默认值。列默认是 NULL,而 toEntry() 把 NULL 归一成
-- 空数组——"没配"和"什么都不许"在服务目录里是同一种表现(这是刻意的,见该函数注释)。
-- 结果就是全新环境里所有内置服务的 grants 为空,@RequireGrant 的接口(如
-- /api/service/user-profile/*)一律 403。已存在的库由 service_registry_trust_model.sql
-- 的 UPDATE 兜底,新库只能靠这里。
-- 这里写死字面量而不是引用应用层常量:SQL 跑在应用之外。两边不一致时,
-- 以 service-trust.constants.ts 的 DEFAULT_GRANTS_BY_TRUST_LEVEL 为准。
--
-- api_path_prefixes 同理必须在 seed 里给全:C 端 /api/[...path] 代理按它分流,
-- 缺了这一列,拆出去的服务在新环境里收不到任何 C 端请求(而且是静默的——
-- 请求会照常转给 optimus-api,只是 404)。
SET @first_party_grants = JSON_ARRAY(
  'user-profile:read-basic', 'user-profile:read-full', 'points:grant', 'oss:upload', 'shortlink:create'
);
INSERT IGNORE INTO `op_sys_service_registry`
  (`key`, `name`, `base_url`, `health_path`, `metrics_path`, `tools_path`, `enabled`, `entry_type`, `embed_url`, `menu_title`, `menu_icon`, `perm_code`, `path_prefix`, `api_path_prefixes`, `trust_level`, `grants`, `sort_order`) VALUES
  ('optimus-api',     '平台服务(optimus-api)',     'http://localhost:8084/api', '/health',   '/metrics-lite', '/system/agent/tools', 1, 'none',  NULL, NULL, NULL, NULL, NULL, NULL, 'first-party', @first_party_grants, 0),
  ('partner-service', '合伙人服务(partner-service)', 'http://localhost:8089',     '/health',   '/metrics-lite', NULL, 1, 'embed', 'http://localhost:8089/admin/', '合伙人服务', 'TeamOutlined', 'PartnerManagement', NULL, JSON_ARRAY('/biz/partner', '/biz/points', '/external-task'), 'first-party', @first_party_grants, 0),
  ('agent-service',   '智能体服务(agent-service)',   'http://localhost:8087',     '/health',   '/metrics-lite', NULL, 1, 'none',  NULL, NULL, NULL, NULL, NULL, NULL, 'first-party', @first_party_grants, 10),
  ('optimus-ui',      '管理基座(optimus-ui)',      'http://localhost:8082',     '/',         NULL, NULL, 1, 'none',  NULL, NULL, NULL, NULL, NULL, NULL, 'first-party', @first_party_grants, 20),
  ('optimus-next',    'C端官网(optimus-next)',     'http://localhost:8086',     '/',         NULL, NULL, 1, 'none',  NULL, NULL, NULL, NULL, NULL, NULL, 'first-party', @first_party_grants, 30),
  ('demo-activity',   '演示活动(外部团队)',         'http://localhost:5190',     '/',         NULL, NULL, 1, 'embed', 'http://localhost:5190', '演示活动', 'AppstoreAddOutlined', 'DemoActivity', NULL, NULL, 'first-party', @first_party_grants, 40),
  ('zone-activity',   '活动中心(zone)',            'http://localhost:8088',     '/activity', NULL, NULL, 1, 'zone',  NULL, NULL, NULL, NULL, '/activity', NULL, 'first-party', @first_party_grants, 50);
COMMIT;

-- DatabaseBackup 权限码:备份接口曾全员 @AllowNoPerm 裸奔(任何登录账号可下载整库备份),
-- 2026-08-24 收权为 @Perm("DatabaseBackup"),码只发给管理员角色
INSERT IGNORE INTO `op_sys_role_menu` (`id`, `role_id`, `permission_code`) VALUES (70, 1, 'DatabaseBackup'), (71, 2, 'DatabaseBackup');

-- ContentShortLink 权限码:短链管理接口曾无任何权限标注(无标注默认放行=登录即用),
-- 收权对齐前端菜单码
INSERT IGNORE INTO `op_sys_role_menu` (`id`, `role_id`, `permission_code`) VALUES (72, 1, 'ContentShortLink'), (73, 2, 'ContentShortLink');

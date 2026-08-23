-- service-ops 迭代:服务事件 outbox 表 + ServiceOps 权限码 + services-registry 集合
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

-- services-registry: 服务目录——探测/动态菜单/Agent 工具三个消费者的唯一事实源。
-- 行数据是部署配置,推荐经"服务状态"页的目录接口维护(有 URL/联动校验),
-- 数据集合页仍可改但只有 form schema 级校验。private:含内网地址,不对外。
-- 不硬编码集合 id:id 会被环境里后建的集合占用,按 name 唯一键幂等
INSERT IGNORE INTO `op_sys_dictionary_collection` (`name`, `display_name`, `description`, `data_type`, `access_type`) VALUES
('services-registry', '服务目录', '服务探测/动态入口/Agent工具的统一登记处,推荐经服务状态页维护', 'object', 'private');

-- schema 与描述随迭代演进,INSERT IGNORE 不会更新已存在行,这里显式 UPDATE 保持幂等
UPDATE `op_sys_dictionary_collection` SET
  `display_name` = '服务目录',
  `description` = '服务探测/动态入口/Agent工具的统一登记处,推荐经服务状态页维护',
  `schema` = '{"title":"服务目录","fields":[{"key":"name","label":"服务名","type":"text","required":true},{"key":"baseUrl","label":"基础地址","type":"text","required":true},{"key":"healthPath","label":"健康检查路径","type":"text","placeholder":"默认 /health"},{"key":"metricsPath","label":"指标路径","type":"text","placeholder":"可空,如 /metrics-lite"},{"key":"enabled","label":"是否启用","type":"switch"},{"key":"entryType","label":"入口形态","type":"select","options":[{"label":"无入口","value":"none"},{"label":"iframe 嵌入","value":"embed"}]},{"key":"embedUrl","label":"嵌入地址","type":"text","placeholder":"entryType=embed 时必填"},{"key":"menuTitle","label":"菜单标题","type":"text"},{"key":"menuIcon","label":"菜单图标","type":"text","placeholder":"antd 图标名,如 AppstoreOutlined"},{"key":"permCode","label":"权限码","type":"text","placeholder":"空=仅 ServiceOps 可见"},{"key":"toolsPath","label":"Agent工具端点","type":"text","placeholder":"如 /system/agent/tools"}]}'
WHERE `name` = 'services-registry';

-- 行插入:uk_collection_key_user 含 user_id,NULL 不参与唯一判定,INSERT IGNORE 对
-- 这类行不幂等(重复导入会翻倍)——用 NOT EXISTS 守护
INSERT INTO `op_sys_dictionary` (`collection`, `key`, `value`, `sort_order`, `remark`)
SELECT * FROM (SELECT 'services-registry' c, 'optimus-api' k,
  '{"name": "平台服务(optimus-api)", "baseUrl": "http://localhost:8084/api", "healthPath": "/health", "metricsPath": "/metrics-lite", "enabled": true, "toolsPath": "/system/agent/tools"}' v, 0 s, 'baseUrl 即 API 根(含全局前缀 /api),各 path 直接串接' r) t
WHERE NOT EXISTS (SELECT 1 FROM `op_sys_dictionary` WHERE collection='services-registry' AND `key`='optimus-api');

INSERT INTO `op_sys_dictionary` (`collection`, `key`, `value`, `sort_order`, `remark`)
SELECT * FROM (SELECT 'services-registry' c, 'agent-service' k,
  '{"name": "智能体服务(agent-service)", "baseUrl": "http://localhost:8087", "healthPath": "/health", "metricsPath": "/metrics-lite", "enabled": true}' v, 10 s, '独立进程,需模型密钥' r) t
WHERE NOT EXISTS (SELECT 1 FROM `op_sys_dictionary` WHERE collection='services-registry' AND `key`='agent-service');

INSERT INTO `op_sys_dictionary` (`collection`, `key`, `value`, `sort_order`, `remark`)
SELECT * FROM (SELECT 'services-registry' c, 'optimus-ui' k,
  '{"name": "管理基座(optimus-ui)", "baseUrl": "http://localhost:8082", "healthPath": "/", "enabled": true}' v, 20 s, '静态站,探根路径' r) t
WHERE NOT EXISTS (SELECT 1 FROM `op_sys_dictionary` WHERE collection='services-registry' AND `key`='optimus-ui');

INSERT INTO `op_sys_dictionary` (`collection`, `key`, `value`, `sort_order`, `remark`)
SELECT * FROM (SELECT 'services-registry' c, 'optimus-next' k,
  '{"name": "C端官网(optimus-next)", "baseUrl": "http://localhost:8086", "healthPath": "/", "enabled": true}' v, 30 s, '静态站,探根路径' r) t
WHERE NOT EXISTS (SELECT 1 FROM `op_sys_dictionary` WHERE collection='services-registry' AND `key`='optimus-next');

-- demo-activity: 外部团队子应用,经服务目录动态接入(embed 入口+DemoActivity 权限码),
-- 原 routes.js 静态节点已下线——这行就是"零代码接入"的最终形态
INSERT INTO `op_sys_dictionary` (`collection`, `key`, `value`, `sort_order`, `remark`)
SELECT * FROM (SELECT 'services-registry' c, 'demo-activity' k,
  '{"name": "演示活动(外部团队)", "baseUrl": "http://localhost:5190", "healthPath": "/", "enabled": true, "entryType": "embed", "embedUrl": "http://localhost:5190", "menuTitle": "演示活动", "menuIcon": "AppstoreAddOutlined", "permCode": "DemoActivity"}' v, 40 s, '嵌入协议验收样例,examples/demo-activity 下 node serve.mjs 拉起' r) t
WHERE NOT EXISTS (SELECT 1 FROM `op_sys_dictionary` WHERE collection='services-registry' AND `key`='demo-activity');
COMMIT;

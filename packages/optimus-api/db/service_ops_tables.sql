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

-- services-registry: 探测器的服务清单。行数据是部署配置,管理端"数据集合"页维护,
-- 改完探测器下一轮(15s)生效。private:清单含内网地址,不对外
INSERT IGNORE INTO `op_sys_dictionary_collection` (`id`, `name`, `display_name`, `description`, `data_type`, `schema`, `access_type`) VALUES
(4, 'services-registry', '服务注册清单', '服务探测器的目标清单,改动下一轮探测生效', 'object',
 '{"title":"服务注册","fields":[{"key":"name","label":"服务名","type":"text","required":true},{"key":"baseUrl","label":"基础地址","type":"text","required":true},{"key":"healthPath","label":"健康检查路径","type":"text","placeholder":"默认 /health"},{"key":"metricsPath","label":"指标路径","type":"text","placeholder":"可空,如 /metrics-lite"},{"key":"enabled","label":"是否探测","type":"switch"}]}',
 'private');

INSERT IGNORE INTO `op_sys_dictionary` (`collection`, `key`, `value`, `sort_order`, `remark`) VALUES
('services-registry', 'optimus-api',   '{"name": "平台服务(optimus-api)", "baseUrl": "http://localhost:8084", "healthPath": "/api/health", "metricsPath": "/api/metrics-lite", "enabled": true}', 0, '平台内核,注意全局前缀 /api'),
('services-registry', 'agent-service', '{"name": "智能体服务(agent-service)", "baseUrl": "http://localhost:8087", "healthPath": "/health", "metricsPath": "/metrics-lite", "enabled": true}', 10, '独立进程,需模型密钥'),
('services-registry', 'optimus-ui',    '{"name": "管理基座(optimus-ui)", "baseUrl": "http://localhost:8082", "healthPath": "/", "enabled": true}', 20, '静态站,探根路径'),
('services-registry', 'optimus-next',  '{"name": "C端官网(optimus-next)", "baseUrl": "http://localhost:8086", "healthPath": "/", "enabled": true}', 30, '静态站,探根路径');
COMMIT;

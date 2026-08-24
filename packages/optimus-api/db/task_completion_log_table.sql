-- op_biz_task_completion_log:任务完成事件表(积分账本的事件溯源来源,余额=按此表汇总,不单独存字段)。
-- 此前只存在于 TypeORM 实体定义里,从未有配套建表脚本——dev.yml 默认 synchronize:true,
-- 但 .env 显式 DB_SYNCHRONIZE=false 覆盖,导致这张表在任何环境都没被自动建出来。
-- 表缺失曾导致两条路径 500:GET /biz/partner/admin/dashboard(读,统计活跃合伙人)、
-- POST /admin/external-task/submissions/:id/approve(写,processExternalTaskEvent 写本表)。
-- 执行方式(dev): docker exec -i morphixai-cms-db-1 mysql -uroot -p*** optimus --default-character-set=utf8mb4 < 本文件
CREATE TABLE IF NOT EXISTS `op_biz_task_completion_log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `task_code` varchar(64) NOT NULL COMMENT '任务配置编码',
  `task_type` enum('REGISTER','INVITE_SUCCESS','GAME_ACTION','EXTERNAL_TASK') NOT NULL,
  `partner_id` bigint NOT NULL COMMENT '获得积分的合伙人',
  `uid` varchar(100) NOT NULL COMMENT '触发事件的用户 uid',
  `related_partner_id` bigint DEFAULT NULL COMMENT '关联合伙人(如邀请任务的被邀请人)',
  `related_uid` varchar(100) DEFAULT NULL,
  `event_type` varchar(64) NOT NULL,
  `event_id` varchar(128) NOT NULL COMMENT '幂等键组成部分,防同一事件重复计分',
  `business_params` json DEFAULT NULL,
  `status` enum('COMPLETED') NOT NULL DEFAULT 'COMPLETED',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_task_partner_event` (`task_code`, `partner_id`, `event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务完成事件(积分账本事件源)';

-- op_biz_partner_admin_log:合伙人管理台操作审计表(冻结/解冻/改上级/清数据等敏感操作留痕)。
-- 和 task_completion_log_table.sql 是同一类问题:表只在 AdminOperationLogEntity 里定义过,
-- 从未配套建表脚本(dev.yml 默认 synchronize:true 但 .env 显式 DB_SYNCHRONIZE=false 覆盖,
-- 表从未被自动建出来)。表缺失导致冻结/解冻接口(PUT .../freeze、.../unfreeze)每次都 500——
-- 底层状态更新其实已经成功写入,只是紧接着写审计日志这一步失败导致整个请求抛异常,
-- 验证 5.4 管理台真实点击冻结按钮时才被触发(之前从未有人真正点过这两个按钮)。
-- 执行方式(dev): docker exec -i morphixai-cms-db-1 mysql -uroot -p*** optimus --default-character-set=utf8mb4 < 本文件
CREATE TABLE IF NOT EXISTS `op_biz_partner_admin_log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `partner_id` bigint NOT NULL COMMENT '被操作的合伙人',
  `operation_type` varchar(50) NOT NULL COMMENT '操作类型:FREEZE/UNFREEZE/SET_UPLINK/UPDATE_REMARK 等',
  `admin_id` varchar(100) NOT NULL COMMENT '操作管理员',
  `reason` text DEFAULT NULL,
  `before_data` json DEFAULT NULL,
  `after_data` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_partner_id` (`partner_id`),
  KEY `idx_admin_id` (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='合伙人管理台操作审计日志';

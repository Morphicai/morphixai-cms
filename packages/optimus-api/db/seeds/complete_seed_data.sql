-- ============================================
-- 完整种子数据 SQL
-- 创建时间: 2025-12-08
-- 说明: 包含所有表结构和初始化数据
-- ============================================

-- ============================================
-- 第一部分: 短链表
-- ============================================
CREATE TABLE IF NOT EXISTS `short_link` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `token` varchar(6) NOT NULL COMMENT '6位短链token',
  `target` json NOT NULL COMMENT '目标内容（JSON格式，支持多平台配置）',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active' COMMENT '状态',
  `source` enum('admin','system','api') NOT NULL DEFAULT 'admin' COMMENT '来源',
  `disabled` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否禁用',
  `use_count` int NOT NULL DEFAULT 0 COMMENT '使用次数',
  `last_used_at` timestamp NULL DEFAULT NULL COMMENT '最后使用时间',
  `extra` json DEFAULT NULL COMMENT '扩展字段（JSON格式）',
  `created_by` int DEFAULT NULL COMMENT '创建人ID',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注说明',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_token` (`token`),
  KEY `idx_status` (`status`),
  KEY `idx_source` (`source`),
  KEY `idx_disabled` (`disabled`),
  KEY `idx_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='短链表';

-- ============================================
-- 第二部分: 任务完成日志表
-- ============================================
CREATE TABLE IF NOT EXISTS `biz_task_completion_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `task_code` VARCHAR(64) NOT NULL COMMENT '任务代码',
  `task_type` VARCHAR(64) NOT NULL COMMENT '任务类型',
  `partner_id` BIGINT NOT NULL COMMENT '获得积分的合伙人ID',
  `uid` VARCHAR(100) NOT NULL COMMENT '获得积分的用户ID（冗余）',
  `related_partner_id` BIGINT NULL COMMENT '相关合伙人ID（如被邀请人）',
  `related_uid` VARCHAR(100) NULL COMMENT '相关用户ID（如被邀请人，冗余）',
  `event_type` VARCHAR(64) NOT NULL COMMENT '触发的事件类型',
  `event_id` VARCHAR(128) NOT NULL COMMENT '领域事件ID（用于幂等）',
  `business_params` JSON NULL COMMENT '业务参数（JSON格式）',
  `status` ENUM('COMPLETED') NOT NULL DEFAULT 'COMPLETED' COMMENT '状态',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_partner_id` (`partner_id`),
  INDEX `idx_uid` (`uid`),
  INDEX `idx_created_at` (`created_at`),
  UNIQUE INDEX `idx_task_partner_event` (`task_code`, `partner_id`, `event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务完成日志表';

-- ============================================
-- 第三部分: 外部任务提交记录表
-- ============================================
CREATE TABLE IF NOT EXISTS `biz_external_task_submission` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  `submission_code` VARCHAR(64) NOT NULL COMMENT '提交编号',
  `task_type` VARCHAR(64) NOT NULL COMMENT '任务类型',
  `partner_id` BIGINT NOT NULL COMMENT '提交人合伙人ID',
  `uid` VARCHAR(100) NOT NULL COMMENT '提交人UID',
  `task_link` VARCHAR(500) NULL COMMENT '任务链接',
  `proof_images` JSON NULL COMMENT '证明图片数组',
  `remark` TEXT NULL COMMENT '备注说明',
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING' COMMENT '审核状态',
  `reviewer_id` BIGINT NULL COMMENT '审核人ID',
  `review_time` TIMESTAMP NULL COMMENT '审核时间',
  `review_remark` TEXT NULL COMMENT '审核备注',
  `points_awarded` INT NULL COMMENT '奖励积分（审核通过后记录）',
  `task_log_id` BIGINT NULL COMMENT '关联的任务完成日志ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  UNIQUE KEY `uk_submission_code` (`submission_code`),
  KEY `idx_partner_id` (`partner_id`),
  KEY `idx_status` (`status`),
  KEY `idx_task_type` (`task_type`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='外部任务提交记录表';

-- ============================================
-- 第四部分: 表结构修改
-- ============================================

-- 修改公会表的会长角色ID字段为可空（如果表已存在）
-- ALTER TABLE `game_guild` 
-- MODIFY COLUMN `leader_character_id` INT NULL COMMENT '会长角色ID（可选）';

-- ============================================
-- 第五部分: 初始化数据
-- ============================================

-- 暂无初始化数据
-- 可以在这里添加必要的种子数据，例如：
-- - 系统配置
-- - 默认角色
-- - 测试数据等

-- ============================================
-- 完成标记
-- ============================================
-- 种子数据初始化完成
-- 执行时间: 2025-12-08

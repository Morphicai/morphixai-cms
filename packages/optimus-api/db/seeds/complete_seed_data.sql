-- ============================================
-- 完整种子数据 SQL
-- 创建时间: 2025-12-08
-- 更新时间: 2025-01-03
-- 说明: 包含所有表结构和初始化数据，已根据 TypeORM 实体定义修正
-- ============================================

-- ============================================
-- 第一部分: 短链表
-- ============================================
CREATE TABLE IF NOT EXISTS `op_sys_short_link` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `token` varchar(6) NOT NULL COMMENT '6位短链token',
  `target` text NOT NULL COMMENT '目标内容（支持字符串或JSON格式，使用 ValueTransformer 处理）',
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
CREATE TABLE IF NOT EXISTS `op_biz_task_completion_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `task_code` VARCHAR(64) NOT NULL COMMENT '任务代码',
  `task_type` ENUM('REGISTER', 'INVITE_SUCCESS', 'GAME_ACTION', 'EXTERNAL_TASK') NOT NULL COMMENT '任务类型',
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
CREATE TABLE IF NOT EXISTS `op_biz_external_task_submission` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  `submission_code` VARCHAR(64) NOT NULL COMMENT '提交编号',
  `task_type` ENUM('SOCIAL_SHARE', 'CONTENT_CREATION', 'COMMUNITY_ACTIVITY', 'FEEDBACK_SUBMIT', 'DOUYIN_SHORT_VIDEO', 'DOUYIN_LIVE_30MIN', 'DOUYIN_LIVE_50MIN', 'DOUYIN_LIVE_100MIN', 'MANYI_DRIVER_VERIFY', 'KUAIDI_COURIER_VERIFY') NOT NULL COMMENT '任务类型',
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
-- 第四部分: 活动中心表（根据实体定义添加）
-- ============================================
CREATE TABLE IF NOT EXISTS `op_biz_activity` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '活动ID',
  `activity_code` VARCHAR(100) NOT NULL COMMENT '活动唯一代码，用于识别唯一活动',
  `name` VARCHAR(200) NOT NULL COMMENT '活动名称',
  `start_time` TIMESTAMP NOT NULL COMMENT '活动开始时间',
  `end_time` TIMESTAMP NOT NULL COMMENT '活动结束时间',
  `rules` TEXT DEFAULT NULL COMMENT '活动规则（暂时不用，预留字段）',
  `type` ENUM('recharge_rebate', 'daily_checkin', 'task_reward', 'other') NOT NULL COMMENT '活动类型，用于识别走哪一类的活动',
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已删除（软删除标记）',
  `deleted_at` TIMESTAMP NULL DEFAULT NULL COMMENT '删除时间',
  `create_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_activity_code` (`activity_code`),
  KEY `idx_type` (`type`),
  KEY `idx_is_deleted` (`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动中心表';

-- ============================================
-- 第五部分: 合伙人资料表（根据实体定义添加）
-- ============================================
CREATE TABLE IF NOT EXISTS `op_biz_partner_profile` (
  `partner_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '合伙人ID',
  `user_id` VARCHAR(255) NOT NULL COMMENT '通用用户标识',
  `user_source` VARCHAR(50) NOT NULL DEFAULT 'wemade' COMMENT '用户来源',
  `uid` VARCHAR(100) NULL COMMENT '用户ID（向后兼容）',
  `username` VARCHAR(100) NULL COMMENT '用户名（向后兼容）',
  `partner_code` VARCHAR(32) NOT NULL COMMENT '合伙人代码',
  `status` ENUM('active', 'frozen', 'deleted') NOT NULL DEFAULT 'active' COMMENT '状态',
  `current_star` VARCHAR(16) NOT NULL DEFAULT 'NEW' COMMENT '当前星级',
  `total_mira` BIGINT NOT NULL DEFAULT 0 COMMENT '总积分',
  `join_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  `last_update_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  `remark` VARCHAR(255) NULL COMMENT '备注',
  `extra_data` JSON NULL COMMENT '扩展数据',
  `team_name` VARCHAR(100) NULL COMMENT '团队名称',
  PRIMARY KEY (`partner_id`),
  UNIQUE KEY `idx_partner_code` (`partner_code`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_user_source` (`user_source`),
  KEY `idx_uid` (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='合伙人资料表';

-- ============================================
-- 第六部分: 客户端用户表（根据实体定义添加）
-- ============================================
CREATE TABLE IF NOT EXISTS `op_biz_client_user` (
  `user_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` VARCHAR(50) NULL COMMENT '用户名',
  `email` VARCHAR(100) NULL COMMENT '邮箱',
  `phone` VARCHAR(20) NULL COMMENT '手机号',
  `password_hash` VARCHAR(255) NULL COMMENT '密码哈希',
  `nickname` VARCHAR(50) NULL COMMENT '昵称',
  `avatar` VARCHAR(500) NULL COMMENT '头像',
  `status` ENUM('active', 'inactive', 'banned') NOT NULL DEFAULT 'active' COMMENT '状态',
  `register_source` VARCHAR(50) NOT NULL DEFAULT 'direct' COMMENT '注册来源',
  `register_ip` VARCHAR(45) NULL COMMENT '注册IP',
  `last_login_at` TIMESTAMP NULL COMMENT '最后登录时间',
  `last_login_ip` VARCHAR(45) NULL COMMENT '最后登录IP',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `extra_data` JSON NULL COMMENT '扩展数据',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `idx_username` (`username`),
  UNIQUE KEY `idx_email` (`email`),
  UNIQUE KEY `idx_phone` (`phone`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客户端用户表';

-- ============================================
-- 第七部分: 预约表（根据实体定义添加）
-- ============================================
CREATE TABLE IF NOT EXISTS `op_biz_appointment` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '预约记录ID',
  `phone` VARCHAR(20) NOT NULL COMMENT '手机号',
  `uid` VARCHAR(100) NULL COMMENT '用户UID',
  `stage` VARCHAR(100) NOT NULL COMMENT '阶段',
  `channel` VARCHAR(100) NOT NULL COMMENT '渠道',
  `appointment_time` TIMESTAMP NOT NULL COMMENT '预约时间',
  `extra_field_1` VARCHAR(500) NULL COMMENT '额外字段1',
  `create_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_phone` (`phone`),
  KEY `idx_uid` (`uid`),
  KEY `idx_appointment_time` (`appointment_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预约表';

-- ============================================
-- 第八部分: 合伙人层级关系表（根据实体定义添加）
-- ============================================
CREATE TABLE IF NOT EXISTS `op_biz_partner_hierarchy` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `parent_partner_id` BIGINT NOT NULL COMMENT '父合伙人ID',
  `child_partner_id` BIGINT NOT NULL COMMENT '子合伙人ID',
  `level` TINYINT NOT NULL COMMENT '层级',
  `source_channel_id` BIGINT NULL COMMENT '来源渠道ID',
  `bind_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '绑定时间',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否激活',
  PRIMARY KEY (`id`),
  KEY `idx_parent_level` (`parent_partner_id`, `level`),
  KEY `idx_child_level_active` (`child_partner_id`, `level`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='合伙人层级关系表';

-- ============================================
-- 第九部分: 合伙人渠道表（根据实体定义添加）
-- ============================================
CREATE TABLE IF NOT EXISTS `op_biz_partner_channel` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `partner_id` BIGINT NOT NULL COMMENT '合伙人ID',
  `channel_code` VARCHAR(32) NOT NULL COMMENT '渠道代码',
  `name` VARCHAR(64) NOT NULL COMMENT '渠道名称',
  `short_url` VARCHAR(255) NULL COMMENT '短链接',
  `status` ENUM('active', 'disabled') NOT NULL DEFAULT 'active' COMMENT '状态',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_partner_channel` (`partner_id`, `channel_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='合伙人渠道表';

-- ============================================
-- 第十部分: 客户端用户外部账号表（根据实体定义添加）
-- ============================================
CREATE TABLE IF NOT EXISTS `op_biz_client_user_external_account` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `platform` VARCHAR(50) NOT NULL COMMENT '平台',
  `external_user_id` VARCHAR(255) NOT NULL COMMENT '外部用户ID',
  `external_username` VARCHAR(100) NULL COMMENT '外部用户名',
  `external_email` VARCHAR(100) NULL COMMENT '外部邮箱',
  `external_avatar` VARCHAR(500) NULL COMMENT '外部头像',
  `bind_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '绑定时间',
  `last_sync_time` TIMESTAMP NULL COMMENT '最后同步时间',
  `is_primary` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否主账号',
  `extra_data` JSON NULL COMMENT '扩展数据',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_platform` (`user_id`, `platform`),
  UNIQUE KEY `idx_platform_external` (`platform`, `external_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客户端用户外部账号表';

-- ============================================
-- 完成标记
-- ============================================
-- 种子数据初始化完成
-- 执行时间: 2025-12-08
-- 更新时间: 2025-01-03
-- 说明: 已根据 TypeORM 实体定义修正字段类型，并添加缺失的表结构

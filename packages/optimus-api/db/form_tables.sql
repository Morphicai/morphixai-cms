-- 动态表单两张表。回滚：
--   DROP TABLE op_sys_form_entry; DROP TABLE op_sys_form_schema;
--   DELETE FROM op_sys_role_menu WHERE permission_code='FormManagement';

CREATE TABLE IF NOT EXISTS `op_sys_form_schema` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL COMMENT '表单名称',
    `slug` VARCHAR(64) NOT NULL COMMENT '公开填报地址标识,唯一',
    `schema_json` JSON NOT NULL COMMENT '表单结构定义,协议见 form 模块 schema-validator',
    `enabled` TINYINT NOT NULL DEFAULT 0 COMMENT '0停用 1启用;停用后公开接口一律404',
    `schema_version` INT NOT NULL DEFAULT 1 COMMENT '每次修改schema递增,数据行冻结此版本',
    `create_date` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `update_date` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='动态表单定义';

CREATE TABLE IF NOT EXISTS `op_sys_form_entry` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `form_id` BIGINT NOT NULL,
    `schema_version` INT NOT NULL COMMENT '提交时刻的定义版本,历史数据按此解释',
    `data_json` JSON NOT NULL COMMENT '提交数据,key对应schema字段key',
    `source_ip` VARCHAR(64) DEFAULT NULL,
    `create_date` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    KEY `idx_form_id` (`form_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='动态表单提交数据';

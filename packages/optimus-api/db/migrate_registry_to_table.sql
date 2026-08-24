-- 一次性迁移:服务目录从字典集合行迁入专表 op_sys_service_registry(2026-08-24)。
-- 动机见 service_ops_tables.sql 表注释。先执行 service_ops_tables.sql 建表,
-- 再执行本文件:把字典里的存量条目搬过去(INSERT IGNORE,已 seed 的 key 跳过),
-- 然后清掉字典侧的行与集合定义。新环境不需要本文件。
BEGIN;

INSERT IGNORE INTO `op_sys_service_registry`
  (`key`, `name`, `base_url`, `health_path`, `metrics_path`, `tools_path`, `enabled`, `entry_type`, `embed_url`, `menu_title`, `menu_icon`, `perm_code`, `path_prefix`, `sort_order`)
SELECT
  d.`key`,
  JSON_UNQUOTE(JSON_EXTRACT(d.`value`, '$.name')),
  JSON_UNQUOTE(JSON_EXTRACT(d.`value`, '$.baseUrl')),
  JSON_UNQUOTE(JSON_EXTRACT(d.`value`, '$.healthPath')),
  JSON_UNQUOTE(JSON_EXTRACT(d.`value`, '$.metricsPath')),
  JSON_UNQUOTE(JSON_EXTRACT(d.`value`, '$.toolsPath')),
  IF(JSON_UNQUOTE(JSON_EXTRACT(d.`value`, '$.enabled')) = 'false', 0, 1),
  IFNULL(JSON_UNQUOTE(JSON_EXTRACT(d.`value`, '$.entryType')), 'none'),
  JSON_UNQUOTE(JSON_EXTRACT(d.`value`, '$.embedUrl')),
  JSON_UNQUOTE(JSON_EXTRACT(d.`value`, '$.menuTitle')),
  JSON_UNQUOTE(JSON_EXTRACT(d.`value`, '$.menuIcon')),
  JSON_UNQUOTE(JSON_EXTRACT(d.`value`, '$.permCode')),
  JSON_UNQUOTE(JSON_EXTRACT(d.`value`, '$.pathPrefix')),
  d.`sort_order`
FROM `op_sys_dictionary` d
WHERE d.`collection` = 'services-registry';

DELETE FROM `op_sys_dictionary` WHERE `collection` = 'services-registry';
DELETE FROM `op_sys_dictionary_collection` WHERE `name` = 'services-registry';

COMMIT;

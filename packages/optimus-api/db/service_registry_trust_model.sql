-- op_sys_service_registry 补列:trust_level + grants(服务信任模型)
--
-- service_ops_tables.sql 用 CREATE TABLE IF NOT EXISTS 建表,已存在的 dev 库不会因为
-- 改了那份脚本而补出新列,需要单独 ALTER。已在该脚本里同步加了这两列,供全新环境一步到位
-- 执行方式(dev): docker exec -i morphixai-cms-db-1 mysql -uroot -p*** optimus --default-character-set=utf8mb4 < 本文件
-- 本库 MySQL 版本不支持 ADD COLUMN IF NOT EXISTS 语法,重复执行前先自行确认列是否已存在
--
-- trust_level 默认 first-party:存量条目全部是内部服务,这个默认值对它们是正确的。
-- 新登记的三方服务必须显式设为 third-party,其 grants 默认为空,每项能力都要显式授予。
ALTER TABLE `op_sys_service_registry`
  ADD COLUMN `trust_level` varchar(20) NOT NULL DEFAULT 'first-party'
    COMMENT '代码提供方可信程度:first-party/second-party/third-party。非业务重要性分级' AFTER `api_path_prefixes`,
  ADD COLUMN `grants` json DEFAULT NULL
    COMMENT '该服务被授予的平台能力(服务的权限码,与用户权限码体系独立)' AFTER `trust_level`;

-- 存量条目补上一方服务的默认授权集。
-- 这里写死字面量而不是引用应用层常量:SQL 跑在应用之外,两边不一致时以
-- service-trust.constants.ts 的 DEFAULT_GRANTS_BY_TRUST_LEVEL 为准。
UPDATE `op_sys_service_registry`
SET `grants` = JSON_ARRAY(
  'user-profile:read-basic',
  'user-profile:read-full',
  'points:grant',
  'oss:upload',
  'shortlink:create'
)
WHERE `grants` IS NULL AND `trust_level` = 'first-party';

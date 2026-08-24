-- op_sys_service_registry 补列:api_path_prefixes(C 端 API 代理路由前缀)
-- service_ops_tables.sql 用 CREATE TABLE IF NOT EXISTS 建表,已存在的 dev 库不会因为
-- 改了那份脚本而补出新列,需要单独 ALTER。已在该脚本里同步加了这列,供全新环境一步到位
-- 执行方式(dev): docker exec -i morphixai-cms-db-1 mysql -uroot -p*** optimus --default-character-set=utf8mb4 < 本文件
-- 本库 MySQL 版本不支持 ADD COLUMN IF NOT EXISTS 语法,重复执行前先自行确认列是否已存在
ALTER TABLE `op_sys_service_registry`
  ADD COLUMN `api_path_prefixes` json DEFAULT NULL COMMENT 'C 端 API 代理路由前缀(可多个),唯一性应用层校验' AFTER `path_prefix`;

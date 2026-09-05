-- op_sys_service_registry 补列:parent_key(embed 菜单分组)
--
-- 同 service_registry_trust_model.sql 的道理:service_ops_tables.sql 用
-- CREATE TABLE IF NOT EXISTS 建表,已存在的 dev 库不会因为改了那份脚本而补出新列。
-- 执行方式(dev): docker exec -i morphixai-cms-db-1 mysql -uroot -p*** optimus --default-character-set=utf8mb4 < 本文件
-- 本库 MySQL 版本不支持 ADD COLUMN IF NOT EXISTS,重复执行前先确认列是否已存在
--
-- 默认 NULL = 顶层菜单,存量条目行为完全不变——这次改动不需要动任何一行数据。
-- 不加外键约束:服务目录是治理级小表,父子有效性由应用层 upsert/remove 校验
-- (要报出"被谁占用/谁是子节点"这类具体信息,外键的报错帮不上忙);
-- 加了反而会让直接改库的运维动作(如临时下线一条)撞在约束上。
ALTER TABLE `op_sys_service_registry`
  ADD COLUMN `parent_key` varchar(50) DEFAULT NULL
    COMMENT '归组到哪条记录之下(指向另一行的 key)。空=顶层;只支持两层' AFTER `grants`;

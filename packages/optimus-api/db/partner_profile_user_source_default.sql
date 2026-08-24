-- op_biz_partner_profile.user_source 默认值改回 internal
-- 2026-08-24:加入合伙人计划的鉴权从外部签名(ClientUserAuthGuard,UserSource.WEMADE)
-- 换成了走自己的 client-user cookie 会话——不再有真实的外部 WeMade 调用方,
-- 默认值继续是 wemade 会让新写入的每一行都带着一个不对的来源标签。
-- 执行方式(dev): docker exec -i morphixai-cms-db-1 mysql -uroot -p*** optimus --default-character-set=utf8mb4 < 本文件
ALTER TABLE `op_biz_partner_profile`
  MODIFY COLUMN `user_source` varchar(50) NOT NULL DEFAULT 'internal' COMMENT '用户来源';

-- zone-activity 的演示业务数据:活动页(运营可配)+ 报名(C 端登录用户写入)。
-- 文案与人物全部虚构,仅用于演示。
-- 执行: docker exec -i morphixai-cms-db-1 mysql -uroot -p*** optimus --default-character-set=utf8mb4 < 本文件

BEGIN;
-- 活动页配置:public_read,运营在管理端"数据集合"页改文案,C 端 zone SSR 实时生效
INSERT IGNORE INTO `op_sys_dictionary_collection` (`name`, `display_name`, `description`, `data_type`, `schema`, `access_type`) VALUES
('activity-pages', '活动页配置', 'C端活动 zone 的页面内容,运营可配', 'object',
 '{"title":"活动页","fields":[{"key":"title","label":"活动标题","type":"text","required":true},{"key":"subtitle","label":"副标题","type":"textarea"},{"key":"period","label":"活动时间","type":"text"},{"key":"status","label":"状态","type":"select","options":[{"label":"进行中","value":"open"},{"label":"已结束","value":"closed"}]},{"key":"rules","label":"活动规则(每行一条)","type":"textarea"}]}',
 'public_read');

-- 报名表:public_write(schema 校验字段),key=活动-用户 → collection+key 唯一即一人一报
INSERT IGNORE INTO `op_sys_dictionary_collection` (`name`, `display_name`, `description`, `data_type`, `schema`, `access_type`, `max_items`) VALUES
('activity-signups', '活动报名', 'C端活动报名记录,zone 服务端校验身份后写入', 'object',
 '{"title":"活动报名","fields":[{"key":"activityId","label":"活动标识","type":"text","required":true},{"key":"userId","label":"用户ID","type":"text","required":true},{"key":"nickname","label":"昵称","type":"text","required":true}]}',
 'public_write', 5000);

INSERT INTO `op_sys_dictionary` (`collection`, `key`, `value`, `sort_order`, `remark`)
SELECT * FROM (SELECT 'activity-pages' c, 'star-sea-2026' k,
  '{"title": "星海创作月", "subtitle": "用一个月,把你脑子里的那个小宇宙做出来——作品形式不限,截稿前提交即可参与展示。", "period": "2026-09-01 ~ 2026-09-30", "status": "open", "rules": "面向所有注册用户,免费参与\\n每人限提交一件作品,主题不限\\n报名后可随时在活动页查看参与名单\\n入选作品将在首页展示一个月\\n本活动为演示用途,内容均为虚构"}' v,
  0 s, '演示活动,文案虚构' r) t
WHERE NOT EXISTS (SELECT 1 FROM `op_sys_dictionary` WHERE collection='activity-pages' AND `key`='star-sea-2026');
COMMIT;

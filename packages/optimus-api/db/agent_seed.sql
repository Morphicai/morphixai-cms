-- agent-foundation 迭代 seed(无新表——工具注册表复用数据集合,轨迹在 agent-service 本地 jsonl)
-- 执行注意:docker exec 进 mysql 必须带 --default-character-set=utf8mb4,否则中文双重编码

-- 权限码:智能助理控制台
INSERT IGNORE INTO `op_sys_role_menu` (`id`, `role_id`, `permission_code`) VALUES (66, 1, 'AgentConsole'), (67, 2, 'AgentConsole');

-- 工具注册表集合(private:工具定义是敏感配置,只在管理端可见可编辑)
INSERT IGNORE INTO `op_sys_dictionary_collection` (`id`, `name`, `display_name`, `description`, `data_type`, `schema`, `access_type`) VALUES
(5, 'agent-tools', '智能体工具注册表', 'agent-service 的声明式工具定义:加一行=注册一个工具,基座零代码变更', 'object', NULL, 'private');

-- 第一批工具:多语言三件 + 数据集合读取(path 只允许相对路径,base 钉死在平台 API)
INSERT IGNORE INTO `op_sys_dictionary` (`collection`, `key`, `value`, `sort_order`) VALUES
('agent-tools', 'i18n_list_namespaces', JSON_OBJECT(
  'name', 'i18n_list_namespaces',
  'description', '列出全部多语言命名空间及各自的键数量。不需要参数。',
  'params', JSON_ARRAY(),
  'method', 'GET',
  'path', '/system/i18n/namespaces'
), 0),
('agent-tools', 'i18n_list_missing', JSON_OBJECT(
  'name', 'i18n_list_missing',
  'description', '列出某命名空间在指定语言下缺少译文的键,返回每个键的 zh-CN 源文与备注。翻译任务先用它了解要翻什么。',
  'params', JSON_ARRAY(
    JSON_OBJECT('key', 'namespace', 'type', 'string', 'required', true, 'description', '命名空间,如 portal'),
    JSON_OBJECT('key', 'locale', 'type', 'string', 'required', true, 'description', '目标语言代码,如 fr-FR')
  ),
  'method', 'GET',
  'path', '/system/i18n/missing?namespace={namespace}&locale={locale}'
), 10),
('agent-tools', 'i18n_write_translation', JSON_OBJECT(
  'name', 'i18n_write_translation',
  'description', '为一个键写入指定语言的译文。只能补缺失——键在该语言已有译文时会被拒绝。一次写一条。',
  'params', JSON_ARRAY(
    JSON_OBJECT('key', 'namespace', 'type', 'string', 'required', true, 'description', '命名空间'),
    JSON_OBJECT('key', 'key', 'type', 'string', 'required', true, 'description', '文案键,如 hero.title'),
    JSON_OBJECT('key', 'locale', 'type', 'string', 'required', true, 'description', '目标语言代码'),
    JSON_OBJECT('key', 'text', 'type', 'string', 'required', true, 'description', '译文文本')
  ),
  'method', 'PUT',
  'path', '/system/i18n/translation'
), 20),
('agent-tools', 'collection_list', JSON_OBJECT(
  'name', 'collection_list',
  'description', '读取一个公开数据集合的全部行(如 site-features 官网卡片、demo-activity-config 活动配置)。',
  'params', JSON_ARRAY(
    JSON_OBJECT('key', 'collection', 'type', 'string', 'required', true, 'description', '集合名,如 site-features')
  ),
  'method', 'GET',
  'path', '/api/dictionary/{collection}'
), 30);

-- agent 相关 seed:只有权限码。
-- 工具不在数据库里——它们是业务模块代码里的注册声明(见 *.agent-tools.ts),
-- 经 GET /system/agent/tools 暴露;轨迹在 agent-service 本地 jsonl

-- 权限码:智能助理控制台
INSERT IGNORE INTO `op_sys_role_menu` (`id`, `role_id`, `permission_code`) VALUES (66, 1, 'AgentConsole'), (67, 2, 'AgentConsole');


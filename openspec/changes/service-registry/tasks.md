# Tasks: service-registry

## 1. api — 目录接入面

- [ ] 1.1 services-registry 集合 schema 升级(entryType/embedUrl/menuTitle/menuIcon/permCode/toolsPath),seed SQL 更新 + dev 库执行
- [ ] 1.2 /system/services CRUD(门 ServiceOps):读写集合行,baseUrl/embedUrl 校验(仅 http(s)、禁用户信息段),变更发 service.registered/updated/removed 事件(操作人从 token 记)
- [ ] 1.3 GET /system/agent/tool-providers(门 AgentConsole):只返回 enabled 且有 toolsPath 的 {key,baseUrl,toolsPath},最小披露
- [ ] 1.4 单测:CRUD 校验与事件、tool-providers 过滤

## 2. agent-service — 工具发现收敛

- [ ] 2.1 loadToolDefs 改为先调 /system/agent/tool-providers(发起人 token),失败回退 TOOL_PROVIDER_URLS env;验证登记 toolsPath 后不重启即出现工具

## 3. 管理端 — 登记与动态入口

- [ ] 3.1 服务状态页内目录 CRUD(登记表单:permCode 存在性检测提示、embedUrl 二次确认)
- [ ] 3.2 /embed/:serviceKey 通用嵌入页:读目录取 embedUrl,权限校验(无 permCode 拦截),包 IframeApp 握手
- [ ] 3.3 动态菜单注入:目录 entryType=embed 条目生成菜单项(照抄动态文档菜单模式),按 permCode 过滤
- [ ] 3.4 demo-activity 迁移:目录登记(含 DemoActivity permCode) → 验证等价 → 下线 routes.js 静态节点与 IframeApp 静态工厂用法

## 4. 验收(对应 proposal 六条)

- [ ] 4.1 零代码登记新服务:菜单/探测/权限过滤全生效
- [ ] 4.2 demo-activity 动态化后功能等价(登录态/权限穿透/集合读写)
- [ ] 4.3 登记 toolsPath 后智能助理立现其工具(不重启)
- [ ] 4.4 目录变更事件入流含操作人
- [ ] 4.5 无 ServiceOps 者 403;无 permCode 者菜单不可见、直达被拦
- [ ] 4.6 单测 + 构建过

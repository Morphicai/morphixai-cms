# Tasks: service-registry

## 1. api — 目录接入面

- [x] 1.1 services-registry 集合 schema 升级(entryType/embedUrl/menuTitle/menuIcon/permCode/toolsPath),seed SQL 更新 + dev 库执行。附带修复:seed 行插入改 NOT EXISTS 守护(uk 含 user_id,NULL 不判重,INSERT IGNORE 不幂等);集合定义不再硬编码 id(会被环境后建集合占用);baseUrl 语义定为"API 根,可含路径前缀",探测拼接改字符串(new URL 绝对路径会吃掉 base 前缀)
- [x] 1.2 /system/services CRUD(门 ServiceOps):URL 校验(仅 http(s)、禁用户信息段)+ 字段联动(embed 必填 embedUrl)+ slug/permCode 格式;变更发 service.registered/updated/removed(操作人从 token 记,事件旁路失败不影响登记)
- [x] 1.3 GET /system/services/tool-providers(门 AgentConsole)最小披露;GET /system/services/entries(AllowNoPerm 登录即可,动态菜单/嵌入页数据源)
- [x] 1.4 单测 8 个:URL/联动/slug 校验、注册与更新事件、事件旁路、404、两个消费视图过滤(连同 service-ops 原 5 个共 13 个全过)

## 2. agent-service — 工具发现收敛

- [x] 2.1 resolveProviders:目录优先(tool-providers,发起人 token),失败/为空回退 TOOL_PROVIDER_URLS env;ToolDef 增加 base(每个 provider 的工具打自己的 API 根,不再钉死 optimus-api)。实测:改目录 toolsPath 指向不存在路径,agent /tools 立即 502(证明走目录);改回立即恢复四工具——全程未重启

## 3. 管理端 — 登记与动态入口

- [x] 3.1 服务状态页"服务登记(目录)"表格 + 登记/编辑 Modal(embedUrl 新增/变更二次确认,提示 token 下发 origin;permCode 用文案说明代替存在性检测——为一条提示建接口不值)
- [x] 3.2 /embed/:serviceKey 通用宿主页:读 entries 取条目,页内校验 permCode(菜单过滤挡不住直敲 URL),EmbedFrame 渲染
- [x] 3.3 IframeApp 重构:EmbedFrame 参数化组件 + createIframeApp 工厂薄壳(静态接入兼容形态);getDynamicServiceMenus 注入 getFullMenuConfig(照抄动态文档菜单模式),code=permCode 走 getMenuTree 既有过滤
- [x] 3.4 demo-activity 迁移:目录登记(embed+DemoActivity 码)→ 浏览器验证等价 → routes.js 静态节点与工厂用法下线;登记行入 seed(零代码接入的最终形态)

## 4. 验收

- [x] 4.1 零代码登记:菜单出现"演示活动"(无新旧重复)、/embed/demo-activity 握手成功(introspect 返回 user+perms、集合读写通)、探测卡片绿(19ms)
- [x] 4.2 demo-activity 动态化后功能等价(浏览器实测 5 项全过)
- [x] 4.3 toolsPath 改动不重启即生效(502→恢复实测);真实 run 无回归(1 调用 4.8s 答对)
- [x] 4.4 service.registered 事件入流,含操作人 admin 与 payload
- [x] 4.5 无 token 调目录接口 401;负例(file://、embed 缺 embedUrl)400;菜单按 permCode 过滤走 getMenuTree 既有机制(动态文档菜单同款)+ 单测覆盖(未造"无码普通账号"实测,dev 库只有超管)
- [x] 4.6 单测:本迭代相关套件全过(service-ops 13/auth/i18n/form/guards);全量中 19 个失败全在 partner/points-engine/public-article 存量套件(其类型错误在本迭代前的全量 tsc 已存在,未触碰);UI 构建过

## 5. 追加:目录迁专表(2026-08-24)

- [x] 5.1 存储从字典集合行迁到专表 op_sys_service_registry(字段列化,key/path_prefix DB 唯一索引兜底)。
  动机:字典是通用业务数据的地盘,持 DataCollections 权限者在数据集合页一个删除就能端掉整个目录——
  基础设施数据必须物理隔离,专表只有 ServiceOps 门后的接口能写
- [x] 5.2 probe 改经 ServiceRegistryService 读目录(不再直连存储);消费视图/controller/前端/agent/proxy 零改动
- [x] 5.3 迁移脚本 db/migrate_registry_to_table.sql(存量搬迁+清理字典侧);seed 文件改为专表版本
- [x] 5.4 验收:6 服务迁移无损;探测全绿;zone-routes/embed entries/agent 工具发现(4 工具)/zone 经 proxy 全通;
  数据集合页不再出现服务目录;api 152 测全绿

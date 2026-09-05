## Why

服务目录（`op_sys_service_registry`）是纯平铺表，`key` 唯一索引把"一条记录 = 一个
embed 入口 = 一个菜单项"焊死在数据层。partner-service 现在把"合伙人管理"和
"外部任务审核"这两个逻辑上独立的功能合并成一个 embed 入口，在自己的 iframe 内用
antd Tabs 做"伪子菜单"——`admin-app/src/App.jsx` 的注释直接写明原因：拆两个 embed
条目"只会让菜单多一条却没有实际隔离意义"。这是当前数据模型缺少分组能力导致的
妥协，不是产品设计的选择。前端渲染层（`getMenuTree`/`ConstantSiderMenus.jsx`）
早就支持任意层级 `children`（静态菜单已有 3 层嵌套先例），这部分不用改，
真正缺的只是服务目录能不能表达"一个团队多个子菜单"。

## What Changes

- `ServiceRegistryEntity`/`ServiceEntry` 新增分组字段（如 `parentKey`，自引用
  同一张表），允许一个逻辑服务登记多条 embed 记录并归到同一父节点
- `listEmbedEntries()` 按分组聚合成树形结构，而不是继续输出平铺数组
- `optimus-ui` 的 `getDynamicServiceMenus()` 把树形数据映射成带 `children` 的
  菜单节点（渲染层复用现有机制，不需要改动 `ConstantSiderMenus.jsx`）
- 每个子菜单仍是一条独立记录 = 独立的 `/embed/:key` 路由 = 独立的 iframe 会话，
  复用现有 `EmbedFrame` 握手协议，不扩展协议本身

**BREAKING**：无。现有单条记录、无 `parentKey` 的服务目录条目行为不变
（视为没有子菜单的顶层菜单项）。

## Capabilities

### New Capabilities

- `embed-menu-grouping`：服务目录条目按逻辑分组、渲染为多级菜单的能力

### Modified Capabilities

（无——`openspec/specs/` 尚无已归档的 `service-registry` 规范文件，`listEmbedEntries()`
的行为变化随 `embed-menu-grouping` 一并作为新能力描述，对未使用分组的现有条目
保持向后兼容）

## Impact

- `optimus-api`：`service-registry.entity.ts`、`service-registry.service.ts`
  （`listEmbedEntries`、`upsert` 的父子校验）
- `optimus-ui`：`routes.js` 的 `getDynamicServiceMenus()`
- `partner-service`：可选地把现有的 Tabs 伪子菜单拆成两条独立记录 + 两个可通过
  URL 直达的视图（不在本次强制要求范围，示范用途）

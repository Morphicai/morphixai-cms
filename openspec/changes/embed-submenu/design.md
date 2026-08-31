## Context

`op_sys_service_registry` 的 `key` 有唯一索引，`listEmbedEntries()` 输出
`{key, menuTitle, menuIcon, permCode, embedUrl}[]` 平铺数组，`getDynamicServiceMenus()`
原样映射成 `parentId: null` 的顶层菜单项。渲染层（`getMenuTree`/
`ConstantSiderMenus.jsx`）已经支持任意层级 `children`——3 层嵌套的静态菜单
（内容管理 → 文档管理 → 文档编辑）已经在验证这套机制，这次只需要让动态数据也
产出同样的形状。

## Goals / Non-Goals

**Goals:**
- 一个逻辑服务（一个团队）能注册多条 embed 记录，在侧边栏呈现为一个父菜单下的
  多个子菜单
- 不改动 `EmbedFrame` 握手协议、不改动 `ConstantSiderMenus.jsx` 的渲染逻辑
- 现有单条、无分组的服务目录条目行为完全不受影响

**Non-Goals:**
- 不做"同一个 iframe 内部路由跳转"的方案（这需要扩展握手协议、新增消息类型，
  是协议级别的改动，本次选择成本更低的"每个子菜单独立 iframe 会话"路线）
- 不强制迁移 partner-service 现有的 Tabs 伪子菜单，是否拆分由 partner-service
  自行决定
- 不支持超过两层的分组（父菜单 → 子菜单，不做子菜单下再分组），当前没有这个需求

## Decisions

**用自引用的 `parentKey` 字段做分组，不是新建一张"分组表"**：和 `apiPathPrefixes`
数组存 JSON 列的先例不同，这里的分组关系是"多条记录归同一个父"，用外键式的
`parentKey`（指向另一条记录的 `key`）比建一张独立的分组表更符合数据本身的形态，
且改动范围更小——只加一个可空字段。

**子菜单方案选"独立记录 + 独立 iframe 会话"，不选"同一 iframe 内部路由"**：
后者需要扩展 `EmbedFrame` 握手协议（新增 `postMessage` 消息类型、子应用侧监听
路由指令），是目前协议完全没覆盖的新交互，改动量和风险明显更大。前者只是
"注册两条记录、各自一个 `/embed/:key` 路由"，复用现有握手协议不用改一行，
成本低得多。partner-service 要落地这个方案，需要把现在合在一起的一个 SPA
拆成两个可独立通过 URL 直达的视图（用 URL 查询参数区分初始 tab，而不是必须
拆成两个完全独立的应用），但这是 partner-service 自己的实现选择，不是本次
协议改动的一部分。

**父节点本身可以没有 `embedUrl`（纯分组节点）**：如果一个团队想要"父菜单本身
不可点击，只是子菜单的容器"，允许 `parentKey` 指向一条 `entryType` 不是
`embed`（或 `embedUrl` 为空）的纯分组记录。这和现状"静态菜单里有纯分组的父
菜单项"（点击不跳转，只展开子项）的形态一致。

## Risks / Trade-offs

**[风险] `parentKey` 自引用可能产生循环引用（A 的父是 B，B 的父又是 A）**
→ 缓解：`upsert()` 新增校验，写入时检查 `parentKey` 链路是否会形成环，
参照 partner-service 迁移中 `checkCircularReference` 的思路（虽然那是应用层
的图关系，这里是配置数据，检查逻辑更简单：链路深度超过 2 层或出现重复 key
即拒绝）

**[风险] 删除一个父节点时，子节点如何处理**
→ 缓解：删除父节点前，`remove()` 校验是否存在 `parentKey` 指向它的子节点，
存在则拒绝删除并提示先处理子节点（先移除分组关系或先删子节点），不做
"级联删除"这种容易误伤的默认行为

**[风险] 现有的 `demo-activity`、`partner-service` 条目在改动后如果被误加了
`parentKey` 可能意外从顶层菜单消失**
→ 缓解：`parentKey` 默认为空，迁移脚本不需要改动任何现有记录；只有显式设置
`parentKey` 才会归入分组，不做任何自动推断/合并

## Migration Plan

1. `ServiceRegistryEntity` 新增可空的 `parentKey` 字段（无需数据迁移，默认 null）
2. `listEmbedEntries()` 按 `parentKey` 聚合成树，无 `parentKey` 的条目保持顶层输出
   （向后兼容）
3. `getDynamicServiceMenus()` 更新映射逻辑，产出带 `children` 的菜单节点
4. 现有条目不受影响，是否给 partner-service 拆子菜单是后续可选的示范任务
5. 回滚：字段可空且默认不使用，回滚只需恢复 `listEmbedEntries()` 到平铺输出即可

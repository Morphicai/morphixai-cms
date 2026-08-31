## 1. 数据模型

- [ ] 1.1 `ServiceRegistryEntity` 新增可空 `parentKey` 字段
- [ ] 1.2 `upsert()` 新增校验：`parentKey` 指向的记录必须存在；拒绝会形成循环
      引用的写入
- [ ] 1.3 `remove()` 新增校验：存在子节点（其它记录 `parentKey` 指向它）时拒绝删除

## 2. 消费视图

- [ ] 2.1 `listEmbedEntries()` 按 `parentKey` 聚合成树形结构，无分组的条目保持
      顶层输出（向后兼容）
- [ ] 2.2 单测覆盖：无分组条目、单层分组、循环引用拒绝、删父节点拒绝 四个场景

## 3. 前端渲染

- [ ] 3.1 `optimus-ui` 的 `getDynamicServiceMenus()` 更新映射逻辑，产出带
      `children` 的菜单节点数组
- [ ] 3.2 浏览器验证：现有静态菜单的多级嵌套（`getMenuTree`/
      `ConstantSiderMenus.jsx`）不需要改动，直接渲染新的树形动态菜单数据

## 4. 示范与验收

- [ ] 4.1 （可选）以 partner-service 为例，登记一个父记录 + 两个子记录
      （合伙人管理 / 外部任务审核），验证子菜单在真实侧边栏正确展开、点击后
      各自加载独立的 embed 页面
- [ ] 4.2 全量单测跑绿，提交、合 main

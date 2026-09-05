## 1. 数据模型

- [x] 1.1 `ServiceRegistryEntity` 新增可空 `parentKey`（列 `parent_key`）+
      迁移脚本 `db/service_registry_parent_key.sql`，并同步 `db/service_ops_tables.sql`
      （建表脚本是 `CREATE TABLE IF NOT EXISTS`，已存在的库不会因为改它而补列，
      两份都要动才能让"全新环境"和"存量环境"结果一致）
      > **不加外键约束**：服务目录是治理级小表，父子有效性由应用层校验——要报出
      > "谁是子节点"这类具体信息，外键的报错帮不上忙；加了反而会让直接改库的
      > 运维动作（临时下线一条）撞在约束上
- [x] 1.2 `upsert()` 新增 `assertGroupingValid()`：parentKey 必须存在、不能指向自己、
      **父必须是顶层记录**、自己已有子节点时不能再认父
      > 因为菜单**两层封顶**，"父必须是顶层"这一条规则就同时挡住了三种坏数据：
      > 自引用、A↔B 的环、三层嵌套。**不需要真去遍历链路找环**——design.md 里
      > 设想的 `checkCircularReference` 式实现在这个约束下是多余的
- [x] 1.3 `remove()` 新增校验：存在子节点时拒绝删除，并**报出子节点的 key**
      > 不做级联删除：删一条父记录静默带走几条子记录，误伤起来不可撤销。
      > 报出 key 让操作者自己决定是先解组还是先删子

## 2. 消费视图

- [x] 2.1 `listEmbedEntries()` 返回树（`EmbedMenuNode[]`），无分组条目保持顶层且
      **不带 `children` 字段**（形状与改动前逐字一致）。另加静态方法
      `findEmbedNode(tree, key)` 供按 key 递归查找
      > 三条行为在实现里有注释，都是"两种失败里选轻的那个"：
      > ① 父节点可以不是 embed 条目（纯分组，点击只展开）
      > ② **父被禁用时子节点提升到顶层**，而不是一起消失——让一条 enabled 的记录
      >    静默不可达是更糟的失败，会以为服务坏了；要隐藏子项就各自 disable。
      >    同一条规则顺带兜住"parentKey 指向不存在的记录"（直接改库能造出这种数据）
      > ③ 顺序沿用 `rows()` 的 sortOrder/id，子节点在父内保持同样相对顺序
      > 实现时踩了一个自己造的 bug：父不可见的子节点先被当顶层加入，又在挂载循环里
      > 被 push 了一次，同一条出现两遍。单测（"父被禁用时提升到顶层"）当场抓到——
      > 已把"是否归组"抽成一个判定 `isGrouped()`，两个循环共用同一个判据
- [x] 2.2 单测 17 例（原 2 例 → 19 例）：无分组向后兼容、单层分组、纯分组父节点、
      空组不出现、父禁用提升、孤儿提升、子项禁用只它消失、findEmbedNode 递归，
      以及 5 条父子校验 + 2 条删除校验
      > 顺手修了测试桩的一处失真：`mkRepo` 的 `find` 原先**忽略 `where`** 直接返回
      > 全表，"查子节点"这类调用在测试里永远拿到全部行。改成按 where 过滤后，
      > 两处 ad-hoc 的 `repo.find` 覆盖也一并删掉了

## 3. 前端渲染

- [x] 3.1 `getDynamicServiceMenus()` 递归映射成带 `children` 的菜单节点；
      **纯分组父节点不给 `path`**（给了就会点进一个没有页面的 `/embed/:key`）
- [x] 3.2 渲染层（`getMenuTree`/`ConstantSiderMenus.jsx`）确认**不需要改动**：
      `filterMenus` 本来就递归 `children`，末尾的 `menu.path || children.length > 0`
      正好让"子项全被挡掉的纯分组父节点"自己消失
      > 用 9 例前端单测跑**真实的** `getDynamicServiceMenus` + `getMenuTree`
      > （只桩掉两个 API 与 storage，入参形状取自真实库的输出）：映射、parentId、
      > 无 path、权限过滤（超管全见 / 只持一个子码时另一个被过滤且父仍在 /
      > 全被挡掉时父消失）
      > **浏览器目视确认已补做（2026-09-05，使用者本人登录确认）**：父节点点击只展开、
      > 两个子项各自进独立 `/embed/:key` 且都能加载出页面、两条存量条目位置不变。
      > 归档当时未做的原因是 admin 密码不在实施者手上。改动面已被单测覆盖到函数级，
      > 但"侧边栏看起来对不对"仍需人工点一下

## 4. 示范与验收

- [x] 4.1 真实库里登记了示范分组：父 `partner-group`（纯分组，无 embedUrl）+
      两个子 `partner-admin` / `partner-task`。用真实 TypeORM repo 跑
      `listEmbedEntries()`（不走 HTTP、不需要登录），确认：
      - `partner-service` / `demo-activity` 两条存量条目**逐字未变、无 children**
      - `partner-group` 带两个子节点、自身无 `embedUrl`
      - `findEmbedNode(tree, "partner-task")` 能取到嵌套那条
      五条父子校验也对真实库跑过，全部按预期拒绝，且**目录条数保持 10 未被写脏**：

      | # | 操作 | 结果 |
      |---|---|---|
      | ① | parentKey 指向不存在的记录 | 拒绝 |
      | ② | parentKey 指向自己 | 拒绝 |
      | ③ | 父自己已归组（=环/三层） | 拒绝 |
      | ④ | 自己已有子节点还想认父 | 拒绝 |
      | ⑤ | 删除仍有子节点的父记录 | 拒绝，并列出子节点 key |

      > 示范行**保留在 dev 库里**，方便登录后目视确认侧边栏。清理：
      > `DELETE FROM op_sys_service_registry WHERE key IN ('partner-group','partner-admin','partner-task');`
      > 注意子条目的 embedUrl 带了 `?view=partner` 这类参数，而 partner-service 的
      > admin-app **现在并不按 URL 参数选初始视图**——两个子菜单都会打开它的默认页。
      > 让它支持 URL 直达是 partner-service 自己的改造，design.md 明确划在范围外
- [x] 4.2 api 205/205（新增 17 例）、optimus-ui 9/9 新增、
      platform-client 34/34、server-sdk 13/13；`tsc --noEmit` 零错误；
      eslint 干净；提交、合 main
      > 也更新了 `optimus-ui/src/constants/README.md`：那份文档写着接口返回
      > "顶层菜单项"数组，改成树之后不改它，下一个人会照着平铺去 find

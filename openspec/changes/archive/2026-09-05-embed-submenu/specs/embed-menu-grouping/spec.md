## ADDED Requirements

### Requirement: 服务目录条目支持分组
服务目录（`op_sys_service_registry`）SHALL 允许一条记录通过 `parentKey` 字段
指向另一条记录，表示前者是后者的子菜单。

#### Scenario: 登记一个带子菜单的服务
- **WHEN** 团队为一个逻辑服务登记一条父记录（如 `key: "partner"`）和两条
  `parentKey` 指向该父记录的子记录（如 `key: "partner-admin"`、
  `key: "partner-external-task"`）
- **THEN** 服务目录成功保存这三条记录及其分组关系

### Requirement: 动态菜单渲染为多级结构
`listEmbedEntries()` SHALL 按 `parentKey` 聚合返回的数据，产出父节点带
`children` 数组的树形结构；管理后台的动态菜单生成逻辑 SHALL 将其映射为多级
侧边栏菜单。

#### Scenario: 侧边栏渲染子菜单
- **WHEN** 管理后台加载动态服务菜单，且服务目录中存在带 `parentKey` 分组的条目
- **THEN** 侧边栏在对应父菜单下展开显示子菜单项，用户可分别点击进入不同的
  embed 页面

### Requirement: 向后兼容无分组的现有条目
未设置 `parentKey` 的服务目录条目 SHALL 继续渲染为顶层菜单项，行为与本次改动
之前完全一致。

#### Scenario: 现有单条记录不受影响
- **WHEN** 一个服务目录条目的 `parentKey` 为空
- **THEN** 该条目在菜单树中作为顶层节点渲染，无 `children`

### Requirement: 禁止循环引用
服务目录 SHALL 拒绝会形成 `parentKey` 循环引用的写入请求。

#### Scenario: 写入会形成循环的分组关系
- **WHEN** 尝试将记录 A 的 `parentKey` 设为指向记录 B，而记录 B 的 `parentKey`
  已经指向记录 A
- **THEN** 系统拒绝该写入并返回错误

### Requirement: 删除父节点前必须处理子节点
服务目录 SHALL 拒绝删除仍被其它记录的 `parentKey` 引用的记录。

#### Scenario: 尝试删除仍有子节点的父记录
- **WHEN** 尝试删除一条记录，且存在其它记录的 `parentKey` 指向它
- **THEN** 系统拒绝删除并提示需要先处理子节点

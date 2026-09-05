## ADDED Requirements

### Requirement: 管理端数据集合模块
管理端 SHALL 提供「数据集合」页面（权限码 DataCollections）：集合的列表/新建/编辑（含 schema 的 JSON 编辑、SchemaFormRenderer 实时预览、智能生成）；单个集合的行数据表格 SHALL 按 schema.fields 生成列，支持新增/编辑/删除行，行编辑 SHALL 使用与 C 端填报同一个渲染器。

#### Scenario: 建集合到录数据全程无代码
- **WHEN** 管理员新建集合并定义 3 字段 schema，随后在数据表格新增一行
- **THEN** 表格按 schema 显示 3 列，行数据通过校验落库

#### Scenario: 无权限用户不可见
- **WHEN** 未授权 DataCollections 的角色登录
- **THEN** 菜单不显示该节点，直调管理接口返回 403

### Requirement: 官网 features 后台可配且优雅降级
首页 features 卡片 SHALL 从 public_read 集合 site-features 读取；接口失败或为空时 SHALL 渲染内置数据，页面不报错不空白。

#### Scenario: 后台改 feature 官网生效
- **WHEN** 修改 site-features 中某行的 title 并刷新首页
- **THEN** 对应卡片显示新标题

#### Scenario: 后端不可用时降级
- **WHEN** 后端停止时访问首页
- **THEN** features 区块显示内置数据，无报错

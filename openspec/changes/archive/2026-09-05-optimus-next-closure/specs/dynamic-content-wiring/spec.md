## ADDED Requirements

### Requirement: 动态内容后端接通
DynamicContentSDK SHALL 以公开字典模块为后端（集合 `dynamic-content`，accessType 为 public_read），公开字典读接口 SHALL 匿名可访问；写接口仍受集合 accessType 门禁约束。

#### Scenario: 匿名读取公开集合
- **WHEN** 未携带任何凭证 GET 字典公开接口读 dynamic-content 集合的 key
- **THEN** 返回 200 与该 key 的值

#### Scenario: 非公开集合仍被拒
- **WHEN** 匿名读取 accessType 为 private 的集合
- **THEN** 返回 403

### Requirement: 首页文案可配置且优雅降级
首页 Hero 的标题与副标题 SHALL 从 dynamic-content 集合读取（key: hero.title / hero.subtitle）；接口不可用或 key 不存在时 SHALL 渲染内置默认文案，页面不报错不空白。

#### Scenario: 后台改文案首页生效
- **WHEN** 修改字典中 hero.title 的值并刷新首页
- **THEN** 首页标题显示新值

#### Scenario: 后端不可用时降级
- **WHEN** 后端服务停止时访问首页
- **THEN** 标题显示默认文案，无报错空白

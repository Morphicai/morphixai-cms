## ADDED Requirements

### Requirement: 翻译管理菜单与权限
系统 SHALL 提供「翻译管理」菜单项，受权限码 `TranslationManagement` 控制显隐；对应页面路由 SHALL 同样以该权限码标注。

#### Scenario: 有权限可见
- **WHEN** 角色被授予 TranslationManagement 后其用户登录
- **THEN** 侧边菜单出现「翻译管理」，点击可进入工作台页面

#### Scenario: 无权限不可见且不可直达
- **WHEN** 未持有该权限码的用户登录并尝试直接访问翻译页面路由
- **THEN** 菜单不显示该项，直接访问被前端路由拒绝

### Requirement: 内嵌工作台
翻译管理页面 SHALL 以 iframe 内嵌 i18n-platform 的前端地址（地址可配置，默认 `http://localhost:5181`），CMS 不复制、不改写其任何代码。

#### Scenario: 工作台可完成真实业务
- **WHEN** 用户在内嵌页面中执行一次批量翻译
- **THEN** 操作与直接访问 i18n-platform 的结果一致（数据落在 i18n-platform 自己的存储）

#### Scenario: 目标服务未启动
- **WHEN** i18n-platform 进程未运行时打开该页面
- **THEN** 页面展示"翻译服务未启动"的提示与启动指引，而非空白 iframe

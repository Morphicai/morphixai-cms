## ADDED Requirements

### Requirement: 调试页生产隔离
demo/debug 类路由（/debug-login、/api-test、/api-examples、/business-demo、/auth-modal-demo、/design-system-demo、/components、/examples/*）SHALL 仅在开发环境可访问，生产构建下返回 404。

#### Scenario: 生产环境访问调试页
- **WHEN** 生产模式下访问 /debug-login
- **THEN** 返回 404

#### Scenario: 开发环境正常使用
- **WHEN** 开发模式下访问 /api-examples
- **THEN** 页面正常渲染

### Requirement: 无死链与死代码
站内导航 SHALL NOT 指向不存在的路由；无消费方的认证死代码（AuthContext/LoginForm/useAuth 链）与无后端支撑的 SDK 方法 SHALL 被移除。

#### Scenario: 生产构建通过
- **WHEN** 执行 next build
- **THEN** 构建成功，无对已删除模块的引用错误

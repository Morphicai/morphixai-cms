## ADDED Requirements

### Requirement: 路由级权限拦截
系统 SHALL 在后端守卫中校验标注了权限码的接口：请求用户的权限码集合中不包含该接口声明的权限码时，返回 403，不执行业务逻辑。

#### Scenario: 无权限用户被拒绝
- **WHEN** 一个权限码集合仅含 `Dashboard` 的用户请求标注了 `@Perm('ContentManagement')` 的接口
- **THEN** 后端返回 403，且业务处理器未被调用

#### Scenario: 有权限用户放行
- **WHEN** 权限码集合含 `ContentManagement` 的用户请求同一接口
- **THEN** 请求正常进入业务处理器

#### Scenario: 超级管理员豁免
- **WHEN** 用户类型为超级管理员（权限码集合为 `["*"]`）
- **THEN** 任何标注接口均放行，不做逐码比对

### Requirement: 权限声明方式
业务接口的权限需求 SHALL 通过控制器类或方法上的 `@Perm(<权限码>)` 装饰器声明；方法级声明优先于类级声明。未标注的接口维持既有行为（认证后放行）。

#### Scenario: 方法级覆盖类级
- **WHEN** 控制器类标注 `@Perm('A')`，其中某方法标注 `@Perm('B')`，用户仅持有 `B`
- **THEN** 该方法放行，同控制器其他方法返回 403

#### Scenario: 未标注接口不受影响
- **WHEN** 用户请求一个没有任何 @Perm 标注的既有接口
- **THEN** 行为与本变更之前一致（JWT 有效即放行）

### Requirement: 权限码同源
后端消费的权限码 SHALL 与前端菜单显隐使用同一份数据（`op_sys_role_menu.permission_code`），不引入第二套权限标识体系。

#### Scenario: 权限变更立即双端生效
- **WHEN** 管理员从某角色移除权限码 `ContentManagement`
- **THEN** 该角色用户的菜单不再显示对应入口，且直接调用对应接口返回 403

### Requirement: 拒绝可观测
权限拒绝 SHALL 记录日志，包含用户标识、请求路由、缺失的权限码，用于上线初期定位误配。

#### Scenario: 403 产生日志
- **WHEN** 任一请求因权限码不足被拒
- **THEN** 服务端日志出现一条含 userId、路由、所需权限码的 warn 记录

### Requirement: 路由前缀严格匹配
系统 SHALL 拒绝带重复全局前缀的请求路径（如 `/api/api/...`），不再宽容改写。

#### Scenario: 双前缀请求被拒
- **WHEN** 客户端请求 `/api/api/role/list`
- **THEN** 返回 404，而非等价于 `/api/role/list` 的成功响应

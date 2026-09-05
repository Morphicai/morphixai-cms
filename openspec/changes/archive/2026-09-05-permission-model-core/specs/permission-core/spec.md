## ADDED Requirements

### Requirement: 三段式权限码的解析与校验
`@optimus/permission` SHALL 提供权限码的解析与格式校验，码的形态为
`namespace:resource:action`，三段均为小写 slug。

#### Scenario: 解析合法的三段码
- **WHEN** 传入 `partner:campaign:write`
- **THEN** 返回 `{ namespace: "partner", resource: "campaign", action: "write" }`

#### Scenario: 拒绝非法格式
- **WHEN** 传入段数不是 3 的字符串、含大写字母、含非法字符，或任一段为空
- **THEN** 校验失败，且失败结果能指出是哪一段不合法

#### Scenario: 通配符在合法位置被接受
- **WHEN** 传入 `partner:campaign:*`、`partner:*`、`*`
- **THEN** 均视为合法的**授予**形态

### Requirement: 通配匹配
`@optimus/permission` SHALL 提供 `matches(granted, required)` 判断一个已授予的码
（可含通配）是否覆盖一个被要求的码。

#### Scenario: 精确匹配
- **WHEN** granted 与 required 完全相同
- **THEN** 匹配成功

#### Scenario: 后缀通配覆盖
- **WHEN** granted 为 `partner:campaign:*`，required 为 `partner:campaign:write`
- **THEN** 匹配成功

#### Scenario: 全局通配
- **WHEN** granted 为 `*`，required 为任意合法码
- **THEN** 匹配成功

#### Scenario: 不匹配跨命名空间
- **WHEN** granted 为 `partner:*`，required 为 `order:refund:approve`
- **THEN** 匹配失败

#### Scenario: 中缀通配不被支持
- **WHEN** granted 为 `*:campaign:read`
- **THEN** 该 granted 视为非法，SHALL NOT 匹配任何 required
  （命名空间边界是归属校验的支点，不允许跨越）

#### Scenario: required 不接受通配
- **WHEN** required 含通配符（如 `partner:campaign:*`）
- **THEN** 匹配失败——"要求"必须是具体的，否则声明方可以用通配放宽自己的门槛

### Requirement: 判定入口返回结构化结果
`@optimus/permission` SHALL 提供 `evaluate(subject, required, options?)`，
返回 `Decision` 对象而非布尔值。

#### Scenario: 主体持有覆盖该要求的码
- **WHEN** subject 的 codes 中存在能匹配 required 的项
- **THEN** 返回 `allowed: true`，并给出命中的是哪一条码

#### Scenario: 主体不持有任何覆盖该要求的码
- **WHEN** subject 的 codes 都不匹配 required
- **THEN** 返回 `allowed: false`

#### Scenario: 空 codes fail-closed
- **WHEN** subject 的 codes 为空数组
- **THEN** 返回 `allowed: false`

#### Scenario: 非法的 required fail-closed
- **WHEN** required 不是合法的三段码
- **THEN** 返回 `allowed: false`，SHALL NOT 抛出异常打断调用方
  （判定失败与程序崩溃是两回事，且拼错的码不应该变成放行）

### Requirement: 主体类型不影响判定逻辑但保持来源隔离
`Subject` SHALL 区分 `admin` / `client` / `service` 三种类型，三者共用同一判定逻辑，
但各自的 codes 来源互不相通。

#### Scenario: 服务主体的判定
- **WHEN** 一个 `service` 主体持有 `user-profile:read-basic`
- **THEN** 判定逻辑与 admin 主体完全一致，不因类型不同而放宽或收紧

### Requirement: 声明 DSL 产出带类型的常量
`@optimus/permission` SHALL 提供 `definePermissions(namespace, spec)`，
供子服务在自己的代码里声明权限，产出可直接引用的常量。

#### Scenario: 声明并引用
- **WHEN** 子服务调用 `definePermissions('partner', { campaign: ['read', 'write'] })`
- **THEN** 返回的对象可通过 `P.campaign.write` 取到 `"partner:campaign:write"`

#### Scenario: 声明产出可上报的清单
- **WHEN** 消费方需要把声明的全部权限码上报给平台注册
- **THEN** 能从返回对象取到扁平的码清单

#### Scenario: 拒绝非法的 namespace 或 action 名
- **WHEN** namespace 或任一 action 不是合法 slug
- **THEN** 声明时即抛错——声明是启动期行为，此时抛错比运行期静默失效好

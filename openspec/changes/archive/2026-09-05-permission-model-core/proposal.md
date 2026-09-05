## Why

权限码现在是**不透明的扁平字符串**（`OrderManagement`），平台无法回答"这个码属于谁、
能做什么、有没有越界"。在"一/二/三方团队都会开发子应用"这个既定场景下，这三个问题
必须能回答，否则：子应用可以声明一个人人都有的宽松码（如 `Dashboard`）蹭可见性；
平台要靠一套批准流程去补，而批准流程本身又需要人来维护。

同时，`perms.includes(code)` 这行判定逻辑现在**在四个地方各存一份**——optimus-api 守卫、
partner-service 守卫（裸写 introspect，已被 CI 静态检查标记为存量违规）、
optimus-ui 的 `filterMenus`、以及将来的子应用前端。各写各的必然漂移。

还有一处结构性缺失：按钮级权限已被移除（`routes.js` 的 `// BUTTON: 3 - 已移除`），
当前**没有任何操作粒度**——持有 `OrderManagement` 的人能看能改能删，无法表达"只读"。

完整设计（含现状、四个视角、明确不做的清单）见 `docs/PERMISSION_MODEL.html`。
本变更只做**第一期：纯函数核心包**，不接入任何运行中的代码。

## What Changes

- 新增 workspace 包 `@optimus/permission`（`packages/permission`），与
  `server-sdk` / `client-sdk` 并列，打包方式沿用 server-sdk 那套（零运行时依赖、
  `tsc` 出 dist、`node --test` 跑编译产物）
- 主入口提供：
  - 三段码 `namespace:resource:action` 的 `parse` / `format` / `validate`
  - `matches(granted, required)` —— 通配匹配（`ns:res:*` / `ns:*` / `*`），纯函数
  - `evaluate(subject, required, options?)` —— 判定入口，**返回 `Decision` 对象而非
    boolean**，为将来的数据范围（scope）留位
  - `definePermissions(namespace, spec)` —— 子服务声明自己权限的 DSL，产出带类型的常量
- 规则链 `options.rules` 留作扩展点，**第一版只实现 `holdsCode` 一条**

**BREAKING**：无。本期不接线——不改 `@Perm`、不改 `filterMenus`、不改任何数据库。
现有的扁平码体系原样运行。

## Capabilities

### New Capabilities

- `permission-core`：三段式权限码的解析、通配匹配、判定与声明 DSL

### Modified Capabilities

（无）

## Impact

- 新增 workspace 包 `packages/permission`
- `pnpm-lock.yaml` 新增一个 importer
- 不改变任何现有服务的运行行为

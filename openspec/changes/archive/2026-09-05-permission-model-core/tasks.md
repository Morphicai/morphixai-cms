## 1. 包骨架

- [x] 1.1 建 `packages/permission`（workspace 包，结构与打包方式对齐 `server-sdk`：
      零运行时依赖、`tsc` 出 dist、`node --test` 跑编译产物）
- [x] 1.2 手工在 `pnpm-lock.yaml` 的 importers 段补引用，用 `--frozen-lockfile` 校验。
      lockfile 与备份逐字节一致、`libc` 字段仍为 45 处——没有被 macOS 上的解析改写

## 2. 核心实现

- [x] 2.1 `parse` / `format` / `validate`——三段码解析与校验，失败时给出 `segment`
      指明是哪一段。**参数类型是 `unknown` 而非 `string`**：这些函数会收到来自 DB、
      HTTP body、iframe 消息的值，签名写 `string` 只是把校验责任推给调用方
- [x] 2.2 `matches(granted, required)`——后缀通配。**中缀通配（`*:campaign:read`）
      视为非法**，命名空间边界是归属校验的支点，允许跨越等于开一个绕过口子；
      **required 不接受通配**，否则声明方可以用通配放宽自己的门槛
- [x] 2.3 `evaluate(subject, required, options?)`——返回 `Decision` 对象。
      另补了 `can` / `canAny` 两个便捷式：菜单节点的 `requires` 是数组，
      `canAny([])` **返回 false**（空数组直觉像"无限制"，语义必须是最严）
- [x] 2.4 `definePermissions(namespace, spec)`——带类型的常量 + `$all` 扁平清单，
      产出对象 `Object.freeze`；非法 namespace/resource/action 在声明时抛错
- [x] 2.5 （tasks 里没列，实现时补的）`belongsTo(code, namespace)`——归属校验。
      这是"子应用不能声明宽松码蹭可见性"的唯一防线，平台注册子服务声明的码时用它，
      比一整套批准流程更简单也更严密

## 3. 验收

- [x] 3.1 单测 36 例，覆盖 spec 全部场景 + 边界（大小写、空串、超长段、分隔符数量、
      required 含通配、跨命名空间、非字符串输入、冻结、规则链）
- [x] 3.2 **零运行时依赖已用测试钉住**：断言编译产物里 `require(` 出现 0 次。
      读产物而非源码——源码没 import 不代表产物没有（tslib/helper 可能编译期注入）
- [x] 3.3 `tsc` 零错误；36/36 绿；产物 9.5 KB；提交、合 main
- [x] 3.4 台账回写：TASKS.md 记录本期结论与两处实现期发现，
      ROADMAP 加入权限模型四期规划

## 4. 归档后的 review（2026-09-06）

- [x] 4.1 修 **DSL 类型承诺失效**：`S extends PermissionSpec` 不保留数组字面量，
      `P.campaign.write` 退化成 `` `partner:campaign:${string}` ``，拼错编译器不报。
      加 `const` 类型参数 + `@ts-expect-error` 测试钉住（去掉修饰该测试立刻红，验过）
- [x] 4.2 修 **规则链扩展点被短路堵死**：`evaluate` 在进规则链前就判掉"codes 为空"，
      而那是 `holdsCode` 的判据。将来接与 codes 无关的规则时口子等于没留。已下沉
- [x] 4.3 39 例单测绿（+3）；README 的类型承诺现在为真

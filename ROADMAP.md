# ROADMAP — Optimus CMS 中台化路线图

> 导航文档。回答三个问题：**现在在哪 / 下一步做什么 / 做完了怎么算数**。
> 最后更新：2026-09-05。
>
> 与其它文档的分工：本文件是**全局视图与阶段判据**；`ARCHITECTURE.md` 是**终局架构
> 与层间依赖规则**；`HANDOFF.md` 是**架构决策的来龙去脉**；`TASKS.md` 是**迭代级流水账**；
> `openspec/changes/<name>/` 是**单个变更的四件套**；`openspec/specs/` 是**已交付能力的
> 规格基线**（归档时自动累积）。
> 冲突时以 `openspec list` 的实际任务进度为准，文档一律次之。

---

## 一、终局

把单体 `optimus-api` 收缩成纯 L1 平台服务，业务域按团队边界拆成独立进程。

```
L0 接入层     optimus-ui / optimus-next / zone-activity / embed 宿主
              只做渲染、路由分发、iframe 挂载,零业务逻辑
                              │  依赖 L1 契约;对 L2 的依赖经服务目录间接化
L1 中台基础能力  optimus-api(收缩后) + agent-service + 六个共享包
              中台团队独占维护,业务团队只消费;不依赖任何人(叶子)
                              ▲
L2 业务领域服务  partner-service ✅ │ marketing-service ⏳ │ order-service ⏳
              contact(商业合作域,明确不拆) · 彼此只走 HTTP
```

> **完整终局架构图、每层的成员与职责、层间依赖的具体接口、服务目录如何驱动五条
> 链路、终局部署拓扑、依赖规则总表 —— 全部见 `ARCHITECTURE.md`。**

**终局判据**：`optimus-api` 的 `src/business/` 下只剩 contact；三个业务域各自独立进程、
独立 Dockerfile、独立子域名；新增一个业务服务的成本 = 登记服务目录 + 起进程。

---

## 二、当前坐标（2026-09-05）

分支 `main`，无进行中代码分支。**但本地领先 origin/main 28 个提交，从未推送**——这一整段工作（①⑤⑥②③）都只存在于本机。直接后果：`sdk-usage` 这条 CI **在 GitHub 上不存在，因此完全没生效**，约束目前只在本地 `pnpm check:sdk-usage` 有效。

| 维度 | 状态 |
|---|---|
| 已归档变更 | 14 个（`openspec/changes/archive/`） |
| 规格基线 | 22 个能力（`openspec/specs/`） |
| 活跃变更 | 7 个 |
| 独立业务服务 | 1 / 3（partner-service） |
| 主线进度 | 阶段一 ✅ · 阶段二 ✅ · **②③⑤⑥ 已完成；下一步 ④ 或 ⑦** |
| CI | 1 条流水线（`sdk-usage`）已写好，**尚未推送 → 未生效** |
| SDK 消费方 | **0 个**——`platform-client` 无任何包声明依赖，partner-service 仍用私有 `optimus-api-client.ts` |
| grants 生效点 | **0 个**——`@RequireGrant` 零调用点，信任模型可配置但暂未拦住任何接口 |

活跃变更的性质要分清，混在一起看就会迷路：

| 变更 | 进度 | 性质 |
|---|---|---|
| `platform-gateway-topology` | 18/19 | 主线 · 阶段四（代码已合 main，剩 5.3 全栈 embed 握手） |
| `embed-submenu` | 0/9 | 主线 · 阶段三 |
| `platform-user-profile-query` | 0/9 | 主线 · 阶段四（**依赖关系已变**，见 §三；③ 的 SDK 已就绪，这个能力上线后回来补一个方法即可） |
| `extract-marketing-service` | 0/24 | 主线 · 阶段五 |
| `extract-order-service` | 0/23 | 主线 · 阶段五 |
| `platform-closed-loop` | 21/22 | **收口欠账**，只差一项真实验收，见 §七 |
| `micro-frontend` | 16/19 | **有意挂起**，触发条件未到，见 §七 |

---

## 三、阶段与依赖

```
阶段一 平台基座 ✅ ────► 阶段二 首次拆分+分层定案 ✅
                                    │
                                    ▼
        阶段三 L1 能力补齐
        ② environment-info ✅ ────► ③ client-sdk ✅
        ④ embed-submenu（独立，未开工）
                    │
                    ▼
        阶段四 拓扑与信任边界
        ⑤ gateway-topology ✅（差 5.3 全栈 embed 握手）
        ⑥ trust-model ✅ ◄──── ① service-token ✅
                    │
                    ▼
        ⑦ user-profile-query（依赖 ⑥ 的 grants）
                    │
                    ▼
        阶段五 ⑧ extract-marketing ──► ⑨ extract-order
               （均依赖 ③⑤⑥；⑨ 建议晚于 ⑧）
```

**为什么是这个顺序**（每次想抄近路时回来读一遍）：

1. **⑤⑥ 必须在 ⑧⑨ 之前，理由是同一条。** 生产网关自项目初始化后从未改过、只认识
   三个进程；信任模型至今是空白。**每多拆一个服务，这两个缺口就各重演一次**——
   网关多一处要配，信任边界多一处要补。现在只有 partner-service 一个真实案例，
   且它尚未在业务接口上消费 service token，是修复成本最低的窗口。⑥ 是 BREAKING
   变更，迁移面现在接近于零，晚做只会更贵。
2. **⑦ 现在依赖 ⑥。** 原先它悬着一个"要不要限定哪些服务能查全量用户资料"的待拍板
   项，那不是个特例判断，而是信任分级的一个应用——答案由 ⑥ 的 grants 给出
   （`user-profile:read-basic` vs `read-full`）。所以它从阶段三挪到 ⑥ 之后。
3. **⑧ 必须在 ⑨ 之前。** 营销域内部耦合简单；订单域涉及支付回调这条收入关键路径。
   先用营销域把「迁移路径 + SDK 强约束 + 新网关拓扑 + 信任模型」一起验证一遍。
4. **③ 必须在 ⑧⑨ 之前。** 拆分过程中业务服务需要消费平台能力，没有 SDK 就会退化成
   裸写 HTTP —— 那正是这轮架构要消灭的东西。

> **⑥ 的由来**（2026-09-05）：用"外包团队交付业务服务"和"低代码/AI 生成页面"两个
> 未来确定要支撑的场景压测现有分层，结论是骨架成立、**信任模型是空白**。现有分层的
> 设计假设是"不同的内部团队"，而外包（不可信的代码提供方）和低代码（运营/AI 产出的
> schema 是不受控输入）都突破了这个假设。三处实证见 `platform-trust-model/design.md`
> 的 Context 一节——不是假想缺陷。

---

## 四、阶段完成判据（DoD）

判据只认可**可执行的验证**，不认"代码写完了"。

### 阶段三 · L1 能力补齐

| 变更 | DoD |
|---|---|
| ② environment-info ✅ | 根域名 / cookie 域可经接口查询；至少一个消费方（③ 或 ⑤）真实取到值 —— ③ 的 `getEnvironment()` 已真实取到 |
| ③ platform-client-sdk ✅ | `@optimus/platform-client` 发布到 workspace；**CI 静态扫描能拦住违规写法**（裸写 `/auth/introspect`、跨业务 `@InjectRepository`）——不是"建议使用"，是"不这样过不了检查"。两条规则均已实现并验证 |
| ④ embed-submenu | 一个服务在管理端渲染出多个子菜单，权限码分别生效 |

**阶段三整体 DoD**：partner-service 里所有"因为没有平台能力而临时凑合"的写法全部
被替换（HTTP 直调 optimus-api 的 `client-upload`/`client-shorten` 除外，那两处是有意
的设计），且 ⑧ 的骨架搭建不再需要新增任何平台能力。

### 阶段四 · ⑤⑥⑦ 拓扑与信任边界

拆分之前必须先修对的两件基础设施，加上被它们解锁的一个能力。

**⑤ gateway-topology DoD**：本地 Docker 完整走一遍新拓扑，四条路径同时成立——
1. C 端请求经 `optimus-next` 自托管入口 → 服务目录动态分流 → 落到 partner-service
2. Multi-Zones 的 zone 路径（如 `/activity`）正确落到 optimus-next 而非 optimus-ui
3. B 端 embed 管理页经各自子域名加载，postMessage 握手与 token 下发正常
4. `docker-compose.prod.yml` 能起全部服务，partner-service 有独立 Dockerfile

已拍板、**不要再讨论**：embed 可达范围跟随管理后台整体（VPN-only 方案已否决，理由是
会造成"权限够但不在 VPN 里进不去"的可用性陷阱）；C 端不经 Caddy。

**⑥ trust-model DoD**（BREAKING，三条缺一不可）：
1. **冒充在密码学上不可行** —— 用 A 服务的派生密钥签发 `sub=B` 的 token，自省返回
   `active: false`。不是"约定不给密钥"，是给了也冒充不了别人
2. **能力是配置出来的** —— 模拟一个 `third-party` 服务：默认零 grant、调受保护接口被拒；
   授予单项后仅该项可用；调整 grants 无需重签 token 或重启
3. **授权不可经用户身份绕过** —— 转发高权限用户 token 不会提升服务级能力

已拍板：service token 改每服务独立密钥；需要信任分级；**可访问什么必须是可配置的**
（所以级别只给默认值，`grants` 才是运行时权威）；三方服务数据库独立。

**实施状态（2026-09-05）：26/28，DoD 三条全部通过，且已在真实环境验证。**

真实环境验收（optimus-api:8084 + MySQL）覆盖了八点：补列脚本落地、正常签发自省、
**冒充失败**（持 A 的密钥签 `sub=B` → `active:false`）、**旧共享密钥模型失效**、
**三方默认空 grants**、**授权变更后同一 token 未重签即生效**、拼错的 grant 被拒、
改名不重置授权。验收数据已清理，环境还原。

剩 6.6 台账回写与 6.7 合 main。
测试基线：optimus-api 155/155、server-sdk 13/13、partner-service 110/110。

**⑦ user-profile-query DoD**：跨服务按 uid 查到资料；**partner-service 的 username
快照漂移问题被消灭**（已验证的真实缺陷，不是假想）；`read-basic` / `read-full`
两级由 ⑥ 的 grants 控制。

> 原先悬着的"限不限定哪些服务能查全量用户资料"**已由 ⑥ 关闭**，不再是待拍板项。

### 阶段五 · ⑧⑨ 业务域拆分

两个变更共用同一套七组模板（partner 踩出来的路径）：
落地前修复 → 骨架 → 搬迁 → 目录接入验证分流 → **确认分流生效后**才删原代码 → 单测迁移 → 验收。

**DoD**（每个）：
- 复用 `verify-closed-loop.mjs` 的结构写出该域的闭环脚本，打**真实多进程实例**
  （不是 mock，也不是单服务隔离的 e2e —— 那测不出跨服务分流是否真接通）
- 全量单测绿；optimus-api 侧原代码已删且 optimus-ui 侧残留页面同步清理
- ⑨ 额外：**支付回调路径切流前后逐字节比对**，这是全程风险最高的一点

> ⑧ 实施前要读代码确认：`ActivityService` 现有方法是否覆盖 reward-claim-record 那处
> 原生 JOIN 所需的全部字段。**不要在设计阶段猜**。

---

## 五、贯穿全程的不变量

任何阶段都不能破的规则。破了就是在给下一个阶段挖坑。

1. **服务目录是唯一事实源。** 探测 / 动态菜单 / Agent 工具发现 / 路由分流全部读它。
   新服务"登记即接入"，不允许任何一处硬编码服务地址绕过它。
2. **业务服务之间只走 HTTP。** 禁止跨业务 `@InjectRepository` 别人的 entity、禁止原生
   SQL 跨表 JOIN 别人的表、禁止裸写 HTTP 调 `/auth/introspect`（走 SDK）。
3. **先验证分流，再删原代码。** 拆分变更的第 5 组永远排在第 4 组之后，双跑阶段不许压缩。
4. **迁移不是搬运。** 迁移是给沉睡代码做第一次真实体检。partner 那次挖出表名前缀漏写、
   审计表从未建过、守卫挂错类型、`depth` 被硬编码忽略——全部集中在"业务代码从未被真实
   调用路径触达过"这个模式。**⑧⑨ 要预留体检时间，别按纯搬运估工时。**
5. **`DB_SYNCHRONIZE` 永远是 false**，表名前缀 `op_sys_*` / `op_biz_*` 按归属选。
6. **每个变更完成后立即 `openspec archive`。** 这次一口气积压了 11 个未归档变更，直接
   后果是扫一眼目录分不清"在做的"和"做完的"。
7. **安全边界靠机制，不靠约定。**（⑥ 之后生效）能被"只要谁不把密钥给错人就没事"
   这类话术描述的保证，都不是保证。判据：假设对方拿到了他能拿到的一切，攻击是否
   仍然不可行。应用层的边界规则（如"禁止跨业务 JOIN"）对不可信的代码提供方一律无效。

8. **信任级别决定做不做，不决定要不要防。**（2026-09-05）判断一项安全约束该不该现在做，
   问的不是"外部方会不会作恶"，而是"内部模块出 bug 或被攻破时会怎样"。按前者会漏掉
   一大批约束——幂等、额度、审计这些在纯内部场景下同样防资损。

---

## 六、范围决策：先一方二方，三方暂缓（2026-09-05）

**当前只做一方（内部团队）与二方（内部独立团队）场景，三方（外部合作方）后续再启动。**
理由：三方是当前不存在的场景，一方二方是每天在跑的；为不存在的场景先建能力，
容易设计出用不上的东西。

三方的方向已定，启动时直接实施：**不接受成品交付，只接受源代码，由平台审计、构建、
部署**（源码审计 / 构建期密钥注入 / 默认禁止出网 / 存储由平台提供）。
详见 `docs/SECURITY_MODEL.md` §八。

**这个决策带来一次优先级重排** —— 之前按"防外包"论证的缺口，剔除三方场景后重新分类：

| 缺口 | 三方专属？ | 结论 |
|---|---|---|
| grant 作用域（`points:grant` → `points:grant:<taskCode>`） | ❌ | **保留**，一方也要 |
| 幂等键由平台定 | ❌ | **保留**，当前 `eventId` 由事件内容生成，能构造事件就能绕过幂等 |
| 发放额度封顶 | ❌ | **保留**，防 bug 导致的失控发放 |
| 发放审计 | ❌ | **保留**，出事要能查 |
| 用户标识化名（pairwise ID） | ✅ | 暂缓 |
| 合作方数据托管 | ✅ | 暂缓 |
| 用户 token 转发缺口 | 主要 ✅ | 暂缓（一方同批人同部署，风险可接受） |

**保留的四条构成一个候选变更**（暂名 `platform-capability-constraints`）：它们是纯粹的
业务健壮性问题，与信任级别无关——幂等能被绕过、发放无上限、发完查不到，在纯内部场景
下同样会造成资损。排期位置待定，不阻塞 ⑤。

> 附带解决一处冲突：⑤ 已拍板"embed 各自独立子域名、浏览器直连"，而安全模型说"所有流量
> 必经统一入口"。**在一二方场景下冲突不存在**——直连自己人的服务可接受。三方启动时按
> `trustLevel` 分流即可（一方直连、三方经反代）。

---

## 七、不在主线上的两笔账

**`platform-closed-loop` 21/22 —— 收口欠账，2026-09-05 已收 2/3。**
ai-writing-assist 的代码全部写完（AiService、`POST /api/ai/assist` + 限频、编辑器入口）。
3.4 的三条验收里，**无 key 配置提示**与**限频 429** 已在真实环境验过
（返回明确的缺失变量清单、无堆栈；累计第 7 次调用 429 且不进入模型调用）。

剩最后一条：**真实生成一篇摘要并保存为文章**，阻塞于本地没有 AI key。
配置 `AI_BASE_URL` / `AI_MODEL` / 模型密钥后即可补验，这是本变更唯一剩余部分。

**`micro-frontend` 16/19 —— 有意挂起，不是烂尾。**
迭代四（标准 v0→v1 校准、基座 loader、`entryType` 加 `module`）的触发条件写死在 tasks.md 里：
"第一个真实深度集成模块出现"。partner-service 走的是 embed iframe 而非 module，条件还没到。
**不要在条件到达前开工**，也不要归档——它是活的标准。

> 附带说明：`openspec validate --all` 会报 `micro-frontend` 一条 ERROR（没有 specs 目录、
> 解析不出 delta）。这是它建立时就有的状态，**不是被谁改坏的**。迭代四的标准要"以真实
> 用例校准 v0→v1"，现在补 spec 等于凭空猜，所以有意不补——等触发条件到达、开工时
> 一并补齐；若届时仍无 spec，归档需加 `--skip-specs`。

---

## 八、技术债台账（与主线的关系）

分三类。只有第一类会咬人。

**已清掉（2026-09-05）**
- ~~测试里的表名过期~~ —— 实际是 **9 处**（比原记录的 4 处多，还涉及 `sys_role` 与两个
  e2e spec 文件），已全部改为 `op_sys_*` 并逐条对真实库验证 SQL 可执行
- ~~`packageManager` 与 lockfile 矛盾~~ —— 声明 `8.15.1` 但 lockfile 是 `9.0`，
  **按声明版本装依赖直接失败、生产镜像构建不出来**（⑤ 就是被这条卡住的）。
  已统一到 `pnpm@9.15.4`
- ~~`batchTransformUrls` 尾斜杠~~ —— 已补归一化并验证：无尾斜杠 env 从
  `comimg1.jpg` 修正为 `com/img1.jpg`，带尾斜杠不产生双斜杠，非 OSS 路径不受影响

**会咬人的（建议尽早处理）**
- **`RolesGuard` 的清单描述曾是错的，注意**：它**不是"已无调用点"**——
  `admin-order.controller.ts:17` 与 `database-backup.controller.ts:24` 都还在
  `@UseGuards(JwtAuthGuard, RolesGuard)`。其权限比对整段被注释、末尾无条件
  `return true`，对非超管一律放行。当前无害（全局 `UnifiedAuthGuard` 先执行且已
  fail-closed），但**谁若以为它在起作用就会误判安全性**。删除前需单独验证这两个
  controller 的权限声明是否完整

**加固项（不阻塞主线，但越早越省）**
- **一方服务的 DB 账号收窄**：`partner-service` 目前是 `DATABASE_USERNAME=root` +
  与主服务同库。改成每服务一个只授自己 `op_biz_*` 表权限的账号，就能把"禁止跨业务
  JOIN"这条应用层约定变成数据层强制。改动量极小。
  **注意这与 ⑥ 的"三方服务数据库独立"是两件事**——三方隔离是必须（不可信提供方），
  一方收窄是加固（防误用）。不拆库，只拆账号

**partner 迁移的清理尾巴（应随 ⑧ 一起做掉，同类工作合批）**
- `optimus-ui`：`pages/{partner,partner-management}`、`pages/external-task-review`、
  `system/views/PartnerDataManagement.jsx`、三个 `*PartnerService.js` —— 全部无 import 引用
- `optimus-api`：`ClientUserAuthGuard` + `require-client-user-auth.decorator.ts` 已无调用点
- embed 端 React 胶水代码抽进 `@optimus/admin-embed`（已排进 ③）

**可延后**
antd v4→v5 弃用 API、dashboard 数据源、`orderNum` 死字段（`routes.js` 无 sort，字段不生效）、
`@optimus/common` 未导出文件评估、GameWemade 废弃 env 变量、i18n-platform 内部化、
ComingSoon 文档页、ArticleSDK 双实现合并。

---

## 九、迷路时怎么重新定位

按顺序执行，三步之内一定能回到坐标系：

```bash
openspec list                      # 1. 活跃变更 + 真实任务进度(唯一可信进度源)
openspec show <change>             # 2. 单个变更的完整四件套
openspec list --specs              # 3. 已交付能力的规格基线
```

然后对照本文件 §二 的表格确认该变更属于哪个阶段、§四 的 DoD 确认怎么算完成。

**开工前的固定动作**：读该变更的 `design.md` 的 Risks / Open Questions 章节。
里面有几处是**故意留给实施者确认的**，不是遗漏（已知的两处：⑤ 的资料查询鉴权范围、
⑦ 的 ActivityService 字段覆盖）。

**不要拿来理解现状的文件**：`Caddyfile` 和 `docker-entrypoint.sh` 是化石，
自 2026-01-01 `init project` 后从未改动，只认识三个进程——它们是 ⑥ 要修的对象，
不是现状的描述。

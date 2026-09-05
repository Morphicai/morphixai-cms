# Optimus CMS - Task Tracking

> 保持精简，定期清理，只留进行中的事。
> **全局路线图与阶段完成判据见根目录 `ROADMAP.md`**，本文件只记迭代流水。

## 当前状态（2026-09-05）：台账收口完成，主线待从阶段三起步

积压的 11 个已完成变更全部归档，`openspec/changes/` 从 20 个降到 9 个活跃变更，
同时建立起 `openspec/specs/` 规格基线（18 个能力）。顺带修掉两处台账失真：

- `extract-partner-service` 4.5 补勾 —— 管理页实际已在第 5 组随 `admin-app/`
  （独立 Vite + React 18 + antd 5）交付，只是复选框没勾，不是待办
- 8 个早期（08-23 那批）spec delta 是老格式（`# Spec:` + 2 级 Requirement），
  `openspec archive` 解析不出 delta 操作而中止。统一转成
  `## ADDED Requirements` + 3 级 Requirement / 4 级 Scenario，四个变更重新 validate 通过。
  08-24 之后的变更已全部是规范格式，属一次性历史债

9 个活跃变更里 7 个是主线（见 ROADMAP §二），另外两个不在主线上：
`platform-closed-loop` 21/22 差一项真实验收（需完整环境，见 ROADMAP §六）、
`micro-frontend` 16/19 有意挂起等触发条件。

## ④ embed 菜单两层分组——阶段三收口（2026-09-05，已归档）

**服务目录新增自引用 `parentKey`**,一个团队可以登记多条 embed 记录并归到同一父节点。
在这之前 `key` 唯一索引把「一条记录=一个入口=一个菜单项」焊死,partner-service 只能
把两个逻辑独立的功能塞进一个 iframe 用 antd Tabs 做伪子菜单。

**规则设计上省掉了一整块预想的实现。** design.md 设想要写 `checkCircularReference`
遍历链路找环;但菜单**两层封顶**,只要规定「父必须是顶层记录」,自引用、A↔B 的环、
三层嵌套三种坏数据一次全挡住,一条判断顶掉一个图遍历。

**三处「两种失败里选轻的那个」**(实现里都有注释):
1. 父节点可以是没有 `embedUrl` 的纯分组条目,点它只展开
2. **父被禁用时子节点提升到顶层**,而不是一起消失——让一条 enabled 的记录静默不可达
   是更糟的失败,会以为服务坏了。同一条规则顺带兜住「parentKey 指向不存在记录」的脏数据
3. 子项全被权限挡掉时,没有 `path` 的父节点自己消失,不留点不动的空壳
删除**不做级联**:静默带走子记录误伤不可撤销,改为拒绝并报出子节点 key。

**接口从平铺变成树,顺带发现一处会静默坏掉的地方**:`pages/embed/index.jsx` 原先
`(res.data||[]).find(e => e.key === serviceKey)` 只扫第一层——不改的话所有子菜单
都会报「服务不存在」。tasks 里没列这一项,是改了返回形状之后自己找出来的。

**自己造的一个 bug 被单测当场抓到**:父不可见的子节点先被当顶层加入,又在挂载循环里
被 push 一次,同一条出现两遍。已把「是否归组」抽成一个判定,两个循环共用同一判据。

**顺手修了测试桩的一处失真**:`mkRepo` 的 `find` 原先忽略 `where` 直接返回全表,
「查子节点」这类调用在测试里永远拿到全部行——桩比实现宽松,测试就测不出真实行为。

**没做完的一项**:侧边栏的浏览器目视确认。`services/entries` 要管理员登录,而 admin
密码不在我手上(上一轮验收后已还原)。改动面已被 26 例单测覆盖到函数级(其中 9 例跑
的是**真实的** `getDynamicServiceMenus` + `getMenuTree`,只桩掉 API 与 storage),
但「看起来对不对」仍需人工点一下。示范分组行保留在 dev 库里方便确认,清理语句写在
归档件的 4.1。

## ⑦ 跨服务用户资料查询——信任模型的第一个生效点（2026-09-05，已归档）

**新增 `GET /api/service/user-profile/{basic,full}/:userId`。** 由来是业务方各自
冗余存一份会漂移的用户名快照(`partner_profile.username` 是已验证的案例)。

**在这之前 `@RequireGrant` 是零调用点**——grants 存得下、守卫写好也测过,但没有任何
接口真的被它拦住,信任模型是「可配置但未生效」。⑦ 把它变成「真的在拦」。

**新增了一种认证模式。** 原先只有 admin/client/anonymous 三种,而全局的
`UnifiedAuthGuard` 先于模块级的 `ServiceGrantGuard` 执行——不加 `AuthMode.SERVICE`,
service token 会先被当成无效的管理员 JWT 拒掉,`@RequireGrant` 根本轮不到执行。

**`@ServiceAuth()` 漏挂 `@RequireGrant` 时 fail-closed**(403,且在验 token 之前
就拒):只挂前者等于「任何登记过的服务都能调」,而漏挂从外部看不出来。与「未标注
权限的 admin 接口一律拒绝」是同一个立场。

**字段白名单,且在 SQL 层就只 select 白名单列**——不是查回整行再删字段,
`passwordHash` 根本不离开数据库。**phone 两档都不给**:它既是登录标识也是短信/
二次验证的落点,敏感度高于邮箱;真有需求应单独开 grant,不塞进 full 搭车。

**真实验证 10 个场景,两条是关键证据**:已下线的服务、以及没人登记过的 serviceKey,
即使 token 在密码学上完全有效也一律 403 —— **token 只证明「我是谁」,能做什么每次
都从服务目录现读**。所以下线服务后旧 token 立刻失效,不必等它过期。

**启动才暴露的坑**:`ServiceGrantGuard` 在**使用它的那个模块**的注入上下文里实例化,
它依赖的 `ServiceRegistryService` 必须在那里能解析到。AuthModule 导出了 guard 本身
但没把 ServiceOpsModule 一起再导出,所以新模块要显式 import 它。
**tsc 干净、单测全绿,进程仍然起不来**——这类错误只有真起服务才会报。

**修正一处自己写错的数字**:ARCHITECTURE 里「10 处存量债」实际是 **9 处**
(3 处跨域注入 + 6 处裸写 HTTP,其中 2 处只是注释提到路径)。原数字是照着一次
带自匹配噪声的输出写的——那次运行把脚本自己的规则字面量也算了进去。

**仍然没闭的**:`platform-client` 依旧零消费方(partner-service 还在用私有的
`optimus-api-client.ts`)。⑦ 提供了能力,迁移存量调用方不在其范围内。

## ③ 平台能力 SDK + 架构约束的 CI 检查（2026-09-05，已归档）

**`@optimus/platform-client` 发布到 workspace**：`uploadFile` / `createShortLink` /
`getEnvironment`，零运行时依赖。27 例单测 + 真实 api 打通(注册的 client 用户 token、
真实上传落到 MinIO、真实短链)。

**三处契约细节封进包里**,消费方不必再读 controller 源码:

1. **`needThumbnail` 只在 true 时发送**。平台 DTO 是 `@Type(() => Boolean)`,而
   multipart 的值一律是字符串——`Boolean("false") === true`,**传 false 会被反向
   解读成"要缩略图"**。省略是表达 false 的唯一安全方式
2. 响应字段名不一致(`thumbnail_url` 蛇形、`type` 其实是 mimeType),SDK 归一
3. **短链返回的是站点根相对路径,不是绝对 URL**——spec 原文写"完整 URL"与事实
   不符,已按事实改 spec。SDK 不替消费方拼域名:拼错域名的短链比没有短链更糟,
   而该用哪个域名取决于分发渠道,只有消费方知道

**没有依赖 `@optimus/server-sdk`,与原设计相反**:封装的三个能力两个要
`@ClientUserAuth()`(用户的 token)、一个匿名,**没有一个吃 service token**。
为"看起来分层正确"加一个用不上的运行时依赖不值得。

**CI 检查 `scripts/check-sdk-usage.mjs`**(本仓库第一条流水线,`.github/` 此前不存在):
- 两条规则:裸写 HTTP 调平台接口;跨业务域 `@InjectRepository` 别人的 entity
- **只查 diff 新增行**,存量违规不追溯——堵新增和清存量混在一起,规则上线当天
  就会被整体关掉
- 扫描范围用**反向名单**(排除"平台自己"的目录),新拆的服务自动被覆盖
- 豁免要写原因:没有豁免口,人只会整个关掉检查

**归档后发现 DoD 没满足,当天补齐**:③ 的 DoD 原文点名了"裸写 `/auth/introspect`、
**跨业务 `@InjectRepository`**"两类,第一版只做了前者。补上后全量体检报出 **10 处
存量债**(partner→points-engine 的 4 处跨域注入 + 5 处裸写 HTTP + zone-activity 1 处),
都是 ⑧ 拆分前要还的账,不卡 CI。

**踩坑记录:`pnpm install --filter <pkg>` 会按过滤后的项目集裁剪整个虚拟 store。**
typeorm 等不属于该项目的包被直接删掉,正在跑的 api 立刻报
`Cannot find module './InsertQueryBuilder'`。恢复要跑一次**不带 `--filter`** 的
`pnpm install --frozen-lockfile`,并**重启进程**(peer 后缀变了,老进程还指着旧目录)。
新包的依赖是手工往 lockfile 的 importers 段补的,前后 md5 一致、45 处 `libc` 未丢。

## ② 环境信息读口完成 + 阻塞项清理（2026-09-05）

**② platform-environment-info 5/5 已归档。** 新增 `GET /api/environment`,
匿名 + 限频 120/分,返回 `{environment, rootDomain, cookieDomain}`。它是 ③
platform-client-sdk 的前置,而 ③ 是 ⑧⑨ 的硬依赖。

核实配置时发现两件与任务假设不同的事:① `SITE_DOMAIN` 有两条读取路径且取值不一致
(yml 的 `app.file.domain` 带默认值 vs oss.controller.ts 读的裸环境变量),接口以配置
系统的正式条目为准;② `COOKIE_DOMAIN` 留空是本地开发的**正确状态**而非漏配
(host-only cookie 才能被 localhost 接收)。首次实现用 `config.get("SITE_DOMAIN")`
拿到空值,**真实请求才暴露**——单测过了不代表对。

**清掉三个遗留阻塞项**:
1. 测试表名过期——实际 9 处(记录里写的 4 处),还涉及 `sys_role` 与两个 e2e spec。
   会污染 ⑧⑨ 的「全量测试绿」判据
2. `packageManager` 与 lockfile 矛盾(声明 8.15.1 但 lockfile 是 9.0)——
   **按声明版本装依赖直接失败、生产镜像构建不出来**,⑤ 就是被这条卡住的。
   已统一到 pnpm@9.15.4
3. `batchTransformUrls` 尾斜杠——已验证无尾斜杠 env 从 `comimg1.jpg` 修正为
   `com/img1.jpg`

**并修正技术债清单里两处失实记录**(错的记录比没记录更危险):表名过期的处数;
以及 `RolesGuard` 记的「已无调用点」是错的——`admin-order.controller.ts:17` 与
`database-backup.controller.ts:24` 都还在用它,其权限比对整段被注释、无条件放行。
当前无害(UnifiedAuthGuard 先执行且已 fail-closed),但谁以为它在起作用就会误判
安全性。没有贸然删,删前需单独验证那两个 controller 的权限声明。

**顺带修一处会持续埋坑的配置**:`jest.unit.config.js` 的 `testMatch` 是显式白名单,
新模块不加进去测试写了也不会执行——这也是 test/ 目录过期表名长期没被发现的原因。

## ⑤ 生产拓扑改造（2026-09-05，16/19）

三条流量路径拆开:C 端经 optimus-next 自托管(不经 Caddy)、管理后台走精简 Caddy、
embed 各自独立站点。Caddyfile 重写并改用 compose 容器名寻址;新增
`docker-compose.prod.yml` 与 `packages/partner-service/Dockerfile`;
entrypoint 不再启动 Caddy(已是独立容器,会抢 8080 且解析不了容器名)。

**关键实证**——经 optimus-next 打 `/api/biz/partner/profile` 得 **401**,而直接打
optimus-api 同一路径得 **404**。这组对照证明分流真的生效:若没生效,前者必然也是
404,而 404 正是改造前生产拓扑下的失效形态。zone 路径 `/activity` 经 next 得 200
且内容来自 zone-activity。partner-service 独立镜像(591MB)构建成功并接库跑通,
`/health`、`/metrics-lite`、`/admin/` 静态页均正常。

**做部署产物挖出三个既存缺陷**(此前从未暴露,因为没人真正构建过生产镜像):
① 根 Dockerfile 用 pnpm@8.15.9 配 lockfileVersion 9.0,生产构建链早已断裂;
② partner-service 缺 dayjs 声明;③ 缺 @types/multer。均已修复。
又一次印证不变量第 4 条:迁移不是搬运,是给沉睡代码做第一次体检。

**两个构建环境的坑已写进 tasks.md**:registry 必须避开 npmmirror(拉大包挂住);
改 lockfile 必须在 Linux 容器里做(macOS 上会丢 45 处 lightningcss 的 libc 平台
字段,而镜像是 alpine),且 pnpm 会读 packageManager 字段自动降级运行。

剩 5.3(经 Caddy 独立站点完成 embed 握手,需起全栈 compose,当前网络下代价过高)
与合并收尾。

## 范围决策：先一方二方，三方暂缓（2026-09-05 拍板）

**当前只做一方/二方场景，三方（外部合作方）后续再启动。** 三方方向已定：
**不接受成品交付，只接受源代码，由平台审计、构建、部署**——源码审计可扫出网调用与
数据落盘、构建期注入密钥（对方接触不到凭据）、默认禁止出网、存储由平台提供。
四条叠加后"私自留存并带走"的路径基本封闭，但对外表述用**可控/可审计/可追溯**，
不用"绝对安全"（审计不能穷尽、授权内的数据本就可用、合法通道可夹带）。

**这个决策带来一次优先级重排，比决策本身更重要**：之前按"防外包"论证的缺口，
剔除三方后有四条必须保留，因为它们**与信任级别无关**——
grant 作用域、幂等键由平台定（当前 `eventId` 由事件内容生成，能构造事件就能绕过）、
发放额度封顶、发放审计。这些在纯内部场景下同样会造成资损，构成候选变更
`platform-capability-constraints`。暂缓的是三方专属的三条：用户标识化名、
合作方数据托管、用户 token 转发缺口治理。

新增不变量第 8 条：**信任级别决定做不做，不决定要不要防**——判断一项安全约束该不该
现在做，问的是"内部模块出 bug 或被攻破时会怎样"，不是"外部方会不会作恶"。

安全文档两版：`docs/SECURITY_MODEL.md`（技术版，17 条攻击路径的攻击树）与
`docs/SECURITY_FOR_CUSTOMERS.md`（客户版，无术语）。**两版都逐项标注 ✅已上线/⏳规划中**，
客户版尤其重要——把规划中的说成已有的会构成商业风险。

## 架构压测与信任模型（2026-09-05 拍板）

用两个**未来确定要支撑**的场景压测现有 L0/L1/L2 分层——① 外包团队交付一个业务
服务；② 低代码/AI 生成页面。目的不是做这两件事，是验证架构是否合理。

**骨架成立**，四条经住了压测、不用动：服务目录"登记即接入"（两个场景的接入方式
都是登记一行数据，L0 零改动）、L0 不直接依赖 L2（停掉某服务只有它自己坏，验收判据
是架构天然给出的）、L2 只能 HTTP 消费 L1（外包物理上拿不到源码，隔离是结构性的）、
agent-service 先例（低代码作为"L1 通用能力 + 独立进程"有依据）。

**信任模型是空白的。** 现有分层的设计假设是"不同的**内部**团队"，外包（不可信的
代码提供方）和低代码（运营/AI 产出的 schema 是不受控输入）都突破了这个假设。
三处实证：

1. `ServiceTokenService` 是单一 `SERVICE_TOKEN_SECRET`，`issue(serviceKey)` 可对
   任意 serviceKey 签发——**持有密钥即可冒充平台任意服务**。防冒充那条 spec 的
   Scenario 前提写的就是"未持有正确的共享密钥"，密钥持有者不在防护范围内
2. `partner-service` 用 `DATABASE_USERNAME=root` 连同一个 `optimus` 库——
   "禁止跨业务 JOIN"这条边界规则在应用层是设计，**在数据层零强制**
3. 所有 L2 服务平等信任，架构里没有"这个服务能访问什么"的表达

**用户拍板三条**（→ 新变更 `platform-trust-model`，26 任务，排在阶段四）：
① service token 改每服务独立密钥；② 三方（外包）服务数据库隔离；
③ 需要信任分级，且**可访问什么必须是可配置的**——因此级别只给默认授权集，
`grants` 才是运行时权威判据。

**连带影响**：`platform-user-profile-query` 原先悬着的"要不要限定哪些服务能查全量
用户资料"**不再是待拍板项**——它不是特例判断，是信任分级的一个应用，答案由 grants
给出（`read-basic` / `read-full`）。该变更依赖关系随之改变，从阶段三挪到阶段四、
排在 trust-model 之后。主线编号整体重排为 9 个（见 ROADMAP §三）。

**已实施（2026-09-05，25/28）**：密钥模型改为 HKDF 派生（平台侧不存任何派生密钥，
服务目录表泄露不致身份沦陷）；`trust_level` + `grants` 两列落地并接进管理端
（三方标红）；`@RequireGrant` + `ServiceGrantGuard`；server-sdk 补
`deriveServiceSecret()` / `hasGrant()`；`docs/THIRD_PARTY_ONBOARDING.md` 接入指引
（派生命令已验证与测试向量一致）。两个包的派生实现由**共享 HKDF 测试向量**锚定，
任一边改算法两边测试同时红。测试：api 155/155、sdk 13/13、partner 110/110。
**真实环境验收已通过（2026-09-05，Docker + MySQL + api:8084）**：补列脚本落地、
冒充失败（持 A 密钥签 `sub=B` → `active:false`）、旧共享密钥模型确认失效、三方默认空
grants、**授权变更后同一 token 未重签即生效**、拼错 grant 被拒、改名不重置授权。
验收数据已清理（测试条目删除、admin 密码还原、目录回到 7 条）。剩台账与合并收尾。

顺带把 `platform-closed-loop` 3.4 收了 2/3：无 key 配置提示、限频 429 均在真实环境
验过；**真实生成摘要那条阻塞于本地无 AI key**，配置后可补。
本地 `.env` 原本缺 `SERVICE_TOKEN_SECRET`（`platform-service-token` 完成后没补，
.env 不入库），已补一个随机主密钥。

**实施中定下的三个前置问题**：① grant 校验两侧都要——api 内用装饰器、子服务用
SDK 的 `hasGrant()`，不是二选一；② 信任级别三级全定义，`second-party` 虽无实例但
定义成本为零、事后加值要改 migration；③ 主密钥轮换本期不做（在线服务仅 1 个），
**这是有意省略，服务变多后必须补**。

**架构调整中有一项暂不做**：`design-system` 现在在 `optimus-next/src/` 属 L0，
但低代码物料、外包 admin-app、未来 marketing admin-app 都要消费它——被多方依赖的
东西不该待在 L0。但抽包要先解决双栈问题（optimus-ui 是 React 18 + antd 5，
optimus-next 是 React 19 + Tailwind 4），**等第二个真实消费方出现时再做**
（⑧ 的 marketing admin-app），现在做是凭空猜。

## 本轮排期（2026-08-31 定）：服务身份能力完成，网关拓扑缺口已排期，进入环境与 SDK 接入阶段

extract-partner-service 完成后，顺势把"中台 vs 业务团队"的分层架构定了下来
（L0 接入层 / L1 中台基础能力层 / L2 业务领域服务层，四个业务域：营销/订单/
合伙人增长/商业合作）。据此拆出 8 个按依赖顺序排期的 openspec 变更（均已
`openspec validate` 通过，proposal/design/specs/tasks 四件套齐全）：

1. `platform-service-token` — 服务身份调用凭证（**已完成，OpenSpec 任务 11/11**）
2. `platform-environment-info` — 环境信息查询（根域名等）
3. `platform-client-sdk` — `@optimus/platform-client` 封装 + SDK 强约束
4. `embed-submenu` — 服务目录支持一个服务多子菜单
5. `platform-user-profile-query` — 跨服务用户资料查询（依赖①）
6. `platform-gateway-topology` — 生产网关拓扑修正（**新增，见下方说明**）
7. `extract-marketing-service` — 营销域物理拆分（依赖③⑥）
8. `extract-order-service` — 订单域物理拆分（依赖③⑥，晚于⑦）

**新增 `platform-gateway-topology` 的由来**：核查"是否具备统一网关""跨服务
身份能否透传"这两个问题时发现，唯一的生产网关配置（`Caddyfile` +
`docker-entrypoint.sh`）自项目初始化提交后**从未被修改过**，比 Multi-Zones、
agent-service、service-registry、extract-partner-service 全部更早。具体
会炸两处：① `/api/*` 硬编码转发到 optimus-api，拦在 optimus-next 自己的
服务目录驱动动态代理之前——partner-service 拆分完成后这条路径已经在生产
拓扑下失效（8084 早就没有那些路由了），Multi-Zones 的 zone 路径也会被
错误转发到 optimus-ui 而不是 optimus-next；② B 端 embed 管理页浏览器直接
打子服务自己的源（不经过网关），但 `docker-entrypoint.sh` 根本没有启动
partner-service（以及未来的 marketing-service/order-service/agent-
service/zone-activity），这些服务在生产环境里既没被启动也没暴露。每多拆
一个服务这个缺口就更深一次，现在（只有 partner-service 一个真实案例）是
修复成本最低的窗口，因此插入在 `extract-marketing-service` 之前。
`extract-order-service` design.md 里原本悬着的"支付回调地址网关侧配置"
Open Question 已归入本变更统一处理，不再单独悬空。

**范围决策已由用户拍板（可直接进入实施）**：① embed 管理页可达范围
**统一跟随管理后台整体**，不做内网/VPN-only 的差异化限定（原设计的
"内网/VPN-only"推荐方向已否掉，理由是会造成"权限够但因为不在 VPN 里
进不去某个具体页面"的可用性陷阱，`op_sys_service_registry` 因此不再
需要新增可达范围字段）；② **C 端确定不经过 Caddy**，`optimus-next`
自托管为直接入口，管理后台这条线保留精简版 Caddy（optimus-ui 静态站 +
固定转发 optimus-api），每个 embed 服务各自配一个公网子域名站点配置。
`openspec/changes/platform-gateway-topology/design.md` 已按此重写。

**交接文档见根目录 `HANDOFF.md`**（背景、已拍板的架构决策、依赖顺序、接手前必读的坑）。

**`platform-service-token` 已完成**：新增短期 service JWT、自省分支、服务目录
enabled 校验、server-sdk 签发/校验方法及文档。真实 HTTP 验收使用
partner-service 目录记录完成“签发 → active → 禁用后 inactive → 恢复后 active”，
API 13 套件/139 用例、server-sdk 9 用例全绿。当前未提供公开签发接口，服务通过
环境变量共享密钥本地签发；业务子服务的本地 guard 暂不切换，等真正消费 service
token 的业务接口出现后再接入。

上一段迭代（partner-service 迁移）的结论：单机微服务基建（服务目录+embed+
introspect+API代理）接一个真实业务模块（不是 demo）顺畅，核心链路直接复用
打通；embed 端 React 集成胶水代码值得抽进 `@optimus/admin-embed` 包，已作为
`platform-client-sdk` 变更的一部分排期。api+partner-service 全量单测
132+110 全绿，自动化闭环脚本 `verify-closed-loop.mjs` 33 项断言可长期复用。
详见 `openspec/changes/extract-partner-service/tasks.md` 第 8 组。

## 上一迭代：权限模型收紧为 fail-closed（2026-08-24 完成，已合 main）

数据表审计发现的权限缺口收权为一个独立迭代：全库精确扫描（正确识别
@ClientUserAuth/@AllowAnonymous/@AnonymousAuth/@RequireSuperAdmin 等六种
装饰器，排除误报）定位到 11 个 controller、53 个方法确实无权限声明，逐个
判定后全部处理：

- **最严重**：partner.controller.ts 的 update-mira/update-star——直接改
  合伙人积分余额/星级，此前零权限校验且是唯一入口（非内部服务回调）。
  收为 @RequireSuperAdmin（普通权限码可能被误发给运营角色，直接写积分/
  权益的操作不该有这个空间）
- **死代码陷阱**：partner.controller.ts 里 7 个 admin/* 路由与
  partner-admin.controller.ts 完全同路径，因模块注册顺序当前不可达，
  但只要注册顺序被无意调整就会复活成无保护路由——已删除
- **写操作零校验**：partner-admin（16 方法，冻结/改上级关系/改备注等，
  仅两个"清数据"方法有 SuperAdminGuard）、reward-claim-record 的
  Get()/Delete()（swagger 标"管理员"却无 @Perm）
- **读敏感数据零校验**：admin-order（全量订单）、appointment 的
  list/export（全量预约+手机号）、operation-log（全部管理行为）、
  external-task-admin（任务审核，关联积分发放）
- **新增权限码**（对齐前端菜单 routes.js 同名项，授予角色 1/2）：
  OrderManagement/Appointment/ConfigCenter/RewardClaimRecord/
  ActivityCenter/PartnerManagement/PartnerDataManagement/
  ExternalTaskReview/OperationLog
- **自服务豁免**：user-dictionary.controller.ts 按 req.user.id 读写自己的
  数据，标 @AllowNoPerm+注释（性质等同"改自己密码"，非漏洞）
- **guard 翻转**：unified-auth.guard.ts 的"未挂 @Perm 即放行"改为
  fail-closed（抛 403），新写的 ADMIN 模式接口必须显式声明
  @Perm/@AllowNoPerm/@RequireSuperAdmin 三选一
- **验证**：全库精确扫描确认零遗漏后才翻转；造角色3（零权限码）测试账号，
  18 个历史高危接口全部 403；改绑角色1（新码已授权）后同一 token 全部 200；
  @RequireSuperAdmin 接口对角色1（非超管 type）仍正确 403，证明两道门
  独立生效；api 153 测全绿（含更新后的 perm-check.spec.ts fail-closed 断言）
- 发现但不在本次范围：RolesGuard（旧守卫）的权限判断代码整段被注释掉，
  等同永远放行——因 UnifiedAuthGuard 是全局守卫先执行且更严格，不影响
  本次修复效果，但该文件本身是废弃代码，值得找机会清理

## 上一迭代：数据表规划审计（2026-08-24 完成，已合 main）

按"基础设施与业务数据隔离"思路全库审计（36 表 + 6 字典集合），修掉三处：

1. **dictionary/config.service 删除**——死代码（零调用方、库无数据），但它是现成的
   "AI 密钥/API Key 存字典"通道，一旦被用密钥就落进 DataCollections 可见的地方。
   密钥只走 env 注入，不进库
2. **备份接口收权**——backups/* 全员 @AllowNoPerm 裸奔（guard 里 AllowNoPerm 先于
   超管检查直接放行，注释却宣称"仅超管"），任何登录账号可下载整库备份。
   收为 @Perm("DatabaseBackup")，码 70/71 只发管理员角色
3. **短链管理收权**——/system/short-link CRUD 无任何权限标注（无标注默认放行）。
   收为 @Perm("ContentShortLink")（对齐前端菜单码），码 72/73

审计通过：op_biz_* 13 业务表专表+模块权限门；RBAC/日志/OSS/文章/文档/表单/i18n
专表且门齐；字典 6 集合全是业务内容数据（服务目录迁出后字典侧已无基础设施数据）。
"无标注接口默认拒绝"仍挂账——短链就是默认放行的实际受害者，做时以此为例。

## 前一迭代：服务目录迁专表（2026-08-24 完成，已合 main）

服务目录从字典集合行迁到专表 `op_sys_service_registry`（字段列化，key/path_prefix
DB 唯一索引）。动机：字典是业务数据的地盘，DataCollections 权限在数据集合页一个
删除就能端掉整个目录——**基础设施数据与业务数据物理隔离**，专表只有 ServiceOps
门后的接口能写，字典侧任何操作够不着。probe 改经 registry service 读目录；
消费视图/前端/agent/proxy 零改动。迁移脚本 db/migrate_registry_to_table.sql。

## 前一迭代：zone 路由动态化（2026-08-24 完成，已合 main）

zone 路由从 next.config 启动时 rewrites 迁到 src/proxy.ts：60s TTL 拉服务目录 +
stale-while-revalidate（目录不可达沿用旧表），**登记/启停 zone 约 1 分钟生效、
主站零重启**——之前评估里"变更需重启"的最大缺口已消。registry 同时加保留前缀
校验（/api /auth /embed 不可登记为 zone 前缀）。
遗留观察：zone SSR introspect 偶发失败静默降级为未登录（既有容错，刷新即恢复），
zone 变多后若成为可感知问题，考虑 introspect 加一次重试。

## 前一迭代：zone 共享登录收口（2026-08-24 完成，已合 main）

zone 未登录引导定为**跳转**：`/auth?redirect=` 回跳（同源校验：只收 `/` 开头且非 `//`，
防 open redirect；跨 zone 硬导航 window.location）。另两条通道已实现、浏览器验证过，
保留为资产不删：@optimus/auth-ui 共享包（同栈构建时，只发 dist，主站不暴露源码）、
/auth/login-embed iframe 通道（postMessage，异构/外部子应用）。
业务复杂到弹层体验值得时，再切共享包——届时 zone 只改 SignupPanel 一处。

## 前一迭代：zone-foundation（2026-08-24 完成，已合 main）

C 端 Multi-Zones 落地（微前端三模式的模式二）：

- 目录 entryType 加 `zone`（pathPrefix 单段小写、全域唯一）；`/api/public/zone-routes`
  匿名读口（消费方是 next server 进程无 token 可带，限频，生产网关可屏蔽收口）
- **管控落点**：服务状态页登记/启停 zone，optimus-next 启动时从目录拉路由表
  生成 rewrites（每 zone 三条：裸前缀/子路径/静态资产）；目录不可达回退空表不阻启动
- packages/zone-activity（8088）：basePath+assetPrefix 两行配置即成 zone；
  SSR 页实证登录态无缝（clientAccessToken cookie 同域直达，introspect client 分支，
  zone 零登录代码）与基础能力直通（集合数据直读）
- 纪律：跨 zone 链接用 a 标签；assetPrefix 约定 = pathPrefix + "-static"
- 存量瑕疵记录：public-i18n/public-dictionary 实际挂在双 /api 前缀下
  （controller 路径重复了全局前缀），公开接口硬化时统一；新接口一律裸路径

## 前一迭代：service-registry（2026-08-23 完成，已合 main）

服务目录 = 人与 AI 共用的接入面，探测/动态菜单/Agent 工具三个消费者的唯一事实源：

- `/system/services` CRUD（门 ServiceOps）：URL 校验（仅 http(s)/禁用户信息段/
  embed 必填 embedUrl），变更发 service.registered/updated/removed 审计事件
- 动态入口：目录 entryType=embed 条目 → 菜单项（照抄动态文档菜单模式）→
  固定宿主路由 /embed/:serviceKey → EmbedFrame 握手。**菜单是页面加载时拉取的,
  登记后已开页面需刷新**
- Agent 工具发现改读目录（tool-providers 最小披露），env 兜底；实测改 toolsPath
  不重启即生效。多 provider 各带自己的 base（baseUrl 语义 = API 根,可含路径前缀,
  拼接用字符串不用 new URL——绝对路径会吃掉 base 前缀）
- demo-activity 迁为目录动态接入，routes.js 静态节点下线（零代码接入实证）
- 踩坑：op_sys_dictionary 唯一键含 user_id,NULL 不判重,INSERT IGNORE 不幂等,
  seed 一律 NOT EXISTS 守护；集合 seed 不硬编码 id（会被环境后建集合占用）

## 上一迭代：service-ops + 周边（2026-08-23 完成，已合 main）

- 服务治理三件套：op_sys_service_event 事务性 outbox（id 即游标,双读语义）、
  ServiceProbe 15s 探测（状态内存态）、/metrics-lite 自采样 + 管理端服务状态页
- agent run 结束自动上报 agent.run.finished（fire-and-forget）
- 菜单收敛：下线"翻译管理"（与多语言管理撞车,嵌入样例角色由演示活动承担）
- 单测基线：public-article 测试修复对齐现实现;partner/points-engine 9 个
  init 即失衡的测试屏蔽（testPathIgnorePatterns,随迁移修复）——全量 148/148 绿,
  "全量绿"恢复为有效回归信号
- 环境教训：OrbStack 可能随会话中断自动退出；api 在库死期间启动会留下坏连接池
  的僵尸进程（症状是"系统尚未初始化"403）,清杀重启即愈

## 前一迭代：agent-tool-protocol（2026-08-23 完成，agent-foundation 三处定位修正）

1. **工具是代码不是数据**：agent-tools 数据集合废弃。工具由业务模块在代码里
   声明（`i18n.agent-tools.ts` / `dictionary.agent-tools.ts`，声明跟着实现走），
   经 `GET /system/agent/tools` 聚合暴露；agent-service 从 provider 端点列表
   拉取（TOOL_PROVIDER_URLS，默认 optimus-api，将来业务方服务可加入）
2. **翻译单路径**：单轮批量翻译（translateMissing）删除，管理页"AI 补全"
   按钮底层改为提交 agent-service 任务——"不覆盖人工译文"收敛回
   writeTranslation 一处实现
3. **运营语义剥离**：基座 system prompt 只剩通用执行原则，业务人格由
   /run 的 system 字段注入（i18n 按钮注入翻译助理人格）；控制台页定位为
   业务消费方

按钮语义说明：补全的目标语言 = 表格现有语言列（补齐矩阵），引入全新语言
走智能助理自然语言任务或编辑弹窗手填第一条。

## 上一迭代：agent-foundation（2026-08-23 完成，已合 main）

独立 agent-service（ESM 8087，pi-agent-core 引擎+OneRouter 三条 compat 教训）；
introspect 鉴权 + token 透传（Agent 以发起人身份行动）；轨迹 jsonl+控制台回放；
端到端实测自主翻译 4 调用 10s 级；停机不影响平台（解耦实证）。
**遗留**：pi 事件订阅是防御性 any 读取（agent-framework 换壳时消化）；
run 同步等待 ≤5min；多 Agent 编排待接 agent-framework。

## 上一迭代：i18n-foundation（2026-08-23 完成，已合 main）

多语言平台能力：op_sys_i18n_entry 单表（namespace+key→{locale:文案}），管理页
（动态语言列+AI 补全只填缺失）、公开读（zh-CN 回退）、client-sdk I18nSDK。
踩坑：docker exec mysql 写中文必须 --default-character-set=utf8mb4。
**遗留**：内容变体多语言未做。（iframe 版翻译工作台已于菜单收敛时下线）

## 上一迭代：platform-base-sdk（2026-08-23 完成，已合 main）

三个薄接入面：introspect（外部后端验 token）、@optimus/client-sdk（C 端抽包）、
@optimus/server-sdk、iframe 嵌入协议（@optimus/admin-embed + IframeApp）。
examples/demo-activity 全流程验收过。
连带修复 database-initializer 两处 queryRunner 泄漏（池干涸→守卫误判未初始化→全站 403）。
**遗留**：introspect 限频是单进程内存桶；admin-embed 未发 npm。

## 数据库连接（2026-08-22 结论，重要）

- mysql2 已升 3.23.4，但 **idleTimeout/maxIdle 闲置回收不能开**：满池并发后回收
  不完整，之后再来并发整池挂死（复现：10 并发→闲置 80s→再 10 并发全超时）。
  结论与复现记录在 `pool-keepalive.service.ts` 头注释
- **连接池医生已回归**（探测+8s 硬超时+整池重建），dev 环境池活性由它兜底
- `nest --watch` + `keepConnectionAlive: true` 会让坏池跨热重启存活，池医生会在
  45-90s 内自愈；遇到 "Database check timeout" 先等一分钟再判断

## 上一迭代：dynamic-form-foundation（2026-08-21 完成，已合 main）

动态表单：schema 定义 → 渲染 → 免登录填报 → 数据落库；智能生成 schema 草稿可用。
**遗留项（上公网前必须做）**：公开填报接口目前只有 IP 限频 + 体积上限两道闸，
暴露到公网前要加验证码或一次性 token。

## 待拍板

（暂无）

## 已明确推迟（闭环前不碰）

- antd v4→v5 弃用 API 清理
- dashboard 统计数据源
- ~~无标注接口的"默认拒绝"收紧~~ **已完成（见下方 Completed）**
- RolesGuard（旧守卫）清理：权限判断逻辑整段被注释掉、等同永远放行，
  UnifiedAuthGuard 全局先执行使其无害但属废弃代码，找机会删除
- i18n-platform 迁移为内部模块（现阶段 iframe 引用）
- optimus-next 的 ComingSoon 文档页补全与文档搜索后端
- **GameWemade 收尾**（原 GAMEWEMADE_DEPENDENCY_REMOVAL_PLAN.md 的唯一未完成项，
  该方案已执行完，文档已删）：清掉 `packages/optimus-api/.env` 与 `.env.example`
  第 39-40 行的 `GAMEWEMADE_SDK_OPEN_KEY` / `GAMEWEMADE_SDK_CALLBACK_KEY`
  两个已废弃变量；顺带 `CLIENT_USER_SIGN_KEY`（.env.example:36）也已标注"旧版本兼容"
- **optimus-api 侧死代码清理**：`ClientUserAuthGuard`（HMAC 签名鉴权）在 optimus-api
  已无任何 `@UseGuards()` 调用点，只剩自己的 docstring——真实使用方是 partner-service
  且用的是它自己的装饰器。连带 `require-client-user-auth.decorator.ts` 一起评估删除
- **optimus-ui 迁移残留清理**：`src/pages/{partner,partner-management}`、
  `src/pages/external-task-review`、`src/pages/system/views/PartnerDataManagement.jsx`、
  `src/services/{AdminPartnerService,PartnerService,ExternalTaskService}.js` 均已无
  import 引用（唯一提及是 routes.js 的一行注释），属 extract-partner-service 计划中
  的待清理残留
- **`batchTransformUrls` 尾斜杠 bug**（整理 oss 组件文档时发现，未擅自改）：
  `optimus-next/src/components/oss/utils.ts:325` 直接用 `getCdnPrefix()` 的原始值做
  `.replace(OSS_FILE_PROXY, ...)`，而 `OSS_FILE_PROXY` 常量是 `/OSS_FILE_PROXY/`
  自带尾斜杠。同文件的 `OssImage.tsx:23-26` 有补尾斜杠的归一化，这里没有——
  env 配成 `https://cdn.example.com`（无尾斜杠，正是文档推荐写法）时会拼出
  `https://cdn.example.comimg1.jpg`。两处行为应统一
- **`orderNum` 是死字段**（同上，整理菜单文档时发现）：`optimus-ui` 的 `routes.js`
  和 `ConstantSiderMenus.jsx` 里**没有任何 sort**，菜单按数组顺序渲染，
  `orderNum` 完全不生效。要么实现排序，要么删掉这个字段
- **`@optimus/common` 未导出文件评估**：`constants/menus.js`、`utils/permission.js`、
  `utils/images.js`、`utils/transformTree.js`、`hooks/useMount.js` 在 `index.ts` 里的
  导出都是注释掉的，`dist/` 里也没有——包外 import 不到。菜单实际在 optimus-ui 的
  `routes.js`、权限实际是 `@Perm` 权限码，这些文件应该是能删的，删前确认一遍
- **测试 helper 表名过期**：`packages/optimus-api/test/utils/database-test.helper.ts`
  的 209/288/297/433 行仍硬编码 `sys_user`（应为 `op_sys_user`），会让依赖它的测试失败

## Completed

- [x] service-registry（服务目录：注册即接入，探测/菜单/工具统一事实源；demo-activity 零代码迁移实证）
- [x] service-ops（事件 outbox + 探测面板 + metrics-lite + dev:all；微服务生态调研结论存档于其 proposal）
- [x] 菜单收敛（下线翻译管理，多语言单入口）
- [x] 单测基线（public-article 修复 + 失衡测试屏蔽，全量 148/148 绿）
- [x] entity-schema-crud（schema 驱动数据集合：管理端 CRUD + C 端首页数据源切换，浏览器全流程验收通过）
- [x] optimus-next 闭环（认证单链路/DynamicContent/清理/隔离，全链路浏览器验收通过）
  - 遗留小项：ArticleSDK 双实现合并、profile 页用户ID `#` 占位、LoginForm caret-color hydration 警告
- [x] 权限码漂移修复（以 routes.js 为准，NewsArticles/ActivityArticles，seed SQL + 存量库同步改名）
- [x] mysql2 2.2.5 → 3.23.4（驱动现代化保留；idleTimeout 方案证伪，池医生回归）
- [x] harness-fe 运行时观测集成（optimus-ui，projectId=optimus-admin）
- [x] 数据库连接稳定性（容器域名直连，见 CLAUDE.md 启动要点 3）
- [x] 数据库失联不再误跳安装页（App.js）
- [x] extract-partner-service（第一个真实业务子服务迁移：partner/points-engine/
      external-task 拆出为独立 partner-service，验证服务目录+embed+introspect+
      API 代理这套基建；`verify-closed-loop.mjs` 33 项断言 + 全量单测 132+110 全绿）
  - 遗留小项：embed 端 React 集成胶水代码待抽进 `@optimus/admin-embed` 包

## harness-fe 上游待修（本项目已用显式配置绕过）

- `@harness-fe/react-jsx@4.0.0` 的 .d.ts 漏导出 JSX namespace，jsxImportSource
  下 TS 全量报错——本项目用 `src/types/harness-react-jsx.d.ts` augmentation 兜住
- webpack/next 插件注入的默认 mcpUrl 不带 `/ws` 路径，与 daemon WS 端点对不上，
  不显式配 mcpUrl 就静默连不上（runtime-client 自己的默认值反而是对的）

## 1. 落地前修复(在 optimus-api 里先做,验证后再随迁移带走)

- [x] 1.1 补 `op_biz_task_completion_log` 建表迁移脚本(不依赖 synchronize),在 optimus-api 里跑通,验证 dashboard 统计接口与外部任务审批接口不再 500
- [x] 1.2 删除 `partner.controller.ts` 里的 `update-mira`/`update-star`(已确认全局零调用方);删除前跑一次全量引用检查(`grep -rl "updateMira\|updateStar"`)兜底确认无遗漏调用方
- [x] 1.3 api 全量单测 + 手工验证两条曾 500 的路径,确认修复生效,提交这一小步(可独立于后续迁移先合 main)

## 1.5 补追加修复:C 端鉴权闭环(执行 2.4 端到端验证时发现,不能带着这个坑迁移)

验证服务目录/C 端代理分流时,拿真实浏览器 cookie 会话去调 `/profile` 页唯一的两个生产接口
(`GET /biz/partner/profile`、`GET /biz/points/me`),发现从写出来那天起就没被浏览器真正调通过——
代码上用的是 `@AllowAnonymous() + @UseGuards(ClientUserAuthGuard) + @RequireClientUserAuth()`,
这是给外部服务端调用方(`UserSource.WEMADE`)准备的 HMAC 签名鉴权,要求 `client-uid`/`client-sign`/
`client-timestamp` 三个头,签名要用共享密钥 `CLIENT_USER_SIGN_KEY` 算——前端代码里根本没有算
签名的逻辑,浏览器也不该拿到这个密钥去算。裸调实测直接 400 缺参数。真正的浏览器 cookie 鉴权
模式(`@ClientUserAuth()`,走 `clientAccessToken` httpOnly cookie)在 `client-user.controller.ts`
里本来就有、也在用,只是 partner/points-engine/external-task 这三个模块从头到尾没接对——
`UserSource.WEMADE` 在这三个模块里只当默认值出现,从未被任何业务逻辑当判别条件用,说明这从来
不是一个真被区分对待的外部身份,是复制粘贴挂错了守卫。

- [x] 1.5.1 partner.controller.ts(14 个)、points.controller.ts(3 个:me/notify/monthly-summary)、
  external-task.controller.ts(6 个)共 23 个端点,统一把
  `@AllowAnonymous()+@UseGuards(ClientUserAuthGuard)+@RequireClientUserAuth()` 换成
  `@ClientUserAuth()`——`req.clientUser.userId` 字段名和语义在两种模式下一致(均来自
  `ClientUserEntity.userId`),控制器方法体不用改一行;顺带清理三个文件里失效的
  `ClientUserAuthGuard`/`RequireClientUserAuth`/`AllowAnonymous`/`UseGuards` 引入和
  Swagger 文案里"需要 ClientUserAuthGuard 认证"的过时说明
- [x] 1.5.2 `op_biz_partner_profile.user_source` 默认值从 `wemade` 改回 `internal`(entity 注解 +
  `db/partner_profile_user_source_default.sql` 迁移脚本,已在 dev 库执行验证)——这个字段此后
  只会来自我们自己的 client-user 会话,继续默认 wemade 会让每条新数据都带错误来源标签
- [x] 1.5.3 端到端验证(真实注册+登录+join+profile+points,全部经过 `optimus-next` 的
  `/api/[...path]/route.ts` 代理,不是绕过代理直连后端):注册闭环用户→登录拿到
  `clientAccessToken` cookie→`POST /biz/partner/join`(201,自动触发注册任务积分事件)→
  `GET /biz/partner/profile` 显示 `totalMira:"300"`→`GET /biz/points/me` 显示
  `totalPoints:300` 且明细含 `REGISTER_V1` 事件——验证完删除了全部测试数据(client_user/
  partner_profile/task_completion_log 三张表清零)
- [x] 1.5.4 无 cookie 请求确认降级为清晰的 401(`Client user token not found`),不再是误导性的
  400 缺参数提示

## 2. 服务目录扩展:API 路径路由(C 端代理分流的前提)

- [x] 2.1 `ServiceRegistryService`(`ServiceEntry` 接口)新增可选字段 `apiPathPrefixes: string[]`,与既有 `pathPrefix`(zone 页面路由)是两个独立概念——一个服务可以两者都有、都没有,或只有其中一个。存储用 JSON 列(`op_sys_service_registry.api_path_prefixes`),唯一性(跨服务不重叠)下沉到应用层全表扫描校验,格式校验允许多段小写路径(如 `/biz/partner`),并挡掉 `/auth`、`/public`、`/login`、`/embed` 这几个 C 端代理自身占用的保留前缀
- [x] 2.2 新增消费视图 `listApiRoutes()`(结构参照 `listZoneRoutes()`:`{key, prefix, baseUrl}[]`,按 `apiPathPrefixes` 展开)
- [x] 2.3 新增匿名只读接口 `GET /api/public/api-routes`(独立控制器 `PublicApiRoutesController`,未复用 `PublicZoneRoutesController`——两张表语义不同,合并会让消费方搞不清该拉哪张;限频/匿名约定与 zone 路由那份一致)
- [x] 2.4 `optimus-next/src/app/api/[...path]/route.ts` 改造:抽出 `src/lib/api-route-directory.ts`(TTL/stale-while-revalidate 逻辑与 `proxy.ts` 同构但状态独立,因为中间件跑 edge、路由处理器跑 node,两边缓存不共享),命中前缀转发到对应服务 baseUrl(最长前缀匹配),未命中维持转发到 `OPTIMUS_API_URL` 的原有行为
- [x] 2.5 覆盖情况:optimus-api 侧 4 个新用例(格式校验/保留前缀/跨服务唯一性撞车/`listApiRoutes` 展平过滤)已并入 `service-registry.spec.ts`,21 个用例全绿。optimus-next 侧**未能补单测**——该包的 jest 完全没配 ts/next 转译,连仓库里唯一的既有测试文件(`oss.test.ts`)现在跑都跑不过(`Cannot use import statement outside a module`),是迁移前就存在、与本次改动无关的基建缺口,不在这次任务范围内顺手修。改用真实环境验证替代:起了个 dev server + 一次性回声后端,注册临时目录条目做端到端验证——命中前缀转发到测试后端(含验证 stale-while-revalidate 首次命中吃旧表、下一次请求才生效的真实行为)、未命中路径转发行为不受影响,验证后已删除测试目录条目和临时进程。**遗留待办:optimus-next 需要先有能跑的 jest 配置,才能真正把 2.5 的单测要求落地**,记入 8.10 一并回收

## 3. partner-service 骨架

- [x] 3.1 建 `packages/partner-service`(Nest 应用,参照 optimus-api 的 main.ts/app.module.ts 启动方式),端口 8089
- [x] 3.2 数据库连接配置(TypeORM,指向与 optimus-api 相同的 MySQL 实例,`synchronize:false`)——直接读 `DATABASE_*` 环境变量,没有引入 optimus-api 那套 yml+DB_* 映射层(新服务不需要那层历史包袱)
- [x] 3.3 实现 `IntrospectAuthGuard`:调 `POST {OPTIMUS_API_URL}/auth/introspect`,支持 admin/client 两种 type;本地实现 `@Perm`/`@AllowNoPerm`/`@RequireSuperAdmin`/`@ClientUserAuth`/`@AllowAnonymous` 五个装饰器(`src/shared/decorators/auth.decorators.ts`,照抄 optimus-api 对应装饰器的最小语义,不引入包依赖)与 fail-closed 判定逻辑;网络调用失败按未认证处理(不悄悄放行)
- [x] 3.4 暴露 `/health`/`/metrics-lite`(`health.controller.ts`,直接搬 optimus-api 的 `request-stats.ts`,同形实现)
- [x] 3.5 guard 单测:覆盖 spec 里列出的四个鉴权场景(超管放行/无权限码拒绝/未声明默认拒绝/token 失效 401)+ AllowNoPerm/RequireSuperAdmin/AllowAnonymous/网络失败降级等 8 个补充场景,共 12 个用例全绿。真实起服务验证过 `/health`、`/metrics-lite`、`/docs`(Swagger)均正常响应

## 4. 业务模块搬迁(双跑阶段,optimus-api 侧先不删)

- [x] 4.1 搬迁 partner 模块(controller/service/entity/DTO)到 partner-service,替换掉原来的 `UnifiedAuthGuard` 相关装饰器为新的本地装饰器,保持业务逻辑不变。实施中发现两处设计阶段没预料到的跨模块依赖(OSS 存储、短链服务),决策见 design.md 3.5 节:不整体复制,partner-service 走 HTTP 调 optimus-api 新增的 `client-upload`/`client-shorten` 两个口子(`shared/utils/optimus-api-client.ts`);顺带去掉了从未被实际调用过的 `UserModule` 依赖;系统级 `@OperationLog` 审计装饰器同样不随迁移复制(见 partner.controller.ts 头注释),`AdminOperationLogEntity`(partner 专属审计表)不受影响照常搬
- [x] 4.2 搬迁 points-engine 模块,points→partner 的 4 处只读调用保持进程内直接调用(不引入网络调用)
- [x] 4.3 搬迁 external-task 模块,`approveSubmission`→`processExternalTaskEvent` 的调用链保持进程内直接调用;`upload-proof` 改成 HTTP 调 optimus-api 的 `client-upload`(转发的是发起者自己的 clientAccessToken)
- [x] 4.4 `op_biz_task_completion_log` 的建表迁移脚本原样带到 `packages/partner-service/db/`,加了说明注释:dev 阶段两边共用一个库,这张表的迁移只需要执行一次,放一份在这里是为了 schema 归属跟着实体定义走
- [ ] 4.5 partner-service 自己实现管理页(合伙人列表/团队/冻结解冻/渠道、积分调试页、外部任务审核列表),复用既有 `EmbedFrame`/`@optimus/admin-embed` 握手协议,不改协议本身——留到第 5 组服务目录接入时一起做,管理页需要先有 embed 入口才有意义单独验证

**4.1-4.4 完成后的真实端到端验证**(全部通过独立的 partner-service 进程,port 8089,optimus-api 侧代码原样未动):
- 全量单测:9 个存量已知失败测试(和 optimus-api 里屏蔽的是同一批,不是本次新增)用同样的 `testPathIgnorePatterns` 处理,其余 4 个套件(points-cache/points.service/hierarchy.service.circular/新增的 introspect-auth.guard)37 个用例全绿;`nest build` 产物验证通过
- 真实业务闭环(client-user 注册登录→拿 optimus-api 签发的 cookie→直接打 partner-service 的 8089 端口):join(触发注册积分事件)→profile(totalMira 正确)→points/me(totalPoints 正确)→submit 外部任务→admin 审核通过(触发 processExternalTaskEvent 写积分事件)→points/me 再次查询确认积分正确累加(300+2000=2300)
- 曾经 500 的 `GET /biz/partner/admin/dashboard` 在 partner-service 里返回正确的聚合统计(总合伙人数/活跃数/积分发放总额等)
- 验证后清理了全部测试数据(client_user/partner_profile/task_completion_log/external_task_submission 四张表)

## 5. 服务目录接入与验证分流(必须在这一步验证通过后才能进入第 6 步删除)

- [x] 5.1 服务目录新增 partner-service 条目:`entryType=embed` + `apiPathPrefixes: ["/biz/partner", "/biz/points", "/external-task"]`,`healthPath`/`metricsPath` 按 3.4 的实现填,`toolsPath` 留空(已确认当前无 agent 工具声明)。登记后经真实 `optimus-next` C 端代理(不是直连 8089)验证过:`GET /api/public/api-routes` 确认三个前缀都指向 partner-service,未登录请求返回 partner-service 自身的 `IntrospectAuthGuard` 错误文案(证明是真路由生效,不是巧合落到 optimus-api),登录后 join/profile/points 全链路经代理走通
- [x] 5.2 `optimus-ui` 里原 partner-admin/points/external-task-admin 相关的静态路由节点下线,菜单改走动态 embed 入口。**用户拍板选了方向 (c):embed 页从零构建 vanilla JS 换成真正的 React 应用**,这也是"服务目录 + embed iframe"这套基座第一次真实承载一个 React 子应用(此前唯一的 embed 先例 `examples/demo-activity` 本身也是 vanilla JS,不是 React,谈不上验证过)。
  - 新建 `packages/partner-service/admin-app/`(独立 Vite + React 18 + antd 5.12 项目,不接入 pnpm workspace——它是自包含的构建产物,没有必要和其它包共享依赖解析),构建产物落到 `../public/admin`(main.ts 的 `useStaticAssets` 无需改动)
  - 从 optimus-ui 搬迁 `pages/partner/{PartnerList,PartnerDetail}.jsx` + `components/{TeamMembers,PointsHistory,ChannelList,TaskLogs,InviteTaskAnalysis}.jsx` + `pages/external-task-review/{index.jsx,ReviewModal.jsx}`,业务逻辑/UI 结构原样保留,只改了:import 路径、`AdminPartnerService`/`ExternalTaskService` 两个 service 改造成打 partner-service 自己的接口(URL 本身没变,原 `@Controller` 路径搬迁时没改)、鉴权从 optimus-ui 的 axios+localStorage token 换成 `@optimus/admin-embed` 握手拿到的短期 token(新建 `useEmbedAuth` hook 包一层 UMD SDK)、`request.js` 照抄 optimus-ui 的响应归一化逻辑(兼容 `{code}`/`{success}` 两种后端形状)使搬过来的组件不用改判断逻辑、`getFullFileUrl` 改成打 optimus-api 自己的 origin(OSS 文件仍是平台能力,不随迁移,见 design.md 3.5)
  - `pages/partner/Dashboard.jsx`(104 行)搬迁时发现是从未被任何路由引用的死代码(全局 grep 确认零 import),未搬——不是遗漏,是有意不复制不可达代码
  - `/sys/partner-data`(合伙人数据管理)页面的两个按钮(刷新缓存/清空所有数据)和 `PartnerList.jsx` 工具栏里的同名按钮逻辑完全重复(两处调用同一对 `AdminPartnerService` 方法),新 App 里没有为它单独建第三个 tab,直接复用 `PartnerList` 已有入口——不是漏做,是不复制一个字面重复的页面
  - 两个原静态路由节点(`partner_management`、`external_task_review`)在 `routes.js` 里已删除;`partner_data_management`(`/sys/partner-data`,系统管理下)也一并删除,原因同上条
  - 真实浏览器端到端验证通过(用全新测试账号 reactembedtest3/partnerId 7):页面整体渲染正常、合伙人列表显示数据、详情抽屉 6 个 tab 齐全(基本信息含合伙人编号/星级/累计积分等)、冻结→解冻走通、外部任务审核 4 个统计卡片正确、提交记录列表显示正常、详情弹窗显示正常(凭证图片因为是假 URL 加载失败,符合预期)、审核通过后积分正确发放(2000 MIRA)且统计卡片实时更新。验证中发现两处**非本次迁移引入的、优先于本次改动已经存在的**展示细节,记录但未处理:①外部任务审核列表的"合伙人编号"列固定显示"-"——`external-task.service.ts` 的 `getSubmissions()`(原样从 optimus-api 搬来,业务逻辑未改)从未在列表查询里 join/回填 partner 信息,列定义从写出来那天起就是读一个不存在的字段,详情弹窗单独查询能拿到正确值所以那里显示正常;②合伙人列表表格设置了 `scroll={{x:1600}}`,自动化浏览器操作横向滚动未必能触发,已确认不是真实缺失:源码里 `columns` 数组本来就含"加入时间"/"备注"两列(和 optimus-ui 原版逐字一致)、构建产物里 grep 能命中这两个字符串、截图里可见的 8 列位置和顺序与预期完全吻合(正是 1600px 表格在 ~1440px 视口下按列顺序截断的结果)——DOM 级别的二次核实因为 iframe 跨域(基座页面访问 `iframe.contentWindow.document` 触发浏览器同源策略拒绝,这是预期内的安全边界)和一次误操作(直接导航到裸的 `localhost:8089/admin/` 导致该 tab 失去 harness-fe 远程控制连接,已手动导航回 embed 页恢复)没能走通,但源码+构建产物+截图三方印证已经足够确认这不是真实回归,不再追加验证成本
- [x] 5.3 浏览器验证:登录一个真实合伙人账号打开 `/profile` 页,确认"合伙人状态"与"积分概览"两张卡片正常显示(证明 C 端代理分流生效、经 introspect 鉴权的调用链路走通)。**验证中发现并修复了一个独立的前端字段映射 bug**(与迁移本身无关,是这两个接口第一次被浏览器真正调通才暴露出来的存量缺陷):`page.tsx` 的 `Partner`/`Points`/`User` 三个 TS 接口是按一套从未存在过的假想响应形状写的——`partner.partnerNo` 应为 `partner.partnerCode`,`partner.starLevel`(假想的数字星数)应为 `partner.currentStar`(真实是字符串枚举 NEW/S1.../LEGEND),`points.currentPoints` 应为 `points.totalPoints`,`points.totalEarned`/`totalSpent`/`frozenPoints` 三个字段在后端从未实现过(`points-engine/README.md` 明确把积分消耗/冻结列为未完成项,这套账本目前只有"发放"没有"消耗"),`user.id` 应为 `user.userId`。修复后用一个全新注册的测试账号(profilecheck2)端到端验证:join→profile→points/me 全部通过真实代理走通,浏览器截图确认合伙人编号"LP957050"、星级"新人"、团队名称"渲染验证队"、当前积分"300"、用户ID"#12"均正确渲染,测试数据已清理
- [x] 5.4 浏览器验证管理端:embed 页能操作合伙人列表/冻结解冻/外部任务审核。**验证中发现并修复了两个独立的、从 optimus-api 原样带过来的存量 bug**(两处在 optimus-api 原代码里同样存在,确认不是迁移引入的,只是此前这几个管理台操作从未被真实点击过所以从未暴露):
  1. `partner.service.ts`/`channel.service.ts`/`hierarchy.service.ts`/`statistics.service.ts` 里十几处原生 SQL 引用 `biz_partner_hierarchy`/`biz_partner_channel`/`biz_partner_profile`/`biz_task_completion_log` 四张表时全部漏写了 `op_` 前缀(实体声明的真实表名都带 `op_`),导致合伙人列表接口(`GET .../admin/partners`,依赖里面算 L2 下线数的原生 SQL)必然 500——这正是之前"合伙人列表"表格渲染出来是空的根因,不是权限或前端 bug
  2. `AdminOperationLogEntity`(`op_biz_partner_admin_log`,冻结/解冻等敏感操作的审计表)和最初 `op_biz_task_completion_log` 一样,只在代码里定义过,从未有配套建表脚本——冻结/解冻接口的状态更新本身能成功,但紧接着写审计日志失败导致整个请求抛 500,新增 `db/partner_admin_log_table.sql` 补上
  两处都已在 dev 库验证:合伙人列表正确返回数据(含 L1/L2 下线数),冻结→解冻→外部任务驳回全部通过真实 embed 页面点击验证成功,审计表也正确写入了操作记录

## 6. 收尾:确认分流生效后删除 optimus-api 侧代码

删除前先写了一版自动化闭环验证脚本(`packages/partner-service/scripts/verify-closed-loop.mjs`,
`npm run verify:closed-loop`),打真实运行中的 optimus-api:8084/optimus-next:8086 C 端代理/
partner-service:8089 三个进程(不是 optimus-api 自带那套拉起独立进程+隔离库的 e2e 框架——
那套只测单服务,测不出跨服务代理分流是否真的接通)。20 项断言(C 端全程走真实代理的
注册→登录→加入→查档案→查积分→提交任务;管理端直连的合伙人列表+L1/L2统计→冻结→
解冻→审核通过→积分发放→dashboard 统计;管理端操作后 C 端账本同步的交叉验证)删除前
全绿,确认闭环已经打通,可以进入删除。

- [x] 6.1 optimus-api 里对应的 `src/business/{partner,points-engine,external-task}` 目录整体删除(`git rm`,308K+192K+112K),`app.module.ts` 移除对应 import 和模块注册。删除前 grep 确认除 `app.module.ts` 外没有其它文件引用这三个目录,删除后 `tsc --noEmit` 零新增错误(残留的几个 spec 文件类型错误是无关的存量问题:`sensitive-word-validation` 装饰器测试、OSS 测试 helper 缺方法,和本次迁移无关)、`nest build` 干净、`npm test` 12 个套件 132 个用例全绿
- [x] 6.2 `jest.unit.config.js` 移除这三个模块相关的 9 条 `testPathIgnorePatterns` 和对应的 2 条 `testMatch`(`**/partner/**/*.spec.ts`、`**/points-engine/**/*.spec.ts`)——源码已经不在这边,继续留着这些模式没有意义
- [x] 6.3 删除后重跑 `verify:closed-loop` 脚本,20 项断言依然全绿;并直接 curl 验证 `GET /api/biz/partner/profile`、`GET /api/biz/points/me` 打 optimus-api 自己现在返回 404(真的没有这些路由了),证明能用完全是代理分流生效,不是"恰好 optimus-api 还没删所以能用"

## 7. 存量单测迁移

这 9 个测试文件本身已经随源码一起搬到了 partner-service(6.1 删除 optimus-api 侧代码时,
新服务里早就有对应文件了,只是一直被 `testPathIgnorePatterns` 屏蔽,没跑起来),这一步
是逐个摘掉屏蔽、诊断失败原因、修好它。用 `/tmp/jest-all.config.json`(绕开
`testPathIgnorePatterns` 的临时 jest 配置)逐个跑,确认修好后再从正式屏蔽清单里摘掉。

9 个文件分三类问题,和 7.1 原定的判断标准完全对应:

**(a) 纯 DI mock 过期(构造函数加了新依赖,测试模块没跟上)**——4 个文件:
`statistics.service.spec.ts`、`channel.service.spec.ts`、`hierarchy.service.spec.ts`、
`partner.service.spec.ts`、`partner-team-name-validation.spec.ts` 都命中同一个模式:
`PartnerService`/`ChannelService`/`StatisticsService` 后来都加了
`TaskCompletionLogEntity` 仓库和 `PointsService`/`PointsCacheService` 依赖(用于渠道页
统计推广效果、合伙人详情页展示积分),测试模块的 `providers` 数组只有旧的依赖列表,
NestJS DI 直接报"Nest can't resolve dependencies"。补对应的 mock provider 即可,不改
被测代码。

**(b) mock 对象本身缺方法,被防御性 try/catch 伪装成业务异常**——`hierarchy.service.spec.ts`
单独多一层:`createRelationship` 后来在最前面加了 `checkCircularReference()`,内部用原生
SQL(`hierarchyRepository.query(...)`)而不是 `findOne`,mock 对象没定义 `.query`,调用
直接抛 `TypeError`,又被 `checkCircularReference` 自己"查询失败就当作有循环,保守起见拒绝"
的容错逻辑吞掉——这个容错在生产环境是对的(宁可误报也不能漏判循环引用导致死循环),
但在测试里把一个"忘记补 mock"的低级问题伪装成了"业务逻辑说检测到循环引用"的高级问题,
一路把 9 个用例全部拦在 `CircularReferenceException` 上。补 `query: jest.fn().mockResolvedValue([])`
即可,不动生产代码的容错逻辑。

**(c) 测试断言的是从未实现过的功能,需要重写**——2 处:
1. `partner.service.spec.ts` 的 `joinPartner` 测试组导入了一个从未被真实 DTO 导出过的
   `JoinMode` 枚举(`{mode: JoinMode.SELF}` / `{mode: JoinMode.INVITE}`),真实行为是按
   `inviterCode` 是否传入来分支,不存在 `mode` 字段这个概念。重写测试场景改用真实 DTO 形状。
2. `partner-team-name-validation.spec.ts` 整个文件测的是"团队名称敏感词过滤",引用一个
   在 partner-service 里根本不存在的 `../../../shared/services/validation.service`——
   查 `partner.service.ts` 才发现这个功能是被主动删掉的(源码里留着注释
   "ValidationService removed - game-specific sensitive word checking"),
   `validateTeamName` 现在只做两件事:查重名(`DuplicateTeamNameException`)、一次性锁定
   (`TeamNameImmutableException`,团队名称设置过就不能再改,这是比敏感词过滤更晚加的
   业务规则,原测试完全没考虑到)。整份重写,测真实存在的这两条规则。

**(d) 测试断言应该存在但代码没做到位的行为,是真 bug,修代码**——1 处:
`statistics.service.spec.ts` 的"应该正确按层级过滤"用例发现 `getTeamMembers(partnerId, depth, ...)`
方法签名接受 `depth: 1|2` 参数,但查询里硬编码写死了 `level: 1`,完全没用 `depth` 变量——
也就是说真实的 C 端接口 `GET /biz/partner/team?depth=2`(以及管理端"二级下线"这个 tab)
从上线起就一直只返回一级数据,`depth=2` 参数被静默忽略。改成 `level: depth`。

**(e) 测试断言的字段/参数值和当前签名不匹配,但不是真 bug,是加了字段忘记同步**——
2 处:
1. `invite-task.handler.ts` 的重复奖励查询后来从"按 taskType 查"改成了"按 taskCode 查"
   (代码里有注释"✅ 使用 taskCode 而不是 taskType"——同一个 taskType 下可以有多个
   taskCode 的邀请任务分别计次,比如"邀请1人"和"邀请5人",按 taskType 查会把它们
   混判为同一个已奖励记录),测试断言的 `findOne` 调用参数还停在旧版本,改成按
   `taskCode` 断言。
2. `partner.service.spec.ts` 的 `createProfile` 用例期望的 `create()` 调用参数比真实
   调用少了 `userId`/`username`/`teamName`/`extraData` 几个字段——这几个字段是本次会话
   前面做鉴权改造时加的 `userId`/`uid` 双写兼容字段的连带产物,补全期望值即可。

另外 3 个 points-engine 的 handler/service 测试文件(`game-action-task.handler.spec.ts`、
`register-task.handler.spec.ts`、`point-rule.service.spec.ts`)属于纯技术性问题:
`ITaskHandler.handle()` 后来统一加了第二个 `config: TaskConfig` 参数(读取
`config.maxCompletionCount` 做次数上限校验,`config.taskCode` 做去重查询),三个 handler
的测试都还停在只传一个 event 参数的旧签名,TS 编译直接报参数数量不对;
`point-rule.service.spec.ts` 是纯粹的 TypeScript 类型收窄问题(`const rule = {type: FIXED, value: 100}`
被推断成 `{type: PointRuleType, value: number}` 而不是判别联合类型的字面量成员,不能赋值给
`PointRule` 联合类型),补上 `FixedPointRule`/`PerAmountPointRule` 的显式类型标注即可,
不涉及任何行为变化。补齐 `config` 参数、加 `TaskCompletionLogEntity` 仓库的 mock 后三个
handler 测试全部通过,顺带给 `register-task`/`game-action-task`/`invite-task` 各补了一条
"达到次数上限应该拒绝"的新用例,覆盖之前完全没测到的 `maxCompletionCount` 分支。

- [x] 7.1 9 个屏蔽测试文件逐个诊断修复:4 处 DI mock 过期补 mock、1 处 mock 缺方法补 mock、
      2 处测试从未实现过的功能重写(JoinMode、团队名称敏感词校验→改测重名+一次性锁定)、
      1 处真实现 bug 修代码(`getTeamMembers` 的 `depth` 参数被硬编码 `level:1` 忽略)、
      2 处字段/参数值随真实签名同步(`invite-task` 按 taskCode 查重、`createProfile` 补全
      双写字段)、3 处 `handle(event, config)` 签名漂移和一处纯类型标注问题。全部不改动
      与本次诊断无关的其它行为
- [x] 7.2 `package.json` 的 `testPathIgnorePatterns` 从 10 条(1 条 node_modules + 9 条业务
      屏蔽)精简为只剩 `["/node_modules/"]`;`npm test` 跑真实配置(非临时的
      `/tmp/jest-all.config.json`),13 个套件 110 个用例全绿;`tsc --noEmit` 零错误;
      修复后重跑一遍 `verify:closed-loop`,20 项闭环断言依然全部通过,确认这批测试修复
      没有意外改动任何真实行为

## 8. 验收

功能等价性:
- [ ] 8.1 合伙人列表/详情/团队/冻结解冻/改备注/渠道管理,经 embed 页操作与迁移前行为一致
- [ ] 8.2 积分查询(管理端查任意人 + C 端查自己)结果与迁移前一致
- [ ] 8.3 外部任务提交/审核通过/驳回流程走通,审核通过后积分账本正确更新
- [ ] 8.4 曾经 500 的两条路径(dashboard 统计、外部任务审批)在新服务里正常返回
- [ ] 8.5 `/profile` 页真实生产功能(合伙人状态卡片、积分概览卡片)迁移前后行为一致,不回归

微服务基建可用性验证(本次迁移的另一半目的,不是功能测完就算完):
- [ ] 8.6 embed 动态菜单接入体验记录:从"登记服务目录条目"到"管理端能点进去用"之间,是否需要额外的手工步骤或代码改动,如果需要,记录下来作为基建的待改进项
- [ ] 8.7 introspect 鉴权模式在真实业务接口(不只是 demo)上验证:记录实际感知到的延迟量级,判断是否需要短 TTL 缓存(design.md 里的 open risk,用真实数据回答而不是猜测)
- [ ] 8.8 C 端 API 代理的多后端路由(本次新加的能力):记录接入体验,和 zone 页面路由那套做对比,判断是否应该合并成一套通用实现,还是两套各自独立更清晰
- [ ] 8.9 探测面板正确显示 partner-service 健康状态,延迟数值合理
- [ ] 8.10 从这次迁移的实际耗时和踩坑记录,判断"服务目录+embed+introspect+API 路由分流"这套组合对下一个真实业务模块迁移是否已经好用,还是需要先补哪些基建缺口——写入 TASKS.md 收尾

- [ ] 8.11 api + partner-service 全量单测跑绿,提交合 main、推送

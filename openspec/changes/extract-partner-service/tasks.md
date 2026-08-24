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

- [ ] 3.1 建 `packages/partner-service`(Nest 应用,参照 optimus-api 的 main.ts/app.module.ts 启动方式),端口 8089
- [ ] 3.2 数据库连接配置(TypeORM,指向与 optimus-api 相同的 MySQL 实例,`synchronize:false`)
- [ ] 3.3 实现 `IntrospectAuthGuard`:调 `POST {OPTIMUS_API_URL}/auth/introspect`,支持 admin/client 两种 type;本地实现 `@Perm`/`@AllowNoPerm`/`@RequireSuperAdmin` 三个装饰器(照抄 optimus-api 对应装饰器的最小实现,不引入包依赖)与 fail-closed 判定逻辑
- [ ] 3.4 暴露 `healthPath`/`metricsPath`(参照 agent-service 的 `/metrics-lite` 与 optimus-api 的 request-stats 同形实现)
- [ ] 3.5 guard 单测:覆盖 spec 里列出的四个鉴权场景(超管放行/无权限码拒绝/未声明默认拒绝/token 失效 401)

## 4. 业务模块搬迁(双跑阶段,optimus-api 侧先不删)

- [ ] 4.1 搬迁 partner 模块(controller/service/entity/DTO)到 partner-service,替换掉原来的 `UnifiedAuthGuard` 相关装饰器为新的本地装饰器,保持业务逻辑不变
- [ ] 4.2 搬迁 points-engine 模块,points→partner 的 4 处只读调用保持进程内直接调用(不引入网络调用)
- [ ] 4.3 搬迁 external-task 模块,`approveSubmission`→`processExternalTaskEvent` 的调用链保持进程内直接调用
- [ ] 4.4 `op_biz_task_completion_log` 的建表迁移脚本原样带到 partner-service(与 1.1 的脚本保持一致或复用同一份)
- [ ] 4.5 partner-service 自己实现管理页(合伙人列表/团队/冻结解冻/渠道、积分调试页、外部任务审核列表),复用既有 `EmbedFrame`/`@optimus/admin-embed` 握手协议,不改协议本身

## 5. 服务目录接入与验证分流(必须在这一步验证通过后才能进入第 6 步删除)

- [ ] 5.1 服务目录新增 partner-service 条目:`entryType=embed` + `apiPathPrefixes: ["/biz/partner", "/biz/points", "/external-task"]`,`healthPath`/`metricsPath` 按 3.4 的实现填,`toolsPath` 留空(已确认当前无 agent 工具声明)
- [ ] 5.2 `optimus-ui` 里原 partner-admin/points/external-task-admin 相关的静态路由节点下线,菜单改走动态 embed 入口(参照 demo-activity 迁移时 routes.js 的改法)
- [ ] 5.3 浏览器验证:登录一个真实合伙人账号打开 `/profile` 页,确认"合伙人状态"与"积分概览"两张卡片正常显示(证明 C 端代理分流生效、经 introspect 鉴权的调用链路走通)
- [ ] 5.4 浏览器验证管理端:embed 页能操作合伙人列表/冻结解冻/外部任务审核

## 6. 收尾:确认分流生效后删除 optimus-api 侧代码

- [ ] 6.1 optimus-api 里对应的 `src/business/{partner,points-engine,external-task}` 目录整体删除,`app.module.ts` 移除对应模块引用
- [ ] 6.2 `jest.unit.config.js` 移除这三个模块相关的 `testPathIgnorePatterns` 条目
- [ ] 6.3 删除后重跑一次 5.3/5.4 的浏览器验证,确认代理分流(而不是"恰好 optimus-api 还没删所以能用")才是让 C 端工作的真正原因

## 7. 存量单测迁移

- [ ] 7.1 把 jest.unit.config.js 屏蔽清单里的 9 个 partner/points-engine 测试文件搬到 partner-service,逐个诊断:测试断言的是从未实现过的功能(如 JoinMode)则修正断言以匹配真实行为并记录说明;测试断言的是应该存在但代码没做到位的行为则修代码
- [ ] 7.2 partner-service 全量单测跑绿

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

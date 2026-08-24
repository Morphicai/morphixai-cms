## 1. 落地前修复(在 optimus-api 里先做,验证后再随迁移带走)

- [ ] 1.1 补 `op_biz_task_completion_log` 建表迁移脚本(不依赖 synchronize),在 optimus-api 里跑通,验证 dashboard 统计接口与外部任务审批接口不再 500
- [ ] 1.2 删除 `partner.controller.ts` 里的 `update-mira`/`update-star`(已确认全局零调用方);删除前跑一次全量引用检查(`grep -rl "updateMira\|updateStar"`)兜底确认无遗漏调用方
- [ ] 1.3 api 全量单测 + 手工验证两条曾 500 的路径,确认修复生效,提交这一小步(可独立于后续迁移先合 main)

## 2. 服务目录扩展:API 路径路由(C 端代理分流的前提)

- [ ] 2.1 `ServiceRegistryService`(`ServiceEntry` 接口)新增可选字段 `apiPathPrefixes: string[]`,与既有 `pathPrefix`(zone 页面路由)是两个独立概念——一个服务可以两者都有、都没有,或只有其中一个
- [ ] 2.2 新增消费视图 `listApiRoutes()`(结构参照 `listZoneRoutes()`:`{key, prefix, baseUrl}[]`,按 `apiPathPrefixes` 展开)
- [ ] 2.3 新增匿名只读接口 `GET /api/public/api-routes`(参照 `public-zone-routes.controller.ts` 的限频/匿名约定)
- [ ] 2.4 `optimus-next/src/app/api/[...path]/route.ts` 改造:按 60s TTL 拉这份路由表(逻辑参照 `proxy.ts` 里的 `getZoneRoutes`/`matchZone`,可直接复制一份同构实现),命中前缀转发到对应服务 baseUrl,未命中维持转发到 `OPTIMUS_API_URL` 的原有行为
- [ ] 2.5 单测覆盖:新前缀匹配逻辑、目录不可达时的降级行为(沿用旧表/维持原有转发,不阻断代理)

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

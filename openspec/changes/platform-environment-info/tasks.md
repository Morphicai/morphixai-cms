## 1. 接口实现

- [x] 1.1 新增 `GET /api/environment`（`system/environment/`：controller + service + module）。
      匿名 + IP 限频 120 次/分，与 `public-i18n.controller.ts` 同款内存桶。
      返回 `{environment, rootDomain, cookieDomain}`
      > 路由用 `@Controller("environment")` 而非照抄 `public-i18n` 的
      > `@Controller("api/i18n")`——全局前缀已是 `/api`（`app.prefix`），
      > 后者实际会得到 `/api/api/i18n`
- [x] 1.2 确认配置值均已存在，**不新增任何配置项**。核实过程中发现两件事，
      与任务原本的假设不同，已按事实实现：
      - **`SITE_DOMAIN` 有两条读取路径且取值不一致**：config yml 的正式条目
        `app.file.domain: ${SITE_DOMAIN:http://localhost:8084}`（**带默认值**），
        与 `oss.controller.ts` 直接读的裸 `process.env.SITE_DOMAIN`（没配就是空）。
        本接口以配置系统的正式条目为准并回落裸环境变量——对外契约需要一个可用的
        非空值，消费方要拿它拼绝对 URL
      - **`COOKIE_DOMAIN` 只存在于环境变量**（yml 无对应条目），且**留空是本地开发
        的正确状态而非漏配**：host-only cookie 才能被 localhost 接收，配了域名反而
        被浏览器拒收（`.env.example` 已有说明）。因此不做任何填充
      - `NODE_ENV` 的原始取值（`development`/`production`/`e2e`…）经
        `normalizeEnvironment` 收敛为 `dev`/`test`/`staging`/`prod` 四个稳定对外名字。
        **不认识的值一律归 `prod`**：判错方向的代价不对称——把生产误判成开发，
        消费方可能放宽 cookie 域或打开调试出口

## 2. 验收

- [x] 2.1 单测 13 例，覆盖 spec 的两个场景并补足边界：
      环境名映射（含大小写/空格/未知值）、根域名两条路径的优先级与回落、
      cookieDomain 留空、未配置返回空串而非 `undefined`（消费方多做字符串拼接，
      `undefined` 会拼出 `undefined/path`）、**只读不泄露其它配置项**、
      限频 429、限频按 IP 隔离、缺 `req.ip` 不抛错
- [x] 2.2 真实环境验证（api:8084，dev）：`GET /api/environment` 返回
      `{"environment":"dev","rootDomain":"http://localhost:8084","cookieDomain":""}`。
      `rootDomain` 与 dev.yml 里 `app.file.domain` 实际生效的值一致；
      `cookieDomain` 空与 `client-user.controller.ts` 签发 cookie 时读到的一致。
      > 首次实现用 `config.get("SITE_DOMAIN")` 拿到的是空值——yml 里的键是
      > `app.file.domain`，不是 `SITE_DOMAIN`。真实请求才暴露出来，已修正
- [x] 2.3 api 全量单测 168/168 绿（新增 13 例）；
      `tsc --noEmit -p tsconfig.build.json` 零错误；提交、合 main
      > 顺带修了一处会持续埋坑的配置：`jest.unit.config.js` 的 `testMatch` 是
      > **显式白名单**，新模块不加进去测试写了也不会被执行。已加
      > `**/environment/**/*.spec.ts` 并在配置里注明这一点——
      > 这也是 `test/` 目录里过期表名长期没被发现的原因之一

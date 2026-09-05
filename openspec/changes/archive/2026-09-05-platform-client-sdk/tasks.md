## 1. `@optimus/platform-client` 包骨架

- [x] 1.1 建 `packages/platform-client`（workspace 包，参照 `server-sdk` 的结构：
      零运行时依赖、`node --test` 跑 dist）
      > **没有依赖 `@optimus/server-sdk`，与 design.md 的原计划相反。** 核实后发现
      > 本包封装的三个能力里，上传与短链都要求 `@ClientUserAuth()`（发起请求那个
      > **用户**的 clientAccessToken），环境信息是匿名口——**没有一个吃 service
      > token**。为"看起来分层正确"加一个当前用不上的运行时依赖不值得。
      > 等出现按 grant 授权的服务身份接口时再加，且首选由消费方把 `server-sdk`
      > 签好的 token 传进来，而不是本包反向依赖它
- [x] 1.2 OSS 上传封装 `uploadFile()`，对齐 `/files/client-upload` 契约。
      三处契约细节是读源码才知道、消费方不该自己踩的：
      - **`needThumbnail` 只在 true 时发送**。平台 DTO 是 `@Type(() => Boolean)`，
        而 multipart 值一律是字符串，`Boolean("false") === true`——传 `false` 会被
        反向解读成"要缩略图"。**省略是表达 false 的唯一安全方式**
      - 响应字段名不一致：`thumbnail_url`（entity 属性本身就是蛇形）、`type` 是
        mimeType。SDK 统一归一成驼峰，另留 `raw` 兜底
      - 未传的可选参数一律不进表单，避免被平台按 0 解读；但 `width: 0` 这种显式
        假值仍然发送
- [x] 1.3 短链封装 `createShortLink()`，对齐 `/system/short-link/client-shorten`
      > **返回的是站点根相对路径 `/public/short-link/resolve/<token>`，不是绝对
      > URL**——spec 原文写的"完整 URL"与平台实际返回不符，已按事实修正 spec。
      > SDK 刻意不替消费方拼域名：拼错域名的短链比没有短链更糟，而该用哪个域名
      > 取决于分发渠道（站内/短信/二维码），只有消费方知道

## 2. 依赖能力就绪后补充

- [x] 2.1 `getEnvironment()`，封装 ② `platform-environment-info` 的 `/environment`。
      结果按 TTL 缓存（默认 5min，0 关闭）——部署环境在进程生命周期内不变。
      认不出的环境名归 `prod`，与平台侧 `normalizeEnvironment` 同方向
- [x] 2.2 `server-sdk` 的 service token 支持**在 `platform-trust-model` 里已完成**，
      本次只做核对：`getServiceToken()` / `verifyServiceToken()` / `hasGrant()`
      均已存在且与用户 token 委托模式并列。无需改动

## 3. CI 强约束

- [x] 3.1 `scripts/check-sdk-usage.mjs` + 根 `pnpm check:sdk-usage` +
      `.github/workflows/sdk-usage.yml`。**两条规则**：裸写 HTTP 调平台接口；
      跨业务域 `@InjectRepository` 别人的 entity
      > 第二条是归档后补的（同日）：③ 的 DoD 原文点名了"裸写 `/auth/introspect`、
      > **跨业务 `@InjectRepository`**"两类，我第一版只做了前者就归档，**DoD 并未
      > 满足**。判据是 import 来源路径落在另一个 `business/<domain>/` 下；包名/
      > 路径别名导入无法可靠归属，宁可漏报也不制造假阳性。
      > 第三条禁令（原生 SQL 跨表 JOIN）要 SQL 级分析，仍靠评审
      > **本仓库此前没有任何 CI**（`.github/` 不存在），这是第一条流水线。刻意只放
      > 这一个零依赖检查，不顺手把 lint/test 塞进来——那些要装依赖，是另一件事。
      > 也就是说：在这个 workflow 被推上去并启用之前，约束只在本地有效
      > 扫描范围用**反向名单**：列出"平台自己"的目录（optimus-api / 两个 SDK /
      > client-sdk / optimus-ui / optimus-next）排除掉，**没列的一律在范围内**——
      > 新拆的业务服务自动被覆盖，不需要谁记得回来加一行
- [x] 3.2 只查 diff 的**新增行**（`git diff --unified=0 <base>...HEAD`），存量违规
      不追溯。已验证：增量扫描对 partner-service / zone-activity 的存量调用零命中
      > base 定不出来时**退回全量扫描**而不是静默放行；GitHub 在新建分支/首次推送
      > 时给的全零 sha 已单独识别为无效 ref
- [x] 3.3 `ARCHITECTURE.md` 的接入清单改成"新服务上线验收必过项"表格，含 SDK 使用、
      trustLevel/grants 登记、三方服务库隔离、探测端点四项
      > 顺手修正两处失实：① 清单里把 `platform-client` 的能力写成含"按 uid 查用户
      > 资料"，**平台侧根本没有这个接口**（`client-user` 只有自查的 profile/me），
      > 已拆成单独一行标 ⏳；② 原文写"③ 要把这三条做成 CI 静态扫描"，实际只有
      > 第 3 条（裸写 HTTP）能做正则检查，前两条（跨业务注入 entity、跨表 JOIN）
      > 要 AST/SQL 级分析，仍靠评审。别把"有一条 CI 规则"读成"三条都拦住了"

## 4. 验收

- [x] 4.1 单测 27 例：契约解包、字段归一、`needThumbnail` 两个方向、可选参数取舍、
      缓存命中/清除/关闭、错误分界（`PlatformApiError` vs 原样抛出的网络错误）、
      非 JSON 响应（网关 HTML 错误页）、`extractClientToken` 四种输入。
      CI 规则本身用一个临时分支验过：新增的裸 fetch 被拦下、`sdk-usage-allow`
      豁免生效、存量代码不误报
- [x] 4.2 真实调用验证（api:8084，dev，真实注册的 client 用户 token）：
      - `getEnvironment()` → `{dev, http://localhost:8084, ""}`
      - `uploadFile()` → `/OSS_FILE_PROXY/development%2Fprivate%2F**platform-client-probe**%2F….png`
        —— 路径里带上了 `business`，证明表单字段名对得上
      - `createShortLink()` → `{token:"tfgOvx", url:"/public/short-link/resolve/tfgOvx"}`
      - 错 token → `PlatformApiError: Invalid client user token`（不是网络错误）
      - `needThumbnail` 两个方向用真实图片（logo192.png）验过：`true` 返回
        `…/thumbnails/thumb_….png?provider=minio&bucket=thumbnail`，`false` 返回
        undefined。**1×1 的探针图两个方向都是 undefined**——平台的缩略图失败是
        `console.warn` 静默吞掉的，用小图验会得出错误结论
- [x] 4.3 27/27 绿；`tsc` 零错误；提交、合 main
      > 过程中把开发环境搞坏过一次，记录下来避免重演：`pnpm install --filter <pkg>`
      > 会**按过滤后的项目集裁剪整个虚拟store**——typeorm 等不属于该项目的包被直接
      > 删掉，正在跑的 api 立刻报 `Cannot find module './InsertQueryBuilder'`。
      > 恢复办法是不带 `--filter` 跑一次完整的 `pnpm install --frozen-lockfile`，
      > 并**重启进程**（peer 后缀变了，老进程还指着被删的旧目录）。
      > lockfile 前后 md5 一致、45 处 `libc` 字段未丢

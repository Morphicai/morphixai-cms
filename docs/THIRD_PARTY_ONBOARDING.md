# 三方服务接入指引

> 给**外部供应商/外包团队**交付一个 L2 业务服务时使用。
> 一方/二方（内部团队）接入见 `ARCHITECTURE.md` §三 的 L2 检查清单，约束更松。
>
> 底层原则：**边界靠机制，不靠约定。** 下面每一条"不给"，都不是靠对方守规矩，
> 而是架构上他们物理拿不到。

---

## 一、给什么

| 交付物 | 说明 |
|---|---|
| `@optimus/server-sdk` | introspect 身份自省 + service token 签发/校验。零第三方依赖，可独立安装 |
| `@optimus/admin-embed` | 管理页嵌入握手协议（`init` / `requestToken` / `onTokenRefresh`） |
| 服务目录登记规范 | 他们需要报的字段：`key` / `name` / `baseUrl` / `healthPath` / `metricsPath` / `apiPathPrefixes` / `embedUrl` / `menuTitle` / `permCode` |
| **该服务的派生密钥** | **带外一次性分发**，不走仓库、不走 IM 明文。见下方"密钥怎么给" |
| 联调环境账号 | 脱敏数据集，**不是生产数据** |
| 契约文档 | `/auth/introspect` 的请求/响应结构；他们被授予的 grant 列表 |

## 二、不给什么

- **主密钥 `SERVICE_TOKEN_SECRET`** —— 持有它等于能签发**任意服务**的身份。
  平台专有，任何情况下不下发
- **optimus-api 源码 / 其它业务服务源码** —— L2 只能通过 HTTP 消费 L1，
  他们不需要也拿不到
- **平台数据库连接** —— 三方服务必须用自己独立的数据库实例（见 §四）
- **未脱敏的生产数据** —— 开发和测试一律用脱敏样本

## 三、密钥怎么给

平台持有主密钥，各服务的签名密钥由 `HKDF-SHA256(主密钥, serviceKey)` 派生。
给三方的是**派生结果**，不是主密钥。

```bash
# 平台侧生成（在能读到 SERVICE_TOKEN_SECRET 的环境执行）
node -e '
const { hkdfSync } = require("node:crypto");
const master = process.env.SERVICE_TOKEN_SECRET;
const serviceKey = process.argv[1];
console.log(Buffer.from(hkdfSync("sha256",
  Buffer.from(master, "utf8"),
  Buffer.from("optimus-service-token-v1", "utf8"),
  Buffer.from(serviceKey, "utf8"), 32)).toString("hex"));
' vendor-activity-service
```

对方把这个值配成自己的 `SERVICE_TOKEN_SECRET` 即可用 `getServiceToken()` 自签。

**这样做的保证**：即使这份派生密钥完全泄露，泄露方**也只能冒充这一个服务**——
派生是单向的，既反推不出主密钥，也导不出别的服务的密钥。平台侧验签时按 token
自称的 `sub` 现算密钥，篡改 `sub` 会导致验签用的密钥换成被冒充者的，对不上。

> 平台侧不存储任何派生密钥。服务目录表里没有任何可用于签发的秘密，那张表泄露
> 不会导致服务身份沦陷。

## 四、接入检查清单

登记为 `enabled` 之前，逐项确认：

- [ ] `trustLevel` 已设为 `third-party`（**不是默认的 first-party**）
- [ ] `grants` 按最小必要授予。三方默认为空，每一项都要显式给，并记录授予理由
- [ ] **数据库实例独立于平台**，不共用 `optimus` 库、不共用实例
- [ ] 服务暴露了 `/health` 与 `/metrics-lite`（探测的前提，是义务不是可选项）
- [ ] 管理页经 `@optimus/admin-embed` 握手，校验 `baseOrigin`
- [ ] 已确认部署位置：镜像交付、**平台侧部署**（推荐），或明确书面同意的其它安排
- [ ] 联调用的是脱敏数据集
- [ ] 闭环验证脚本已交付（参照 `packages/partner-service/scripts/verify-closed-loop.mjs`）

## 五、验收判据

架构自带一个干净的判据：**把他们的服务停掉。**

预期表现：
- 该业务的 C 端接口 502
- 管理菜单点进去 iframe 加载失败
- 服务状态页显示 inactive
- **其余一切正常**

如果主站跟着出问题，说明有人越过了边界——大概率是直连了平台数据库，或改了共享表。

## 六、常见误解

**"信任级别 = 业务重要性"** —— 不是。它表达的是**代码提供方的可信程度**。
一个一方服务可以处理核心支付，一个三方服务可以只做活动页。别按业务重要性去调级别。

**"给了 service token 就能调平台接口"** —— 不能。token 只证明"我是谁"，
能做什么由服务目录里的 `grants` 决定，且每次调用现读——调整授权立即生效，
不必等旧 token 过期。

**"转发一个管理员 token 就能提权"** —— 不能。grants 是**服务的**授权，
与用户权限码是两套独立体系。带管理员 token 去调 `@RequireGrant` 接口，
连 service token 验签这一关都过不了。

**"应用层规定了禁止跨业务 JOIN，所以数据是安全的"** —— 对不可信的代码提供方
无效。他们拿到连接就能读全库。唯一可靠的边界是**连接本身到不了别人的表**，
所以 §四 那条数据库独立是硬约束，不是建议。

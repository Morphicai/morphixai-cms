## 1. 前置确认

- [x] 1.1 design.md 的 Open Question 已由 `platform-trust-model` 关闭：不自行设计
      调用方白名单，**直接消费 `@RequireGrant` + `ServiceGrantGuard`**，字段分档
      对应 `user-profile:read-basic` / `read-full`
- [x] 1.2 `platform-service-token` 已上线（HKDF 派生密钥），`server-sdk` 的
      `getServiceToken()` 可本地签发，本次验收就是用它签的真 token

## 2. 接口实现

- [x] 2.1 `ClientUserService.findPublicProfileById(userId, level)` + 导出
      `PUBLIC_PROFILE_FIELDS` 白名单常量
      > **在 SQL 层就只 select 白名单里的列**，不是查回整行再删字段——即使返回值
      > 被谁不小心整个透出去也没有多余的东西可泄，`passwordHash` 根本没离开数据库
      > **phone 两档都不给**：它既是登录标识也是短信/二次验证的落点，敏感度高于
      > 邮箱，spec 的字段集里也没有它。真有需求应单独开 grant，不塞进 full 搭车
      > `username` 必须在 basic 里——本能力的由来就是 `partner_profile.username`
      > 那份会漂移的快照，不给它等于没解决问题
- [x] 2.2 新增 `AuthMode.SERVICE` + `@ServiceAuth()` + `UnifiedAuthGuard.handleServiceMode`；
      控制器 `system/user-profile-query/`，两个路由分别挂 `@RequireGrant`
      > 原先**没有**"服务身份"这个认证模式（只有 admin/client/anonymous），
      > `ServiceGrantGuard` 是模块级守卫、全局的 `UnifiedAuthGuard` 先执行，
      > 不加这个模式的话 service token 会先被当成无效的管理员 JWT 拒掉
      > **`@ServiceAuth()` 漏挂 `@RequireGrant` 时 fail-closed**（403，且在验 token
      > 之前就拒）：只挂前者等于"任何登记过的服务都能调"，而漏挂从外部看不出来。
      > 与"未标注权限的 admin 接口一律拒绝"是同一个立场
      > 两个守卫**各自独立验一遍 token** 是有意的：ServiceGrantGuard 也用于绕过网关
      > 的服务间直调，不能假设有谁先认过。HS256 校验是微秒级的，重复的代价远小于
      > 任一侧假设对方做过而留下的授权真空
      > **分成 basic/full 两个路由**而不是一个路由按 grants 决定给多少字段：授权判断
      > 留在装饰器里是静态可查的（grep `@RequireGrant` 就知道谁要什么），挪进 handler
      > 按 `request.service.grants` 分支就变成"看代码才知道"，且容易在后续改动中漏掉
- [x] 2.3 用户不存在抛 404，不返回 `{}`——空对象会被调用方当成"查到了但资料是空的"，
      然后把空昵称渲染出去，那种 bug 要到线上看到空白才发现

## 3. SDK 封装

- [x] 3.1 `@optimus/platform-client` 新增 `getUserProfileBasic()` /
      `getUserProfileFull()`，入参是 `{serviceToken, userId}`
      > 本包仍不依赖 `server-sdk`：token 由消费方用 `getServiceToken()` 签好传进来。
      > 签名要用主密钥派生的专属密钥，那属于"你是谁"（server-sdk 的职责），
      > 这里只负责"帮我做件事"
      > uid 进路径段前做 `encodeURIComponent`——带 `/` 的值会改变请求的含义
      > 错误按 `code` 区分：404 用户不存在 / 403 没被授予 grant / 401 不是有效的
      > service token。三种含义完全不同，别一起 catch 掉

## 4. 验收

- [x] 4.1 单测：api 侧 21 例（白名单字段逐项断言 + 敏感字段黑名单回归 + controller
      档位分派 + 404 + SERVICE 模式五种情形），platform-client 侧 7 例
      > 白名单测试里显式列出 entity 上确实存在但不该外泄的字段（passwordHash /
      > phone / registerIp / lastLoginIp / lastLoginAt / registerSource / extraData /
      > updatedAt）——entity 将来新增敏感字段时这组断言会立刻红
- [x] 4.2 真实环境验证（api:8084，server-sdk 本地签发的真 token，真实注册的用户
      uid=23），10 个场景全部符合 spec：

      | # | 场景 | 结果 |
      |---|---|---|
      | ① | 无 token | 401 |
      | ② | client 用户 token | 401 |
      | ③ | 一方服务查 basic | 200，4 个字段，**无 email** |
      | ④ | 一方服务查 full | 200，7 个字段，含 email/status/createdAt |
      | ⑤ | 仅授予 basic 的服务查 full | 403 |
      | ⑥ | 仅授予 basic 的服务查 basic | 200 |
      | ⑦ | 三方服务（grants 空）查 basic | 403 |
      | ⑧ | 已下线服务（token 本身有效） | 403 |
      | ⑨ | 未登记的 serviceKey | 403 |
      | ⑩ | 不存在的 uid | 404 |

      ⑧⑨ 是这套设计的关键证据：**token 只证明"我是谁"，能做什么每次都从服务目录
      现读**——所以下线服务后旧 token 立刻失效，签一个没人登记过的 key 也换不到权限。
      另外经 `platform-client` + `server-sdk` 又完整走了一遍（basic/full/404/403 四种）。
      验证用的三条探针登记（仅 basic / 无 grant / 已下线）已从服务目录删除，
      表恢复为 7 行
      > 启动时才暴露的一个坑：`ServiceGrantGuard` 在**本模块的注入上下文**里实例化，
      > 它依赖的 `ServiceRegistryService` 必须在这里能解析到。AuthModule 导出了 guard
      > 本身但没把 ServiceOpsModule 一起再导出，所以模块要显式 import ServiceOpsModule。
      > **tsc 干净、单测全绿，仍然起不来**——这类错误只有真起进程才会报
- [x] 4.3 api 189/189、platform-client 34/34、server-sdk 13/13 绿；
      `tsc --noEmit` 零错误；CI 检查新增 `/service/user-profile/` 规则；提交、合 main
      > 顺带修正 ARCHITECTURE 里"10 处存量债"的失实数字：实际是 **9 处**
      > （3 处跨域注入 + 6 处裸写 HTTP，其中 2 处只是注释提到路径）。
      > 原先那个数字是我照着一次带自匹配噪声的输出写的

# 鉴权与权限（UnifiedAuthGuard）

`UnifiedAuthGuard` 在 `app.module.ts` 里全局注册，所有接口都要过它。它先判**认证模式**
（你是谁），ADMIN 模式再判**权限码**（你能做什么）。

## 一、认证模式（三选一）

用 `src/shared/decorators/auth-mode.decorator.ts` 里的装饰器声明，不声明默认 ADMIN。

| 装饰器 | 模式 | 凭据 |
|---|---|---|
| `@AdminAuth()` | 管理员（默认） | 管理员 JWT，`Authorization: Bearer` |
| `@ClientUserAuth()` | C 端用户 | `clientAccessToken` httpOnly cookie，或同一 token 走 Bearer |
| `@AnonymousAuth()` | 匿名 | 无 |

**C 端是 JWT，不是签名。** `handleClientUserMode` 取 Bearer 头或
`clientAccessToken` cookie，交给 `ClientUserService.verifyToken()` 验，
全程没有签名逻辑。

> 早期文档写过一套 HMAC 签名鉴权（`client-uid` / `client-sign` /
> `client-timestamp` 三个头 + `CLIENT_USER_SIGN_KEY`），那是另一个类
> `ClientUserAuthGuard` 的行为，**它在 optimus-api 里已无任何调用点**
> （只剩自己的 docstring）。`@ClientUserAuth()` 走的不是那条路。

## 二、权限码：ADMIN 模式默认拒绝（fail-closed）

**这是最容易踩的一条。** 2026-08-24 起，ADMIN 模式接口如果三个装饰器一个都没挂，
一律 403，不是放行：

```
接口未声明权限语义，拒绝访问
```

必须三选一：

| 装饰器 | 含义 | 何时用 |
|---|---|---|
| `@Perm("XxxManagement")` | 需要指定权限码 | 绝大多数管理接口 |
| `@AllowNoPerm()` | 登录即可，不查权限码 | 自服务型接口（读写自己的数据） |
| `@RequireSuperAdmin()` | 仅超管 | 危险操作：清数据、直接改余额、纯调试接口 |

权限码与前端菜单显隐共用同一套 `op_sys_role_menu.permission_code`，
类级和方法级都能挂，**方法级优先**。

⚠️ `@AllowNoPerm()` 在 guard 里的判定**早于**超管检查，方法级挂它会盖掉类级的
`@Perm`。历史上 database-backup 全员挂 `@AllowNoPerm` 却在注释里宣称"仅超管"，
结果任何登录账号都能拖走整库备份——挂之前先想清楚。

### 为什么翻成 fail-closed

那次审计发现好几个 ADMIN 接口靠"没挂 @Perm 就放行"这条默认规则裸奔：直接改积分
余额、清空数据、读全量订单，全都没有权限码。**忘记声明的后果应该是报错，不应该是
放行。**

## 三、写一个新接口

```typescript
@Controller("biz/example")
@Perm("ExampleManagement")          // 类级：整个 controller 的默认要求
export class ExampleController {

    @Get("list")                     // 继承类级 @Perm
    async list() {}

    @Post("dangerous")
    @RequireSuperAdmin()             // 方法级覆盖：这个更危险
    async dangerous() {}

    @Get("public-stats")
    @AnonymousAuth()                 // 换认证模式，不再走权限码
    async publicStats() {}
}
```

C 端接口：

```typescript
@Get("me")
@ClientUserAuth()                    // 换成 C 端模式，用 req.clientUser
async me(@Req() req) {
    const userId = req.clientUser?.userId;
}
```

## 四、白名单

`perm.router.whitelist`（环境变量 `PERM_ROUTER_WHITELIST`）里的路由跳过权限校验，
用于少数确实不能走常规鉴权的路径。加之前先确认没有别的办法。

## 五、相关文件

- `unified-auth.guard.ts` —— 本守卫实现，fail-closed 逻辑在 `handleAdminMode` 里
- `../decorators/auth-mode.decorator.ts` —— 三个认证模式装饰器
- `../decorators/perm.decorator.ts` —— `@Perm` / `@AllowNoPerm`
- `../decorators/super-admin.decorator.ts` —— `@RequireSuperAdmin`
- `initialization.guard.ts` —— 系统未初始化时的拦截，见 `../../INITIALIZATION_GUARD.md`

> CASL（`@UseAbility` / `PoliciesGuard`）在本项目**目前零使用**，
> `validateAbilityPermissions` 永远短路返回。真正生效的是上面的权限码机制。

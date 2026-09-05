# @optimus/permission

权限判定核心。把「这个人/这个服务能不能做这件事」收敛成一个纯函数，
让 **optimus-api 守卫、业务子服务守卫、管理端菜单过滤、子应用 iframe 内部**
跑同一份逻辑——这行判断现在各存一份，必然漂移。

零运行时依赖，不碰任何 node 内置模块：浏览器能跑，平台外的团队也能独立安装。

> 完整设计（现状、四个视角、明确不做的清单）见 `docs/PERMISSION_MODEL.html`。

## 权限码

```
namespace : resource : action
partner   : campaign : write
```

三段各管一件事：**namespace** 是归属（一个服务只能声明自己 namespace 下的码，
这是"子应用不能声明宽松码蹭可见性"的唯一防线）；**resource** 是对什么；
**action** 是做什么。

三段均为小写 slug（字母开头、可含数字与中划线、≤50 字）。

## 通配

**只允许后缀通配**，`*` 一旦出现，其后必须全是 `*`：

| | |
|---|---|
| 合法（授予侧） | `a:b:c` `a:b:*` `a:*` `a:*:*` `*` |
| 非法 | `*:b:c` `a:*:c` —— 中缀通配跨越了命名空间边界，等于开一个绕过归属校验的口子 |
| 要求侧 | **不接受任何通配**。"要求"必须具体，否则声明方可以用通配放宽自己的门槛 |

## 用法

```ts
import { evaluate, can, canAny, definePermissions } from "@optimus/permission";

// 声明（放在服务自己的代码里，与实现同库同版本）
export const P = definePermissions("partner", {
  campaign: ["read", "write", "publish"],
});
P.campaign.write   // "partner:campaign:write"，带类型，拼错编译期就报
P.$all             // 注册到平台时上报

// 判定
const subject = { type: "admin", codes: ["partner:campaign:*"] };
can(subject, P.campaign.write);                    // true
canAny(subject, ["a:b:c", P.campaign.read]);       // 任一命中；空数组 → false

const d = evaluate(subject, P.campaign.write);
// { allowed: true, matched: "partner:campaign:*", scope: "all" }
```

## 两条要记住的语义

**`canAny([])` 返回 `false`。** 空数组直觉上像"无限制"，实际语义必须是"最严"——
菜单节点没声明 `requires` 时应该只有超管可见，不是所有人可见。

**判定永远不抛异常。** 拼错的码、缺失的主体、非法的要求，结果都是"不允许"。
让守卫因为一个拼错的码抛 500，比返回 403 更糟。

## 边界

本包**只判定，不获取**。codes 从哪来（introspect / embed 握手 / 服务目录）是消费方的事。
主体类型（admin / client / service）共用判定逻辑，但 **codes 的来源互不相通**——
service 的能力不会因为它转发了一个管理员 token 而变多，隔离由消费方保证。

`Decision.scope` 目前恒为 `all`：**平台只判「能不能做」，数据范围由子服务按自己的
领域模型翻译成 where 条件**。平台不认识 L2 的字段，这条边界不能破。

## 扩展

`evaluate(subject, required, { rules })` 的规则链默认只有 `holdsCode`。
将来要接"且资源归属于自己"这类条件判定，追加一条 rule 即可，不动核心。
刻意不预先实现——现在写的形状大概率不是届时需要的那个。

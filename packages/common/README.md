# @optimus/common

前后端共用的工具包。**目前实际对外只导出加密工具**——见下方"包里还有什么"一节。

## 导出内容

`index.ts` 当前只导出 `utils/crypto`：

| 导出 | 用途 |
|---|---|
| `CryptoUtil` | 加解密工具类 |
| `encryptPasswordFields` | 提交前加密密码字段 |
| `decryptPasswordFields` | 服务端解密 |

真实使用方（全部只用到加密）：

- `optimus-api` — `client-user.controller.ts`
- `optimus-next` — `AuthProvider.tsx`、`lib/universal-api.ts`

```typescript
import { CryptoUtil, encryptPasswordFields } from "@optimus/common";
```

## 构建

**这个包必须先构建，别的包才能起来**（workspace 软链指向的是构建产物 `dist/`，
不是源码）：

```bash
cd packages/common && pnpm build
```

漏了这步，api 启动会报 `Cannot find module '@optimus/common/dist/index.js'`。

## 包里还有什么（未导出，勿依赖）

目录里另有几个文件，但 `index.ts` 里对应的 `export` 都被注释掉了，
`dist/` 里也没有它们——也就是说**从包外 import 不到，是历史遗留**：

- `constants/menus.js` —— 早期设想的前后端共享菜单常量。管理后台的菜单实际维护在
  `packages/optimus-ui/src/constants/routes.js`，且已经演进出动态 embed 菜单机制，
  与这份静态常量无关
- `utils/permission.js` —— 早期的菜单级权限工具。实际权限模型是 optimus-api 的
  `@Perm` 权限码 + fail-closed 守卫，见
  `packages/optimus-api/src/shared/guards/README.md`
- `utils/images.js`、`utils/transformTree.js`、`hooks/useMount.js` —— 同样未导出

要用它们得先在 `index.ts` 里放开导出并重新构建；在那之前，不要照着它们写代码。
更合理的做法是先判断这些文件是否还该留着（已记在 `TASKS.md` 的清理待办里）。

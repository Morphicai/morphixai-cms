# 路由与菜单常量使用说明

## 概述

`routes.js` 是整个管理端的**路由 + 菜单 + 权限编码**唯一定义处，取代了早年把菜单存在数据库、
登录后 `getAllMenu()` 拉回来的做法。好处：

1. **版本控制**：菜单配置纳入代码版本管理，改动能在 diff 里看见
2. **类型安全**：常量集中定义，避免到处散落魔法字符串
3. **易于维护**：路由、组件映射、权限编码在同一个文件里对齐
4. **性能**：静态部分零请求，登录后只要拿到用户权限编码就能渲染

> 旧文档里提到的 `constants/menus.js` / `SYSTEM_MENUS` / `getMenuByCode` /
> `getButtonPermissions` **都已经不存在**。现在的模块是 `constants/routes.js`，
> 常量叫 `SYSTEM_ROUTES`。仓库里还能搜到 `constants/menus` 的地方
> （`utils/menuMigration.js`、`pages/routes.bak.new.js`）都是没跟着改的历史残留，
> 别照着抄。

## 模块构成

```
constants/routes.js
├── MENU_TYPES          菜单类型枚举
├── COMPONENT_MAP       component 字符串 → React.lazy 组件
├── SYSTEM_ROUTES       静态路由/菜单树（本文件的主体）
└── 一堆导出函数        见下方「API 一览」
```

### 菜单类型

- `MENU (1)`：菜单/目录，对应页面路由
- `TAB (2)`：标签页（预留，暂无使用）
- ~~`BUTTON (3)`~~：**已移除**，不再支持按钮级别权限控制

### 权限编码规则

只有一种：**菜单权限直接用路由自己的 `code`**，如 `"Dashboard"`、`"PermUsers"`、`"ServiceOps"`。
早期设想过 `"模块:操作"` 形式的按钮权限（`perm_users:edit` 之类），那一整套连同
`getButtonPermissions()` 已经删掉了，`MENU_TYPES.BUTTON` 也注释掉了——不要再往这个方向写。

### 单条路由长什么样

```javascript
{
  id: 'user_list',                 // 全局唯一
  name: '用户列表',                 // 菜单显示名
  code: 'PermUsers',               // 权限编码，同时是 CASL subject 的来源
  type: MENU_TYPES.MENU,
  path: '/sys/user',               // 没有 path 的是纯目录（父菜单）
  component: 'PermUsers',          // 必须在 COMPONENT_MAP 里有对应项
  icon: 'UserOutlined',            // Ant Design 图标名
  orderNum: 10,
  parentId: 'permission_management',
  exact: true,
  description: '系统用户列表管理',
  // 可选：
  // public: true        免登录/免权限即可访问路由
  // hidden: true        路由可达但不进侧边栏
  // displayNone: true   同样是不进菜单（老写法，两个都还在用）
}
```

## API 一览

| 导出 | 同步/异步 | 说明 |
|---|---|---|
| `SYSTEM_ROUTES` | — | 静态路由树本体 |
| `COMPONENT_MAP` | — | `component` 字符串到懒加载组件的映射 |
| `getFlatRoutes()` | 同步 | 拍平**静态**路由树 |
| `getFlatMenusWithDynamic()` | **async** | 拍平「静态 + 动态」完整菜单 |
| `getRoutesByType(type)` | 同步 | 按 `MENU_TYPES` 过滤 |
| `getAllPermissionCodes()` | 同步 | 所有**静态**路由的 code |
| `getAllPermissionCodesWithDynamic()` | **async** | 含动态菜单项的 code |
| `getRouteByCode(code)` | 同步 | 按权限编码查单条路由，查不到返回 `null` |
| `getReactRoutes(userPermissions)` | 同步 | 生成 React Router 用的路由表（只走静态路由） |
| `getDynamicDocumentMenus()` | **async** | 文档系统生成的菜单项 |
| `getDynamicServiceMenus()` | **async** | 服务目录 embed 入口生成的菜单项 |
| `getFullMenuConfig()` | **async** | 静态 + 上面两种动态，合成完整菜单配置 |
| `getMenuTree(userPermissions)` | **async** | 按权限过滤后的侧边栏菜单树 |
| `generateCASLRules(userPermissions)` | 同步 | 转成 CASL 规则 |
| `validateRouteConfig()` | 同步 | 自检：id/code/path 唯一性、组件映射、父子关系 |

**注意 `getMenuTree` 是 async**。它内部要去拉文档菜单和服务目录条目，必须 `await`，
直接当同步用会拿到一个 Promise，渲染出空菜单。

## 使用示例

### 1. 获取所有静态路由的权限编码

```javascript
import { getAllPermissionCodes } from '../constants/routes';

const allPermissions = getAllPermissionCodes();
// ['Dashboard', 'PermissionManagement', 'PermUsers', 'PermRoles', ...]
```

需要连动态菜单一起算（比如角色授权页要列全量可授权项）时用异步版：

```javascript
import { getAllPermissionCodesWithDynamic } from '../constants/routes';

const allPermissions = await getAllPermissionCodesWithDynamic();
```

### 2. 根据用户权限生成菜单树（异步）

```javascript
import { getMenuTree } from '../constants/routes';

const userPermissions = ['Dashboard', 'PermUsers', 'ServiceOps'];
const menuTree = await getMenuTree(userPermissions);
```

在组件里就是一个 effect：

```jsx
const [menuTree, setMenuTree] = React.useState([]);

React.useEffect(() => {
  getMenuTree(userPermissions)
    .then(setMenuTree)
    .catch(err => {
      console.error('加载菜单失败:', err);
      setMenuTree([]);
    });
}, [userPermissions]);
```

权限过滤规则：`userPermissions` 含 `'*'`（超管）全放行；数组为空时也全放行（未登录/未初始化的兜底）；
否则要么自己的 `code` 命中，要么子菜单里有命中项（父目录跟着子项出现）。`hidden` / `displayNone`
的项不进菜单，非 `MENU_TYPES.MENU` 的项也不进。

### 3. 按权限编码反查路由

```javascript
import { getRouteByCode } from '../constants/routes';

function hasRoute(code) {
  return getRouteByCode(code) !== null;
}
```

只查静态路由。动态菜单项要查得用 `getFlatMenusWithDynamic()`。

### 4. 生成 React Router 路由表

```javascript
import { getReactRoutes } from '../constants/routes';

const routes = getReactRoutes(userPermissions);
// [{ id, path, component, exact, name, code, public }, ...]
```

只有同时满足「有 `path`」「有 `component`」「(`public` 或超管或权限命中)」的静态路由才会出现在结果里。
动态菜单不生成路由——它们都指向已经存在的参数化路由（见下一节）。

### 5. 页面里的权限判断

按钮级权限已经没有了，页面级判断直接比对权限编码：

```jsx
import { getRouteByCode } from '../constants/routes';

// 用户权限数组通常来自登录态
const canSeeServiceOps = userPermissions.includes('*') || userPermissions.includes('ServiceOps');
```

## 动态菜单机制

静态的 `SYSTEM_ROUTES` 只是一半。当前实际渲染的菜单是 `getFullMenuConfig()` 的结果，
= 静态树 + 两路动态来源：

```
getFullMenuConfig()
├── SYSTEM_ROUTES                     静态
├── getDynamicDocumentMenus()   →     挂到 config_center 的 children
└── getDynamicServiceMenus()    →     作为顶层菜单项追加
```

两个动态函数都是**先看登录态**（`storage('access-token')` 取不到就直接返回 `[]`，不发请求），
接口失败也只 `console.warn` 后返回 `[]`——动态部分挂了不能把静态菜单一起带垮。

### 文档动态菜单：`getDynamicDocumentMenus()`

调 `getMenusFromDocument()`，把有 `description` 且 `showOnMenu` 的文档变成菜单项：

```javascript
{
  id: `doc_${doc.id}`,
  name: doc.description,
  code: 'ConfigCenter',          // 复用父菜单的权限码
  path: `/edit-doc/${doc.id}`,   // 指向固定的动态路由，不新增路由
  parentId: 'config_center',
  isDynamicMenu: true,
  docId, docKey,
}
```

### 服务目录动态菜单：`getDynamicServiceMenus()`

这是**当前接入子服务的正式姿势**。调 `serviceOpsApi.entries()`（`GET /system/services/entries`，
后端 `@AllowNoPerm()`，登录即可读），把服务注册表里 `enabled` 且 `entryType === 'embed'` 且填了
`embedUrl` 的条目变成顶层菜单项：

```javascript
{
  id: `svc_${e.key}`,
  name: e.menuTitle || e.key,
  code: e.permCode || 'ServiceOps',   // 没配 permCode 时缺省从紧，只有 ServiceOps 能看见
  path: `/embed/${e.key}`,            // 全部指向同一个宿主路由
  // 图标名先在 @ant-design/icons 里校验存在，写错了就退回默认图标
  icon: e.menuIcon && Icons[e.menuIcon] ? e.menuIcon : 'AppstoreOutlined',
  orderNum: 50,
  parentId: null,
  isDynamicMenu: true,
}
```

条目的 `menuTitle` / `menuIcon` / `permCode` / `embedUrl` 都存在服务注册表
（`optimus-api` 的 `service_registry`），在「服务状态」页里登记和维护，改菜单不用改这份代码。

宿主路由是 `SYSTEM_ROUTES` 里那条 `id: 'embed_app'`：`path: '/embed/:serviceKey'`，
`component: 'EmbedApp'`，标了 `public: true` + `hidden: true`——路由本身可达、不进菜单，
页内再按目录里的 `permCode` 做一层展示级校验。**真正的门在子应用自己的后端**
（introspect + 权限码），前端这层只是别让用户点进去看见一个白屏。

### 已经下线的静态路由

合伙人计划管理、合伙人数据管理、外部任务审核这三个原本是静态路由，现在全部下线，
改由 partner-service 通过上面这套 embed 入口提供（左侧菜单里的「合伙人服务」）。
`COMPONENT_MAP` 顶部和 `SYSTEM_ROUTES` 里对应位置都留了注释说明。对应的
`pages/partner`、`pages/external-task-review`、`pages/system/views/PartnerDataManagement`
组件文件还留在磁盘上未删，是留到迁移收尾统一清理的，不是遗漏。

## 维护指南

### 添加新菜单（静态）

1. 在 `SYSTEM_ROUTES` 里加配置，`id` 全局唯一、`code` 遵循命名规范
2. 正确设置 `parentId` 建立父子关系
3. 在 `COMPONENT_MAP` 里补上 `component` 对应的懒加载组件——漏了 `validateRouteConfig()` 会报错
4. 补上 `description`

### 接一个新子服务（动态，推荐）

不用改这个文件。去「服务状态」页登记服务，`entryType` 选 `embed`，填 `embedUrl`、
`menuTitle`、`menuIcon`、`permCode`，菜单下次加载就会出现。

### 修改菜单权限

1. 改对应路由的 `code`
2. 同步更新引用了这个 code 的地方（`userPermissions.includes('XxxCode')`）
3. 后台角色配置里的旧编码也要一起改，否则老角色会突然看不见菜单

### 删除菜单

1. 从 `SYSTEM_ROUTES` 移除
2. 清理 `COMPONENT_MAP` 里对应项
3. 检查是否还有代码在比对这个 code

## 注意事项

1. **权限编码唯一性**：`code` 必须全局唯一，`validateRouteConfig()` 会查重
2. **父子关系正确性**：`parentId` 必须指向存在的父路由 `id`
3. **路径唯一性**：`path` 不能重复，同样在自检范围内
4. **组件映射**：`component` 字符串必须在 `COMPONENT_MAP` 里能找到
5. **图标名称**：`icon` 用 Ant Design 图标名，动态菜单那边会先校验图标是否存在，静态这边不校验，写错就是运行时报错
6. **排序**：`orderNum` 目前只是声明性字段，`getMenuTree` 里**没有任何 sort**，
   菜单实际按 `SYSTEM_ROUTES` 的数组顺序渲染（动态服务菜单固定追加在最后）。
   想调顺序就挪数组位置，改 `orderNum` 不会有效果
7. **异步陷阱**：`getMenuTree` / `getFullMenuConfig` / `getFlatMenusWithDynamic` /
   `getAllPermissionCodesWithDynamic` / 两个 `getDynamic*Menus` 全是 async，别当同步用

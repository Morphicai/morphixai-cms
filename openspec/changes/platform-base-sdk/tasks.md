# Tasks: platform-base-sdk

## 1. 服务端：introspect

- [x] 1.1 auth-introspect controller（/api/auth/introspect，@AnonymousAuth + @AllowNoPerm，IP 限频）
- [x] 1.2 admin token 分支：verify + 用户查询 + 权限码聚合（复用现有 perm 查询）
- [x] 1.3 client token 分支：复用 clientUserService.verifyToken
- [x] 1.4 单测：有效/过期/篡改/类型错，均按 spec 返回

## 2. packages/client-sdk

- [x] 2.1 抽包：optimus-next/src/sdk 平移，包构建对齐 packages/common
- [x] 2.2 新增 collections.ts（数据集合公开读写封装）
- [x] 2.3 optimus-next 原 sdk 路径改 re-export 薄壳，构建回归

## 3. packages/server-sdk

- [x] 3.1 introspect fetch 封装 + 60s token 缓存，零依赖
- [x] 3.2 单测：缓存命中不发请求

## 4. 管理端嵌入

- [x] 4.1 packages/admin-embed：init/onTokenRefresh/requestToken（零构建 UMD 单文件，script 与 require 皆可用）
- [x] 4.2 optimus-ui IframeApp 通用组件：origin 校验、握手下发、刷新代理
- [x] 4.3 routes.js 支持 iframeUrl 菜单节点；登记 DemoActivity 示例节点 + 权限码 seed

## 5. 示例与验收

- [x] 5.1 examples/demo-activity：单页示例（握手展示用户/权限、introspect 按钮、集合读写）
- [x] 5.2 浏览器验收：菜单打开 → 握手成功显示管理员与权限码 → introspect 返回 → 集合读写生效
- [x] 5.3 curl 验收 introspect 四种 token 场景
- [x] 5.4 optimus-next 登录/刷新/首页回归 + 三端构建通过

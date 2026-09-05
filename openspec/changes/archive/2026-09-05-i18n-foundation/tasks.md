# Tasks: i18n-foundation

## 1. api

- [x] 1.1 entity + module（op_sys_i18n_entry，(namespace,key) 唯一索引）
- [x] 1.2 管理接口：namespaces / entries CRUD（@Perm("I18nManagement")）
- [x] 1.3 AI 补全接口：批量翻译缺失 locale，只填缺失不覆盖，单次 50 键上限
- [x] 1.4 公开读接口：/api/i18n/:namespace?locale=，zh-CN 回退，404，IP 限频
- [x] 1.5 单测：回退逻辑、不覆盖已有译文、唯一约束

## 2. seed

- [x] 2.1 建表 SQL + I18nManagement 权限码（role_menu 64/65）+ portal 演示键；dev 库执行

## 3. 管理端

- [x] 3.1 routes.js：多语言管理节点（I18nManagement，/i18n）
- [x] 3.2 pages/i18n：namespace 切换/搜索/表格（key + 动态语言列）/编辑 Modal/删除
- [x] 3.3 AI 补全按钮（选目标语言 → 调补全接口 → 刷新列表）

## 4. client-sdk

- [x] 4.1 I18nSDK.load(namespace, locale) + 内存缓存 + clearCache

## 5. 验收

- [x] 5.1 浏览器：建 key → AI 补全 → 表格三语齐 → 人工改一格再补全不被覆盖
- [x] 5.2 curl：公开接口 en-US 出译文、回退、404、限频
- [x] 5.3 api 单测 + 三端构建通过

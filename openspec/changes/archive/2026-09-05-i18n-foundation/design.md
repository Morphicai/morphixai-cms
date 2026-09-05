# Design: i18n-foundation

## 数据模型

单表 `op_sys_i18n_entry`（不建 namespace 表——namespace 是 entry 的一个列，
"建 namespace"就是建第一个 key，删光即消失，少一张表少一套 CRUD）：

| 列 | 类型 | 说明 |
|---|---|---|
| id | bigint PK | |
| namespace | varchar(64) | 如 `portal`、`docs`。索引 |
| key | varchar(128) | 如 `hero.title`。(namespace, key) 唯一 |
| translations | json | `{"zh-CN":"...","en-US":"..."}`，有什么 locale 就支持什么 |
| remark | varchar(255) | 给译者的上下文备注 |
| updated_at | timestamp | |

默认语言约定为 `zh-CN`（回退源）。

## 接口

管理端（`@Perm("I18nManagement")`）：
- `GET /system/i18n/namespaces` — namespace 列表（distinct + 计数）
- `GET /system/i18n/entries?namespace=&page=&pageSize=&keyword=` — 键值分页
- `POST /system/i18n/entries` / `PUT :id` / `DELETE :id`
- `POST /system/i18n/translate` — AI 补全：`{ namespace, targetLocales: [] }`，
  对缺失目标语言的键批量翻译并写回（body 里给 keys 可选定范围）。
  一次最多处理 50 个 key（一次 LLM 调用打包 50 键的 json 翻译，不逐键调用），
  超过的下次再点——比做任务队列精简得多，量大时多点几次按钮

公开（匿名 + IP 限频，与 introspect 同款内存桶）：
- `GET /api/i18n/:namespace?locale=xx` — 返回 `{ key: text }` 扁平 map；
  键在目标 locale 缺失时回退 zh-CN，再缺失则跳过该键；namespace 无任何键 → 404

## AI 补全提示词形态

输入：`{ key: { "zh-CN": "源文", remark } }` 批量 json；要求模型只输出
`{ key: "译文" }` json。写回时**只填缺失的 locale，不覆盖已有人工译文**——
AI 是补全者不是覆盖者。

## 管理端页面

单页 `pages/i18n/index.jsx`：
- 顶部 namespace Select（可输入新值直接创建）+ keyword 搜索 + "AI 补全缺失语言"按钮
- 表格列：key / zh-CN / en-US / ja-JP / 备注 / 操作（编辑/删除）。
  列固定三语言起步——translations 里出现其他 locale 时列动态追加
- 编辑 Modal：key、备注、每 locale 一个输入框

## client-sdk

`I18nSDK.load(namespace, locale)` → `Record<string, string>`，模块级内存缓存
（key=`ns:locale`），`clearCache()` 可强刷。不做响应式/切换事件——那是消费方
框架层的事。

## seed

- 权限码 `I18nManagement` 授角色 1/2（role_menu id 64/65）
- 演示 namespace `portal`：3 个 key 的 zh-CN 文案（验收 AI 补全用）

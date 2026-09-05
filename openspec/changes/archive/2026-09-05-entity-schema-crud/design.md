# Design: entity schema 驱动增删改查

## 核心决策：不新建模块，拼装三个已验收资产

| 资产 | 来源 | 在本迭代的角色 |
|---|---|---|
| 存储与访问控制 | 字典模块（collection 表自带 schema json 列 + 三档 accessType + 行 CRUD API 全齐） | 集合与行的持久化、公开读写门禁 |
| schema 协议与校验 | 表单模块（validateSchema/validateEntry，14 单测） | 集合 schema 合法性 + 行数据两端一致校验 |
| 编辑与渲染 UI | SchemaFormRenderer + 表单管理页范式（JSON 编辑+预览+智能生成） | 管理端集合定义与行编辑 |

新写的代码只有"接线"：字典校验分支、管理端新页面、C 端一处数据源切换。

## 协议判别（兼容不迁移）

字典的 validateSchema 现在认简化 JSON Schema（properties/required/unique）。
判别规则：`schema.fields` 是数组 → form 协议路径（调表单模块校验器）；
否则走旧逻辑。两套并存但边界清晰——**新集合一律 form 协议**，管理端只产出
form 协议；旧形状只为不破坏未知存量。

form 协议为此扩展一个可选字段属性 `unique: boolean`（行级唯一性校验，
字典侧已有 validateUniqueness 可复用）——协议对未知属性宽容，表单侧不受影响。

## 行模型

沿用字典行（collection + key → value）：
- entity 行的 value = `{ 字段key: 值 }` 对象，形状由 schema.fields 定义
- 行的 key 由管理端生成（`r<时间戳36进制><随机4位>`），用户不感知——
  字典要求 key 唯一，entity 场景把它当内部 rowId 用
- 不新建表、不加列。将来需要真正的行表（大数据量/索引）时再演进，
  1000 条的集合上限（字典自带）对长尾数据场景完全够

## 权限

- 新权限码 `DataCollections`，routes.js 登记 + 两个字典管理 controller 类级
  `@Perm("DataCollections")` + seed 给两个角色授权
- C 端读写不走权限码，走集合 accessType（public_read/public_write），
  与 dynamic-content 同一道门

## 管理端页面结构（复用表单管理页范式）

```
/data-collections（菜单：数据集合）
  ├─ 集合列表（名称/显示名/访问类型/条数/状态）
  ├─ 新建/编辑集合 Modal：displayName + accessType + schema
  │    schema 三种来路：JSON 编辑器 / SchemaFormRenderer 实时预览 /
  │    智能生成（复用 POST /form/generate，协议同源）
  └─ 行数据抽屉：antd Table 列 = schema.fields
       新增/编辑行 = Modal + SchemaFormRenderer（与 C 端填报同一渲染器）
       删除行带确认
```

## C 端 features 切换（降级优先）

首页 features 数组保留为 fallback 常量；挂载后拉
`/api/api/dictionary/site-features`（匿名公开读，与 hero 文案同链路），
成功则覆盖，失败/为空保持 fallback——后端全灭时首页与今天完全一致。
icon 存 lucide 组件名字符串，前端一张映射表（缺省 icon 兜底）。

## 明确不做

- 通用行级 REST 新端点：字典既有 API 够用，避免第二套行 API
- schema 编辑的图形化字段编辑器：JSON+预览+AI 生成已够（表单页同款取舍）
- 集合删除的级联策略变更：沿用字典现状

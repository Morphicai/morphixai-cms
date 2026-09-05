# Proposal: entity schema 驱动增删改查（数据无代码化地基）

## Why

无代码方向的第二块地基。动态表单验证了"schema→渲染→校验→落库"的写半边；
这个迭代补上读半边和管理面——**一份 entity schema 同时驱动管理端表格/编辑
界面、行级 CRUD API、两端校验、C 端公开读**，让"管理一类新数据"从写一遍
entity+controller+service+管理页，变成后台建一个集合。

直接痛点：官网 features/pricing/use-cases 全是硬编码在 TSX 里的数组，改一行
文案要发版；运营的长尾数据（名单/兑换码/配置表）只能等开发建表。

## What Changes

1. **协议统一到 form schema**：字典集合的 schema 列改用表单模块的 schema 协议
   （fields 数组、7 种字段类型），复用已验收的 validateSchema/validateEntry
   校验器与 SchemaFormRenderer 渲染器。字典里旧的 properties 形状（简化
   JSON Schema）保留兼容分支，不迁移不删除
2. **后端**：集合 schema 写入时校验合法性；行数据写入按 form 协议校验
   （required/类型/选项/数字范围，管理端与 C 端 public_write 同一道闸）；
   两个字典管理 controller 打 `@Perm('DataCollections')`
3. **管理端**：新页面「数据集合」——集合列表/新建/编辑（JSON 编辑 + 实时
   预览 + 复用表单的智能生成接口），点进集合是按 schema 生成列的
   数据表格（增删改行走 Modal + SchemaFormRenderer）
4. **C 端演示闭环**：首页 features 卡片改为读 `site-features` 公开集合，
   接口失败回退现有硬编码——后台改 feature 文案，官网即时生效
5. **seed**：site-features 集合（public_read + schema）+ 现有 8 条 feature 数据

## Non-Goals

- 集合间关系/join、行级权限、复杂查询（只有既有的分页与集合内列表）
- schema 变更的数据迁移（改 schema 不动旧行，读取端宽容）
- 旧 properties 协议的存量迁移
- pricing/use-cases 页改造（features 验证模式后下轮再搬）

## Impact

- optimus-api dictionary 模块（校验接入 + @Perm）+ form 模块 schema-validator 复用
- optimus-ui 新增 pages/data-collection + routes.js 节点 + 权限码
- optimus-next 首页 features 数据源切换（带降级）
- 运营侧获得第一个"自建数据模型"入口，AI 建模复用表单生成接口零成本接入

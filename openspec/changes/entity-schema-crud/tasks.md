# Tasks: entity schema 驱动增删改查

## 1. 后端（optimus-api / dictionary 模块）

- [x] 1.1 schema-validator 扩展：字段可选属性 `unique: boolean`（表单侧不受影响）
- [x] 1.2 dictionary.service：集合 create/update 时校验 form 协议 schema 合法性（fields 数组存在才校验）
- [x] 1.3 dictionary.service.validateSchema：加 form 协议分支（fields → validateEntry + unique 复用 validateUniqueness），properties 旧形状走原逻辑
- [x] 1.4 两个字典管理 controller 打 `@Perm("DataCollections")`
- [x] 1.5 单测：form 协议行校验分支（required/类型/unique）

## 2. seed 与权限

- [x] 2.1 seed SQL：DataCollections 权限码授两个角色；site-features 集合（public_read + form 协议 schema：icon/title/description）+ 8 条现有 feature 行；dev 库同步执行

## 3. 管理端（optimus-ui）

- [x] 3.1 routes.js：DataCollections 节点（菜单「数据集合」）+ 组件注册
- [x] 3.2 apis/dataCollection.js：集合与行的接口封装（走既有 /system/dictionary*）
- [x] 3.3 集合管理页：列表 + 新建/编辑 Modal（displayName/accessType/schema：JSON 编辑 + SchemaFormRenderer 预览 + 智能生成按钮复用 /form/generate）
- [x] 3.4 行数据抽屉：按 schema.fields 生成 antd Table 列；新增/编辑行 Modal 用 SchemaFormRenderer；删除确认
- [x] 3.5 行 key 生成策略（内部 rowId，用户不感知）

## 4. C 端（optimus-next）

- [x] 4.1 首页 features 改为读 site-features 公开集合，失败/空回退硬编码；icon 名→lucide 组件映射表

## 5. 验收

- [x] 5.1 api 单测通过 + next/ui 构建通过
- [x] 5.2 管理端全流程：建集合（智能生成 schema）→ 录 3 行 → 编辑 → 删除
- [x] 5.3 curl 绕过前端提交非法行 → 400 指明字段
- [x] 5.4 改 site-features 某行 title → 官网首页对应卡片变化；停后端 → 降级内置数据

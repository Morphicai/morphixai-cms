## Why

平台愿景的最后一块是承载无代码系统，但目前一个页面/表单的诞生仍然要写代码、发版。无代码不必一步到位，它的最小原子是**动态表单**：用一份 JSON schema 描述表单 → 运行时渲染 → 收集数据，全程不改代码。这个原子做扎实了，问卷、报名、工单、审批单这类需求就都不用再开发,后续的无代码页面也长在同一套 schema 与渲染协议上。上一迭代已备好权限范式与 AI 服务,正是动工的时机。

## What Changes

- 后端新增动态表单模块：表单定义（schema）与表单数据（entries）的存储与接口，管理接口挂权限码 `FormManagement`，公开填报接口匿名可用（按定义开关控制）
- schema 采用自定义的精简 JSON 协议（字段类型：单行文本/多行文本/数字/单选/多选/日期/开关），服务端按 schema 校验提交数据——**渲染和校验共用同一份 schema，前后端不各写一套**
- AI 生成表单：自然语言描述 → 调既有 AiService 生成 schema 草稿 → 人工调整后保存（复用上迭代的模型接入与限频模式）
- 前端新增「表单管理」：定义列表、schema 编辑器（JSON 编辑 + 实时预览，**本迭代不做拖拽设计器**）、渲染器组件（核心资产，独立可复用）、数据查看页
- 公开填报页：`#/f/<slug>` 免登录填写（定义启用后）

## Capabilities

### New Capabilities
- `form-schema-store`: 表单定义与提交数据的存储、接口与权限（schema 版本随定义保存，数据行绑定提交时的 schema 版本）
- `form-renderer`: 按 schema 渲染表单的前端组件与服务端一致性校验
- `ai-form-generation`: 自然语言生成表单 schema 草稿

### Modified Capabilities
<!-- 无既有 spec 需要修改 -->

## Impact

- **后端**：新增 `system/form/` 模块（entities/controller/service/dto）；数据库新增两张表 `op_sys_form_schema`、`op_sys_form_entry`（TypeORM synchronize 关闭，走手写建表 SQL，可回滚）
- **前端**：`constants/routes.js` 加「表单管理」菜单（权限码 FormManagement）与公开填报路由；新增 pages/form/ 与渲染器组件
- **数据**：role 1 补权限码 `FormManagement`（一条 INSERT，可回滚）
- **依赖**：零新增第三方依赖——渲染器用现有 antd 组件拼装，AI 走既有 AiService 模式
- **边界**：不做拖拽设计器、不做多页表单、不做逻辑跳转（显隐联动）——这三样都等真实使用反馈后再定,先把"一份 schema 跑通全链路"这件事做对

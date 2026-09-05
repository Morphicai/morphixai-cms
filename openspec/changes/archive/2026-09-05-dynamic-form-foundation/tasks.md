## 1. 数据与权限

- [x] 1.1 建表 SQL：op_sys_form_schema（名称/slug/schema JSON/enabled/schema_version）、op_sys_form_entry（form_id/schema_version/data JSON/来源 IP/时间），入 db/ 目录并在库上执行；记录回滚语句
- [x] 1.2 role 1 补权限码 FormManagement（INSERT，记录回滚）

## 2. 后端 form 模块（form-schema-store + 校验）

- [x] 2.1 schema 协议校验器（纯函数）：七种类型/必填/options/min-max/x- 扩展宽容；单测覆盖合法与七类非法输入
- [x] 2.2 实体与管理接口：定义 CRUD + 启停 + 数据分页查询，控制器挂 @Perm('FormManagement')
- [x] 2.3 公开接口：GET /public/form/:slug（仅启用）、POST /public/form/:slug/entries（schema 校验 + IP 限频 10/分 + 64KB 上限），未启用一律 404
- [x] 2.4 验收：curl 全链路——无权限管理 403 / 匿名读启用定义 / 非法数据 400 指明字段 / 停用后 404 / 高频 429

## 3. AI 生成（ai-form-generation）

- [x] 3.1 POST /api/form/generate：自然语言 → AiService（提示词约束输出协议 JSON）→ 服务端校验器验证 → 返回草稿或校验错误+原始输出；挂 @Perm('FormManagement') 与用户限频
- [x] 3.2 验收：真实生成一份报名表草稿且通过校验器；构造让模型跑偏的输入验证错误路径不落库

## 4. 前端（form-renderer + 管理页 + 填报页）

- [x] 4.1 渲染器组件 SchemaFormRenderer（独立、可复用，输入 schema/初值，输出数据）
- [x] 4.2 表单管理页：定义列表（启停/填报链接复制）、编辑器（JSON 编辑 + 实时预览 + AI 生成入口）、数据查看（表格，行带 schema 版本）
- [x] 4.3 公开填报页 #/f/:slug（免登录路由,复用渲染器,提交成功态与已停用态）
- [x] 4.4 菜单「表单管理」挂 FormManagement 权限码
- [x] 4.5 验收：AI 生成→调整→保存→启用→匿名填报→数据页看到该条记录（含版本号）,全链路零代码改动

## 5. 收尾

- [x] 5.1 遗留项记录：公开接口上公网前需加验证码/token（TASKS.md）
- [x] 5.2 分模块提交（中性命名），更新 TASKS.md 当前迭代指向

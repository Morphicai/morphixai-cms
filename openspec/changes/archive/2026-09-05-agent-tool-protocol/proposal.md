# Proposal: agent-tool-protocol — 三处定位修正

上一迭代（agent-foundation）有三个设定被推翻，本迭代修正：

## 1. 工具是代码，不是数据（拍板）

原设定"工具定义存 agent-tools 数据集合"废弃——工具是**业务能力的声明**，
应该由业务方在代码里实现并声明，与业务代码同版本演进、过 code review，
而不是一份运营可改的数据。

新形态：**工具提供方协议（tool provider）**——
- 业务服务（optimus-api）在代码里注册自己贡献的工具
  （i18n 模块声明 i18n 工具，dictionary 模块声明集合工具，各归其主），
  经 `GET /system/agent/tools` 聚合暴露
- agent-service 从配置的 provider 端点列表拉工具清单（默认 optimus-api，
  将来业务方自己的服务也可以成为 provider）
- 基座也可以内置通用工具（代码级，如将来的 http_fetch），本迭代暂无
- 执行方式不变：HTTP 调业务端点 + token 透传 + 相对路径约束

## 2. 翻译单路径：全部走 Agent（拍板）

删除 i18n 模块的单轮批量翻译（translateMissing / POST /system/i18n/translate）。
管理页"AI 补全缺失语言"按钮保留 UX，底层改为向 agent-service 提交任务——
翻译从此只有一条实现路径，"不覆盖人工译文"的规则也收敛回 writeTranslation 一处。

## 3. 运营语义从基座剥离（拍板）

"运营助理"是业务叙事，不属于基础能力。基座的 system prompt 去业务化
（只保留通用执行原则），`POST /run` 接受可选 `system` 字段由调用方注入
业务人格；"智能助理"控制台页定位为一个业务消费方，不是基座的一部分。

## 验收

1. 多语言管理页点"AI 补全缺失语言"→ 实际经 agent-service 完成，缺失语言补齐、
   人工译文不被覆盖
2. `GET /system/agent/tools` 返回代码注册的工具；agent-tools 数据集合删除后
   一切照常
3. 智能助理控制台照常可用（走同一协议）
4. api 单测 + 构建通过

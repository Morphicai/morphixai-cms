## ADDED Requirements

### Requirement: 智能辅助接口
系统 SHALL 提供 `POST /api/ai/assist` 接口，接受动作类型（summary/polish/continue）与原文，返回模型生成的文本。接口 SHALL 标注 `@Perm('ContentManagement')`。

#### Scenario: 生成摘要
- **WHEN** 持有 ContentManagement 权限的用户提交动作 summary 与一段正文
- **THEN** 返回该正文的中文摘要文本

#### Scenario: 无权限调用被拒
- **WHEN** 不持有 ContentManagement 的用户调用该接口
- **THEN** 返回 403，不产生模型调用

### Requirement: 密钥零落盘
模型服务的 baseUrl、模型名、apiKey SHALL 仅从环境变量读取；仓库内任何文件（含示例配置）不得包含真实密钥。

#### Scenario: 未注入密钥时的行为
- **WHEN** 环境变量缺少 apiKey 时调用接口
- **THEN** 返回明确的"模型服务未配置"错误，而非 500 堆栈

### Requirement: 调用限频
系统 SHALL 对该接口按用户限频（默认每用户每分钟 6 次），超限返回 429。

#### Scenario: 超限拒绝
- **WHEN** 同一用户一分钟内发起第 7 次调用
- **THEN** 返回 429，且该次不消耗模型额度

### Requirement: 编辑器辅助入口
文章编辑器 SHALL 提供智能辅助入口，含生成摘要、润色、续写三个动作；生成结果由用户确认后才写入编辑器内容。

#### Scenario: 结果需确认
- **WHEN** 用户在编辑器触发"润色"并收到生成结果
- **THEN** 结果先以预览呈现，用户点击采纳后才替换正文，取消则正文不变

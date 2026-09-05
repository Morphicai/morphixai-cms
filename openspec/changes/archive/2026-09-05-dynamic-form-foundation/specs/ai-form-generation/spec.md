## ADDED Requirements

### Requirement: 自然语言生成 schema 草稿
系统 SHALL 提供接口：输入一段自然语言描述，返回符合 schema 协议的表单草稿。接口挂 `@Perm('FormManagement')` 并复用平台既有的模型接入与按用户限频。

#### Scenario: 描述生成草稿
- **WHEN** 用户输入"活动报名表：姓名、手机号、参加场次（上午/下午）、是否需要停车位"
- **THEN** 返回含 text/text/radio/switch 四个字段的合法 schema，进入编辑器待人工确认

### Requirement: 生成结果同门校验
模型输出 SHALL 经过与人工保存**完全相同**的 schema 校验；不合法时接口返回校验错误与原始输出，不得静默落库。

#### Scenario: 模型输出不合法
- **WHEN** 模型返回的 JSON 缺少字段 key 或类型未知
- **THEN** 接口返回明确校验错误，编辑器展示原始输出供手工修正，库中无任何写入

### Requirement: 草稿不自动保存
生成结果 SHALL 只进入编辑器预览，用户显式保存后才创建定义。

#### Scenario: 放弃草稿无副作用
- **WHEN** 用户生成草稿后直接离开
- **THEN** 系统中不产生任何表单定义

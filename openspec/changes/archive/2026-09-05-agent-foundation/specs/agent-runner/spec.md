## ADDED Requirements

### Requirement: 独立服务与鉴权

Agent 能力 SHALL 以独立服务（agent-service）提供，`POST /run` 须携带管理端
token，服务经 introspect 验证（active 且权限码含 AgentConsole 或 "*"）后执行；
工具调用平台接口时 SHALL 透传发起人 token（Agent 以发起人身份行动）。

#### Scenario: 无效 token 被拒
- **WHEN** 不带 token 或带伪造 token 调 /run
- **THEN** 401/403，不进入执行

#### Scenario: 解耦
- **WHEN** agent-service 停机
- **THEN** optimus-api 与两个前端全部现有功能不受影响

### Requirement: 执行循环（pi-agent-core）

runner SHALL 用 pi-agent-core 的 Agent 执行任务：模型自主调用已注册工具，
工具抛错回填给模型继续，工具调用累计超 12 次 abort 终止。

#### Scenario: 正常完成
- **WHEN** 任务可由已注册工具完成
- **THEN** run 结束返回 status=success、最终结论与完整轨迹

#### Scenario: 调用上限
- **WHEN** 模型持续调工具不收敛
- **THEN** 第 12 次后 abort，status=max_steps，已完成的工具效果保留

### Requirement: 轨迹

每次 run SHALL 返回并落盘完整轨迹：每步 assistant 文本、工具名与入参、
工具结果（截断存储）；`GET /runs` 可查最近记录。

#### Scenario: 轨迹可回放
- **WHEN** 查看某次 run
- **THEN** 能看到逐步的思考、工具入参与结果

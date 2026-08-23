# Spec: client-sdk

## Requirement: SDK 抽包

C 端 SDK（http/session/storage/business）SHALL 以 `@optimus/client-sdk` workspace
包形式存在，optimus-next 通过 re-export 薄壳消费，行为与抽包前一致。

### Scenario: 抽包无损回归
- WHEN optimus-next 切换为消费 @optimus/client-sdk 后执行构建与登录/刷新/首页流程
- THEN 全部行为与抽包前一致，构建通过

### Scenario: 无框架耦合
- WHEN 检查 client-sdk 包的依赖与 import
- THEN 不含 next/react 特定模块，可被任意 web 项目引用

## Requirement: 数据集合客户端封装

client-sdk SHALL 提供数据集合公开读写封装（list/get/create/update），
底层为 `/api/dictionary/:collection` 公开接口。

### Scenario: 活动配置读取
- WHEN 子应用以集合名调用 list
- THEN 返回该 public_read 集合的全部行（按 sortOrder 排序）

### Scenario: 写入受 schema 校验
- WHEN 向 public_write 集合提交不符合其 form schema 的行
- THEN 服务端返回 400 且指明字段，SDK 将错误透传

# Spec: i18n-public-read

## Requirement: 公开读接口

系统 SHALL 提供 `GET /api/i18n/:namespace?locale=xx`（匿名 + IP 限频），
返回该 namespace 在目标 locale 下的扁平键值 map；键在目标 locale 缺失时回退
zh-CN；namespace 不存在（无任何键）返回 404。

### Scenario: 正常读取
- WHEN 以 locale=en-US 读取 portal
- THEN 返回 { key: 英文文案 } map，已补全的键出英文

### Scenario: 回退
- WHEN 某键只有 zh-CN
- THEN en-US 请求中该键返回 zh-CN 文案

### Scenario: 未知 namespace
- WHEN 读取不存在的 namespace
- THEN 404

## Requirement: client-sdk 消费

`@optimus/client-sdk` SHALL 提供 `I18nSDK.load(namespace, locale)`，带按
namespace+locale 的内存缓存。

### Scenario: 缓存
- WHEN 同 namespace+locale 连续 load 两次
- THEN 第二次不发起 HTTP 请求

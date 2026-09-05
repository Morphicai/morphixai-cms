# i18n-management Specification

## Purpose
TBD - created by archiving change i18n-foundation. Update Purpose after archive.
## Requirements
### Requirement: 键值管理

系统 SHALL 提供 namespace+key 维度的多语言键值管理（增删改查、分页、关键字过滤），
(namespace, key) 唯一，translations 为 locale→文本的 json。

#### Scenario: 建键
- **WHEN** 管理员在 namespace `portal` 下创建 key `hero.title` 并填 zh-CN 文案
- **THEN** 列表出现该键，(portal, hero.title) 重复创建被拒

#### Scenario: 权限控制
- **WHEN** 未持有 I18nManagement 权限码的用户调用管理接口
- **THEN** 被拒绝

### Requirement: AI 补全缺失语言

系统 SHALL 提供批量 AI 补全：对指定 namespace 中缺失目标 locale 的键翻译并写回，
只填缺失项、不覆盖已有译文，单次处理上限 50 键。

#### Scenario: 补全
- **WHEN** namespace 有 3 个仅含 zh-CN 的键，请求补全 en-US 与 ja-JP
- **THEN** 3 个键的 en-US/ja-JP 出现译文，zh-CN 原文不变

#### Scenario: 不覆盖人工译文
- **WHEN** 某键已有人工填写的 en-US
- **THEN** 补全后该 en-US 保持原值


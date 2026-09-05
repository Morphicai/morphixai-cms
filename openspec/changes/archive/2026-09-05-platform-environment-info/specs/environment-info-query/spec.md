## ADDED Requirements

### Requirement: 环境基础信息查询
系统 SHALL 提供一个匿名可访问的只读接口，返回当前部署环境的名称、根域名、
cookie 域三项基础信息。

#### Scenario: 查询当前环境信息
- **WHEN** 任意调用方（无需身份鉴权）请求环境信息接口
- **THEN** 系统返回 `{environment, rootDomain, cookieDomain}`，其中 `environment`
  为 `dev`/`test`/`staging`/`prod` 之一，`rootDomain`/`cookieDomain` 与当前进程
  实际生效的 `SITE_DOMAIN`/`COOKIE_DOMAIN` 配置一致

### Requirement: 与限频约定一致
该接口 SHALL 采用与现有匿名公开接口（如 `public-i18n`）同等级别的 IP 限频策略。

#### Scenario: 超过限频阈值
- **WHEN** 同一来源 IP 在限频窗口内的请求次数超过既定阈值
- **THEN** 系统拒绝超出部分的请求，行为与现有 `public-i18n` 接口的限频响应一致

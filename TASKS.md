# Optimus CMS - Task Tracking

> 保持精简，定期清理，只留进行中的事。

## 当前迭代：dynamic-form-foundation（2026-08-21 启动，同日完成开发验收）

无代码方向第一块地基——动态表单：schema 定义 → 渲染 → 免登录填报 → 数据落库，
全程零代码改动；智能生成 schema 草稿可用。提案与任务见
`openspec/changes/dynamic-form-foundation/`。

**遗留项（上公网前必须做）**：公开填报接口目前只有 IP 限频 + 体积上限两道闸，
暴露到公网前要加验证码或一次性 token。

## 上一迭代：platform-closed-loop（2026-08-21 完成，已合 main）

平台闭环三件事，完整提案与任务清单见 `openspec/changes/platform-closed-loop/`：

1. **路由级权限**——`@Perm` 装饰器 + 守卫消费权限码，越权接口后端真拒绝（不再只是菜单看不见）
2. **智能辅助写作**——文章模块接大模型（摘要/润色/续写），密钥零落盘
3. **翻译工作台入口**——菜单 + 权限码 + 内嵌 i18n-platform

进度看 `openspec/changes/platform-closed-loop/tasks.md` 的勾选状态。

## 待拍板

（暂无——权限码漂移与 mysql2 升级已于 2026-08-22 处理完毕，见 Completed）

## 已明确推迟（闭环前不碰）

- antd v4→v5 弃用 API 清理
- dashboard 统计数据源
- optimus-next 定位裁决（现为 testing project，21k 行）
- 无标注接口的"默认拒绝"收紧（本迭代产出清单，下一轮做）
- i18n-platform 迁移为内部模块（现阶段 iframe 引用）

## Completed

- [x] 权限码漂移修复（以 routes.js 为准，NewsArticles/ActivityArticles，seed SQL + 存量库同步改名）
- [x] mysql2 2.2.5 → 3.23.4（idleTimeout+maxIdle 生效，闲置连接 60s 内回收，池医生已删除）
- [x] harness-fe 运行时观测集成（optimus-ui，projectId=optimus-admin）
- [x] 数据库连接稳定性（容器域名直连，见 CLAUDE.md 启动要点 3）
- [x] 数据库失联不再误跳安装页（App.js）

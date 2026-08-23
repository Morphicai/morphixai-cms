# Tasks: micro-frontend

## 本期(方案与标准)

- [x] 1.1 三模式需求与定位、选型矩阵(proposal)
- [x] 1.2 最终架构:通道三种/契约一份,与服务目录、权限链、OptimusCtx 的关系(design 1/7)
- [x] 1.3 Multi-Zones 机制核实(Next 16 官方文档在维)与落地设计:zone 划分原则、登录态零改造论证、目录接轨方式(design 3)
- [x] 1.4 Optimus 模块标准 v0 草案:五条契约(产物/manifest/挂载/共享依赖/隔离)+ 不实现的触发条件;nextjs-mf 弃用状态实查存档(design 4)
- [x] 1.5 可行性与风险表(design 6)

## 迭代一:第一个 zone(2026-08-24 完成)

- [x] 2.1 目录 entryType 加 zone + pathPrefix(单段小写、全域唯一,撞车报占用者);GET /api/public/zone-routes 匿名读口(主 zone 消费,限频,生产网关可屏蔽);3 个单测
- [x] 2.2 packages/zone-activity(Next16,8088,basePath /activity + assetPrefix /activity-static):SSR 页同时证明三件事——独立应用、cookie 登录态直通(introspect client 分支,zone 零登录代码)、平台集合数据直读
- [x] 2.3 optimus-next 启动时从目录拉路由表生成 rewrites(每 zone 三条:裸前缀/子路径/静态资产);目录不可达回退空表不阻启动——"管理后台管控"落点:面板登记/启停,重启主 zone 生效
- [x] 2.4 @optimus/ui-shell 暂不抽——抽象要两个用例,第二个 zone 出现时做
- [x] 2.5 验收:8086/activity 同域达 zone(页面+静态资产 200);虚构用户 zone_demo_user 登录后 zone 直接识别身份;site-features 集合内容 SSR 渲染;探测面板 6 服务全绿(zone 45ms);撞前缀负例 400;api 151 测全绿;UI 构建过

## 后续迭代二:模块标准实现(触发:第一个真实深度集成模块出现)

- [ ] 3.1 以真实用例校准标准 v0 → v1
- [ ] 3.2 基座 loader(import + sharedPeers 校验 + mount/unmount 生命周期)
- [ ] 3.3 目录 entryType 加 module;首个模块接入验收

# Tasks: micro-frontend

## 本期(方案与标准)

- [x] 1.1 三模式需求与定位、选型矩阵(proposal)
- [x] 1.2 最终架构:通道三种/契约一份,与服务目录、权限链、OptimusCtx 的关系(design 1/7)
- [x] 1.3 Multi-Zones 机制核实(Next 16 官方文档在维)与落地设计:zone 划分原则、登录态零改造论证、目录接轨方式(design 3)
- [x] 1.4 Optimus 模块标准 v0 草案:五条契约(产物/manifest/挂载/共享依赖/隔离)+ 不实现的触发条件;nextjs-mf 弃用状态实查存档(design 4)
- [x] 1.5 可行性与风险表(design 6)

## 后续迭代一:第一个 zone 拆分(触发:确定业务域,建议活动/营销页)

- [ ] 2.1 目录 entryType 加 zone + pathPrefix;URL 前缀唯一性校验
- [ ] 2.2 examples/zone-template(next + assetPrefix + basePath + cookie 身份直通样例)
- [ ] 2.3 optimus-next rewrites 表 + 跨 zone 链接排查(a 标签)+ Server Actions allowedOrigins
- [ ] 2.4 @optimus/ui-shell 公共壳包(tokens/页头页脚)
- [ ] 2.5 zone 入目录:登记/探测/面板;验收:主域路径直达 zone、登录态直通、独立部署互不拖累

## 后续迭代二:模块标准实现(触发:第一个真实深度集成模块出现)

- [ ] 3.1 以真实用例校准标准 v0 → v1
- [ ] 3.2 基座 loader(import + sharedPeers 校验 + mount/unmount 生命周期)
- [ ] 3.3 目录 entryType 加 module;首个模块接入验收

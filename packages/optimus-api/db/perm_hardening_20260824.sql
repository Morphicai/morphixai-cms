-- 权限收权迭代:为本次新增 @Perm 的 controller 补权限码,授予管理员(1)和运营(2)。
-- 这些接口此前无 @Perm(guard 无标注即放行的历史遗留),现在 fail-closed 生效后
-- 必须有码才能访问——不发码等于连超管以外的角色都进不去,发码范围与现有前端
-- 菜单权限码(routes.js 里的 ActivityCenter/PartnerManagement 等同名项)对齐。
-- 执行方式(dev): docker exec -i morphixai-cms-db-1 mysql -uroot -p*** optimus --default-character-set=utf8mb4 < 本文件
BEGIN;
INSERT IGNORE INTO `op_sys_role_menu` (`id`, `role_id`, `permission_code`) VALUES
  (74, 1, 'OrderManagement'),      (75, 2, 'OrderManagement'),
  (76, 1, 'Appointment'),          (77, 2, 'Appointment'),
  (78, 1, 'ConfigCenter'),         (79, 2, 'ConfigCenter'),
  (80, 1, 'RewardClaimRecord'),    (81, 2, 'RewardClaimRecord'),
  (82, 1, 'ActivityCenter'),       (83, 2, 'ActivityCenter'),
  (84, 1, 'PartnerManagement'),    (85, 2, 'PartnerManagement'),
  (86, 1, 'PartnerDataManagement'),(87, 2, 'PartnerDataManagement'),
  (88, 1, 'ExternalTaskReview'),   (89, 2, 'ExternalTaskReview'),
  (90, 1, 'OperationLog'),         (91, 2, 'OperationLog');
COMMIT;

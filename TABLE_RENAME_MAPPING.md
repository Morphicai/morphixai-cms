# 表名重构映射表

## 重构规则
- `sys_*` → `op_sys_*`
- `biz_*` → `op_biz_*`
- 无前缀表根据所属模块判断：
  - 系统模块（system/）→ `op_sys_*`
  - 业务模块（business/）→ `op_biz_*`

## 完整表名映射

### 系统表 (sys_* → op_sys_*)

| 原表名 | 新表名 | 说明 |
|--------|--------|------|
| `sys_database_info` | `op_sys_database_info` | 数据库信息表 |
| `sys_user` | `op_sys_user` | 系统用户表 |
| `sys_user_role` | `op_sys_user_role` | 用户角色关联表 |
| `sys_role` | `op_sys_role` | 角色表 |
| `sys_role_menu` | `op_sys_role_menu` | 角色权限表 |
| `sys_role_leader` | `op_sys_role_leader` | 角色负责人表 |
| `sys_document` | `op_sys_document` | 文档表 |
| `sys_document_perm` | `op_sys_document_perm` | 文档权限表 |
| `sys_oss` | `op_sys_oss` | 对象存储表 |
| `sys_operation_log` | `op_sys_operation_log` | 系统操作日志表 |
| `sys_category` | `op_sys_category` | 分类表 |
| `sys_article` | `op_sys_article` | 文章表 |
| `sys_article_version` | `op_sys_article_version` | 文章版本表 |
| `sys_article_operation_log` | `op_sys_article_operation_log` | 文章操作日志表 |
| `sys_database_backup` | `op_sys_database_backup` | 数据库备份表 |

### 业务表 (biz_* → op_biz_*)

| 原表名 | 新表名 | 说明 |
|--------|--------|------|
| `biz_contact` | `op_biz_contact` | 联系方式表 |
| `biz_feedback` | `op_biz_feedback` | 反馈表 |
| `biz_order` | `op_biz_order` | 订单表 |
| `biz_recharge_record` | `op_biz_recharge_record` | 充值记录表 |
| `biz_activity` | `op_biz_activity` | 活动中心表 |
| `biz_reward_claim_record` | `op_biz_reward_claim_record` | 奖励发放记录表 |
| `biz_task_completion_log` | `op_biz_task_completion_log` | 任务完成日志表 |
| `biz_external_task_submission` | `op_biz_external_task_submission` | 外部任务提交记录表 |
| `biz_partner_profile` | `op_biz_partner_profile` | 合伙人资料表 |
| `biz_partner_hierarchy` | `op_biz_partner_hierarchy` | 合伙人层级关系表 |
| `biz_partner_channel` | `op_biz_partner_channel` | 合伙人渠道表 |
| `biz_partner_admin_log` | `op_biz_partner_admin_log` | 合伙人管理员操作日志表 |
| `biz_appointment` | `op_biz_appointment` | 预约表 |

### 无前缀表（需要添加前缀）

| 原表名 | 新表名 | 分类依据 | 说明 |
|--------|--------|----------|------|
| `short_link` | `op_sys_short_link` | system/short-link | 短链表（系统功能） |
| `client_user` | `op_biz_client_user` | business/client-user | 客户端用户表（业务功能） |
| `client_user_external_account` | `op_biz_client_user_external_account` | business/client-user | 客户端用户外部账号表（业务功能） |
| `dictionary` | `op_sys_dictionary` | system/dictionary | 字典数据表（系统功能） |
| `dictionary_collection` | `op_sys_dictionary_collection` | system/dictionary | 字典集合配置表（系统功能） |

## 统计

- **系统表总数**: 15 个
- **业务表总数**: 14 个
- **无前缀表总数**: 5 个
- **总计**: 34 个表

## 分类说明

### 系统表 (op_sys_*)
系统核心功能表，包括：
- 用户权限管理（user, role, permission）
- 内容管理（article, category, document）
- 系统配置（database_info, oss, operation_log）
- 系统工具（short_link, dictionary）

### 业务表 (op_biz_*)
业务功能表，包括：
- 业务实体（order, activity, partner）
- 业务记录（task_completion_log, reward_claim_record）
- 业务关联（appointment, contact, feedback）
- 客户端用户（client_user）

## 重构步骤建议

1. **创建数据库迁移脚本**：重命名所有表
2. **更新实体文件**：修改所有 `@Entity()` 装饰器
3. **更新 SQL 文件**：修改所有种子数据和 SQL 脚本
4. **更新代码引用**：搜索并替换所有表名引用
5. **测试验证**：确保所有功能正常


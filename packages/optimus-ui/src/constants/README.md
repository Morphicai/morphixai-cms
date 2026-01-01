# 菜单常量使用说明

## 概述

`menus.js` 文件定义了系统的全量菜单配置，替代了原来在数据库中存储菜单的方式。这种方式有以下优势：

1. **版本控制**：菜单配置纳入代码版本管理
2. **类型安全**：通过常量定义避免魔法字符串
3. **易于维护**：集中管理所有菜单配置
4. **性能优化**：减少数据库查询

## 菜单结构说明

### 菜单类型
- `MENU (1)`：菜单/目录，对应页面路由
- `TAB (2)`：标签页（预留）
- `BUTTON (3)`：按钮/操作权限

### 权限编码规则
- **菜单权限**：直接使用菜单标识，如 `"Dashboard"`, `"PermUsers"`
- **按钮权限**：使用 `"模块:操作"` 格式，如 `"perm_users:edit"`, `"perm_roles:create"`

## 使用示例

### 1. 获取所有菜单权限编码
```javascript
import { getAllPermissionCodes } from '../constants/menus';

const allPermissions = getAllPermissionCodes();
console.log(allPermissions);
// ['Dashboard', 'PermGroup', 'Perm', 'system_menus:create', ...]
```

### 2. 根据用户权限生成菜单树
```javascript
import { getMenuTree } from '../constants/menus';

// 用户权限编码数组
const userPermissions = ['Dashboard', 'PermUsers', 'perm_users:edit'];

// 生成用户可访问的菜单树
const menuTree = getMenuTree(userPermissions);
```

### 3. 获取按钮权限映射
```javascript
import { getButtonPermissions } from '../constants/menus';

const buttonPerms = getButtonPermissions();
console.log(buttonPerms);
// {
//   perm_users: [
//     { action: 'edit', code: 'perm_users:edit', name: '编辑用户' },
//     { action: 'create', code: 'perm_users:create', name: '新增用户' }
//   ]
// }
```

### 4. 在组件中使用权限控制
```javascript
import { Can } from '@casl/react';
import { getMenuByCode } from '../constants/menus';

function UserManagement() {
    return (
        <div>
            <h1>用户管理</h1>
            
            {/* 按钮权限控制 */}
            <Can I="create" a="perm_users">
                <Button>新增用户</Button>
            </Can>
            
            <Can I="edit" a="perm_users">
                <Button>编辑用户</Button>
            </Can>
        </div>
    );
}
```

### 5. 替换原有的动态菜单获取
```javascript
// 原来的方式 - 从后端获取菜单
// const { data = [] } = await getAllMenu();

// 新的方式 - 使用本地菜单常量
import { getMenuTree, getAllPermissionCodes } from '../constants/menus';

// 获取用户权限（仍需要从后端获取）
const userPermissions = await getUserPermissions();

// 使用本地菜单配置生成菜单树
const menuTree = getMenuTree(userPermissions);
```

## 迁移指南

### 1. 修改路由初始化逻辑

**原来的方式**：
```javascript
// packages/optimus-ui/src/pages/routes.js
async function getDynamicRoutes() {
    const { data = [] } = await getAllMenu(); // 从后端获取菜单
    const calsJson = permToCals(data);
    return {
        calsRules: calsJson,
        routes: await normalizeDynamicRoutes(data, routesMap),
    };
}
```

**新的方式**：
```javascript
import { getMenuTree, getAllPermissionCodes } from '../constants/menus';
import { getUserPermissions } from '../apis/user'; // 只获取用户权限

async function getDynamicRoutes() {
    // 只从后端获取用户权限编码
    const userPermissions = await getUserPermissions();
    
    // 使用本地菜单配置
    const menuTree = getMenuTree(userPermissions);
    const calsJson = permToCals(menuTree);
    
    return {
        calsRules: calsJson,
        routes: await normalizeDynamicRoutes(menuTree, routesMap),
    };
}
```

### 2. 后端API调整

需要修改后端权限接口，只返回用户的权限编码数组，而不是完整的菜单结构：

```typescript
// packages/optimus-api/src/system/perm/perm.controller.ts
@Get("user/permissions")
@ApiOperation({ summary: "获取用户权限编码列表" })
async findUserPermissions(@Req() req): Promise<ResultData> {
    const permissions = await this.permService.findUserPermissionCodes(req.user.id);
    return ResultData.ok(permissions);
}
```

### 3. 权限验证优化

前端可以直接使用菜单常量进行权限验证，无需等待后端响应：

```javascript
import { getMenuByCode } from '../constants/menus';

// 检查权限是否存在
function hasPermission(code) {
    return getMenuByCode(code) !== null;
}

// 验证权限编码格式
function validatePermissionCode(code) {
    const menu = getMenuByCode(code);
    return menu ? menu.type : null;
}
```

## 维护指南

### 添加新菜单
1. 在 `SYSTEM_MENUS` 数组中添加新的菜单配置
2. 确保 `id` 唯一，`code` 遵循命名规范
3. 正确设置 `parentId` 建立父子关系
4. 添加适当的描述信息

### 修改菜单权限
1. 修改对应菜单项的 `code` 字段
2. 更新相关组件中的权限检查代码
3. 确保权限编码的一致性

### 删除菜单
1. 从 `SYSTEM_MENUS` 中移除对应配置
2. 检查并清理相关的权限检查代码
3. 更新用户角色权限配置

## 注意事项

1. **权限编码唯一性**：确保所有 `code` 字段在系统中唯一
2. **父子关系正确性**：`parentId` 必须指向存在的父菜单 `id`
3. **路径一致性**：菜单的 `path` 必须与实际路由配置一致
4. **图标名称**：`icon` 字段使用 Ant Design 图标名称
5. **排序规则**：`orderNum` 数值越大，排序越靠前

这种方式将菜单配置从数据库迁移到代码中，提高了系统的可维护性和性能。
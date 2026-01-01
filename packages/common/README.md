# Common Package - Shared Constants and Utilities

## Overview

The Common package provides shared constants and utility functions for both frontend and backend, primarily for unified permission management and menu configuration.

## Simplified Permission System

### Design Principles

1. **Menu-level Permission Control**: Only controls which menu pages users can access, no longer controls button-level operation permissions
2. **Hardcoded Menu Configuration**: All menu information is defined in code, not dependent on database storage
3. **Frontend-Backend Shared**: Menu constants are defined in the common package, frontend and backend use the same configuration
4. **Simplified Permission Verification**: Permission verification is based on menu codes, with simple and clear logic

### Core Files

- `constants/menus.js` - System menu constant definitions
- `utils/permission.js` - Permission management utility class

## Menu Configuration

### Menu Types

```javascript
export const MENU_TYPES = {
  MENU: 1,      // Menu/Directory
  TAB: 2,       // Tab
  BUTTON: 3     // Button/Action (deprecated, kept for compatibility)
};
```

### Menu Configuration Example

```javascript
{
  id: "dashboard",
  name: "Dashboard",
  code: "Dashboard",
  type: MENU_TYPES.MENU,
  path: "/",
  icon: "DashboardOutlined",
  orderNum: 99,
  parentId: null,
  description: "System homepage, displays workspace and data overview"
}
```

### Configuration Fields

- `id`: Unique menu identifier
- `name`: Menu display name
- `code`: Permission code for permission control
- `type`: Menu type (1=menu, 2=tab, 3=button deprecated)
- `path`: Frontend route path
- `icon`: Menu icon (Ant Design icon name)
- `orderNum`: Sort weight
- `parentId`: Parent menu ID
- `description`: Menu description
- `displayNone`: Whether to hide (optional)
- `children`: Child menu array (optional)

## Permission Management

### Permission Code Standards

- **Menu Permissions**: Use PascalCase, e.g., `Dashboard`, `PermUsers`, `ContactUs`
- **Super Admin**: Use `*` to indicate all permissions

### Permission Manager Usage

```javascript
import { createPermissionManager } from 'common/utils/permission';

// Create permission manager
const permissionManager = createPermissionManager(['Dashboard', 'PermUsers']);

// Check permission
const canAccessDashboard = permissionManager.hasPermission('Dashboard');

// Batch check permissions
const permissions = permissionManager.hasPermissions(['Dashboard', 'PermUsers']);

// Get accessible menus
const accessibleMenus = permissionManager.getAccessibleMenus();
```

### Menu Tree Generation

```javascript
import { getMenuTree } from 'common/constants/menus';

// Generate menu tree based on user permissions
const userPermissions = ['Dashboard', 'PermUsers'];
const menuTree = getMenuTree(userPermissions);
```

## API Interfaces

### Backend Interfaces

```typescript
// Get user permission codes
GET /api/perm/user/codes
Response: {
  success: true,
  data: ['Dashboard', 'PermUsers', 'ContactUs']
}

// Batch verify permissions
POST /api/perm/user/verify
Request: {
  permissions: ['Dashboard', 'PermUsers']
}
Response: {
  success: true,
  data: {
    'Dashboard': true,
    'PermUsers': false
  }
}

// Check single permission
GET /api/perm/user/check/:permission
Response: {
  success: true,
  data: true
}
```

## Best Practices

### Permission Design

1. **Principle of Least Privilege**: Users only get necessary menu access permissions
2. **Permission Layering**: Implement permission inheritance through menu hierarchy
3. **Permission Caching**: Cache user permission information on frontend to reduce API calls

### Development Standards

1. **Menu Configuration**: When adding new menus, add configuration in the common package
2. **Permission Verification**: Frontend permission control + backend interface verification for double protection
3. **Error Handling**: Provide friendly error prompts when permissions are insufficient

### Performance Optimization

1. **Lazy Loading**: Use React.lazy to dynamically load page components
2. **Permission Query**: Query user permission information directly from database
3. **Menu Caching**: Cache generated menu tree structure on frontend

## FAQ

### Q: How to add a new menu?

A: Add a new menu configuration in the `SYSTEM_MENUS` array in `constants/menus.js`, then add the corresponding component mapping in the frontend.

### Q: How to control user permissions?

A: Assign roles to users through role management, roles are associated with menu permissions. After user login, get the permission code list, and the frontend filters menus based on permission codes.

### Q: Why not control button permissions?

A: To simplify system complexity, the new version only controls menu-level permissions. If more granular control is needed, implement business logic judgment within pages.

### Q: How to handle permission caching?

A: Backend directly queries database to get user permission information, frontend clears local cache and re-fetches when permissions change.

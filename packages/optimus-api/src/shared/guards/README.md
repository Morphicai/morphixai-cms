# Unified Authentication Guard Usage Guide

## Overview

`UnifiedAuthGuard` is a unified authentication guard that integrates multiple guard functions, supporting three authentication modes:

1. **Admin Mode** (`ADMIN`) - Requires JWT + Role + Fine-grained permissions (default mode)
2. **Client User Mode** (`CLIENT_USER`) - Requires signature authentication
3. **Anonymous Mode** (`ANONYMOUS`) - Accessible by any user

## Usage

### 1. Admin Mode (Default)

```typescript
import { Controller, Get } from '@nestjs/common';
import { AdminAuth } from '../shared/decorators/auth-mode.decorator';

@Controller('admin')
export class AdminController {
  // Default uses admin mode, requires JWT + Role + Permission verification
  @Get('users')
  getUsers() {
    return 'Admin users list';
  }

  // Explicitly specify admin mode
  @Get('dashboard')
  @AdminAuth()
  getDashboard() {
    return 'Admin dashboard';
  }
}
```

### 2. Client User Mode

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { ClientUserAuth } from '../shared/decorators/auth-mode.decorator';

@Controller('api/client')
export class ClientController {
  @Post('order')
  @ClientUserAuth()
  createOrder(@Body() orderDto: CreateOrderDto) {
    // Requires client signature authentication
    // Request headers need: client-uid, client-sign, client-timestamp
    return 'Order created';
  }
}
```

### 3. Anonymous Mode

```typescript
import { Controller, Get } from '@nestjs/common';
import { AnonymousAuth } from '../shared/decorators/auth-mode.decorator';

@Controller('public')
export class PublicController {
  @Get('health')
  @AnonymousAuth()
  health() {
    // Any user can access
    return 'OK';
  }
}
```

## Backward Compatibility

Original decorators are still supported:

```typescript
import { AllowAnonymous } from '../shared/decorators/allow-anonymous.decorator';

@Controller('legacy')
export class LegacyController {
  @Get('public')
  @AllowAnonymous() // Still valid, equivalent to @AnonymousAuth()
  getPublicData() {
    return 'Public data';
  }
}
```

## Advanced Usage

### Combined with CASL Permission Control

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminAuth } from '../shared/decorators/auth-mode.decorator';
import { UseAbility } from '../shared/decorators/use-ability.decorator';
import { PoliciesGuard } from '../shared/guards/policies.guard';
import { Action } from '../shared/casl/action.enum';

@Controller('articles')
export class ArticleController {
  @Get()
  @AdminAuth() // Admin mode
  @UseAbility((ability) => ability.can(Action.Read, 'Article'))
  getArticles() {
    // Requires admin permission + article read permission
    return 'Articles list';
  }
}
```

## Client Signature Authentication

### Request Header Format

```
client-uid: user123
client-sign: a1b2c3d4e5f6...
client-timestamp: 1640995200
```

### Signature Generation Algorithm

```javascript
// 1. Merge parameters
const signParams = {
  uid: 'user123',
  ...requestBody,
  ...queryParams,
  timestamp: '1640995200'
};

// 2. Sort by key name and concatenate
const sortedKeys = Object.keys(signParams).sort();
const paramString = sortedKeys.map(k => `${k}=${signParams[k]}`).join('&');

// 3. Generate HMAC-SHA256 signature
const signature = crypto
  .createHmac('sha256', CLIENT_USER_SIGN_KEY)
  .update(paramString)
  .digest('hex');
```

## Environment Variables

```bash
# JWT Configuration
JWT_SECRET_KEY=your-secret-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Client Signature Key
CLIENT_USER_SIGN_KEY=your-client-sign-key

# Permission Whitelist (JSON format)
PERM_ROUTER_WHITELIST=[{"path":"/health","method":"GET"}]
```

## Error Handling

- `UnauthorizedException`: Authentication failed (Invalid token, signature error, etc.)
- `ForbiddenException`: Insufficient permissions (Role mismatch, insufficient permissions, etc.)

## Notes

1. **Default Mode**: If authentication mode is not specified, default uses admin mode (most strict)
2. **Backward Compatibility**: `@AllowAnonymous()` decorator is still valid
3. **Global Registration**: Unified guard is globally registered in `app.module.ts`
4. **Development Environment**: Client signature authentication automatically skips in development environment

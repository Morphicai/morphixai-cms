# Authentication Usage Guide

## Overview

This project provides a complete user authentication solution, including:
- Automatic login state management
- Password encryption during transmission
- JWT Token automatic refresh
- User information automatic retrieval

## Password Encryption

### Client-side Encryption

All passwords are automatically encrypted before transmission:

```typescript
import { UniversalClientUserService } from '@/lib/universal-api';

// Login - password is automatically encrypted
const response = await UniversalClientUserService.login({
  username: 'testuser',
  password: 'mypassword123' // Automatically encrypted before transmission
});

// Register - password is automatically encrypted
const response = await UniversalClientUserService.register({
  username: 'newuser',
  email: 'user@example.com',
  password: 'mypassword123', // Automatically encrypted before transmission
  nickname: 'New User'
});
```

### Backend Decryption

The backend automatically decrypts received passwords:

```typescript
// Middleware automatically handles decryption
// In Controller, received password is already plaintext
@Post('login')
async login(@Body() dto: LoginDto) {
  // dto.password is already decrypted plaintext
  const user = await this.clientUserService.login(dto);
  // ...
}
```

## User Authentication State Management

### Using AuthProvider

Wrap the application root component with `AuthProvider`:

```typescript
// app/layout.tsx
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### Using useAuthContext Hook

Get user authentication state in components:

```typescript
'use client';

import { useAuthContext } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuthContext();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please login first</div>;
  }

  return (
    <div>
      <h1>Welcome, {user?.nickname || user?.username}</h1>
      <p>Email: {user?.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Token Management

### Automatic Refresh

Token is automatically refreshed, no manual handling required:

```typescript
// useAuth Hook automatically:
// 1. Checks if token is about to expire
// 2. Automatically calls refresh interface
// 3. Updates user information
// 4. Checks every 5 minutes
```

### Manual Refresh

If manual refresh of user information is needed:

```typescript
const { refreshUser } = useAuthContext();

// Manually refresh user information
await refreshUser();
```

## Security Best Practices

### 1. Password Encryption

- ✅ All passwords automatically encrypted before transmission
- ✅ Uses AES symmetric encryption
- ✅ Keys stored in environment variables

### 2. Token Security

- ✅ Stored in HTTP-Only Cookie
- ✅ Automatic expiration and refresh mechanism
- ✅ Supports cross-domain sharing (same main domain)

### 3. Environment Variables

```bash
# Client encryption key
NEXT_PUBLIC_CRYPTO_SECRET=your-client-crypto-key

# Server encryption key
CRYPTO_SECRET=your-server-crypto-key
```

⚠️ **Note**: Production environment must use strong keys, do not use default values!

## API Interfaces

### Get Current User Information

```typescript
// Get complete user information (query database)
const profile = await UniversalClientUserService.getProfile();

// Get basic information (parsed from JWT, faster)
const currentUser = await UniversalClientUserService.getCurrentUser();
```

### Refresh Token

```typescript
const response = await UniversalClientUserService.refreshToken();
```

### Logout

```typescript
const response = await UniversalClientUserService.logout();
```

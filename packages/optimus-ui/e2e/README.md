# E2E Testing Guide

## Overview

This directory contains end-to-end (E2E) tests for the frontend application, using the Playwright framework. Test tools automatically manage the startup and shutdown of the frontend application.

## Features

- ✅ **Automatic Frontend Startup**: Automatically starts frontend application before tests (test mode)
- ✅ **Subprocess Management**: Uses subprocess to start, doesn't block main process
- ✅ **Automatic Cleanup**: Automatically closes frontend application after tests
- ✅ **Smart Detection**: If application is already running, skips startup step
- ✅ **Real API Testing**: Connects to real backend API for complete integration testing

## Directory Structure

```
e2e/
├── tests/              # Test cases
├── fixtures/           # Test fixtures (test data)
├── helpers/            # Test helper tools
│   └── app-server.js   # Frontend application server manager
├── playwright.config.js    # Playwright configuration
├── global-setup.js         # Global setup (start application)
└── global-teardown.js      # Global cleanup (close application)
```

## Running Tests

```bash
# 1. Start backend service (in another terminal)
pnpm --filter optimus-api run dev

# 2. Ensure test database is initialized
pnpm --filter optimus-api run db:seed:test

# 3. Run tests
pnpm run test:e2e

# UI Mode
pnpm run test:e2e:ui
```

**Advantages**:
- Tests real API behavior
- Verifies frontend-backend integration
- Discovers real environment issues

## How It Works

### 1. Global Setup (global-setup.js)

Executed before tests start:

1. Verify backend API availability
2. **Start frontend application** (using subprocess)
3. Wait for frontend application ready

### 2. Run Tests

Execute all test cases, frontend application runs in background.

### 3. Global Cleanup (global-teardown.js)

Executed after tests end:

1. **Close frontend application** (if started by tests)
2. Clean up resources

## Writing Tests

### Development Standards

**Important**: When writing frontend code, all interactive elements must have `data-testid` attribute.

Detailed standards: `packages/optimus-ui/docs/DEVELOP_GUIDELINES.md`

### Basic Test Structure

```javascript
import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth.js';

test.describe('Feature Module', () => {
  test('Test case description', async ({ page }) => {
    // Login
    await login(page, 'admin');
    
    // Execute operation - use data-testid
    await page.click('[data-testid="user-create-button"]');
    
    // Verify result
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });
});
```

### Element Locator Best Practices

**Always use data-testid to locate elements:**

```javascript
// ✅ Recommended: Use data-testid
await page.locator('[data-testid="login-account-input"]').fill('admin');
await page.click('[data-testid="login-submit-button"]');

// ❌ Not recommended: Use CSS selectors or text
await page.locator('input[name="account"]').fill('admin');
await page.click('text=Login');
```

## Best Practices

1. **Use semantic selectors**: Prioritize `data-testid` attribute
2. **Wait for elements**: Use `waitForSelector` instead of fixed delays
3. **Clear assertions**: Use explicit `expect` assertions
4. **Independent tests**: Each test should run independently, not depend on other tests
5. **Use data-testid**: All interactive elements must have `data-testid` attribute
6. **Reasonable waits**: Use `waitForSelector` instead of fixed delays, use `waitForURL` to wait for navigation

## Troubleshooting

### Problem 1: Frontend Application Startup Timeout

**Cause**: Application startup time too long (exceeds 120 seconds)

**Solution**:
- Check if port is occupied
- View frontend startup logs
- Increase `MAX_STARTUP_TIME` configuration

### Problem 2: Port Already Occupied

**Cause**: Port 8082 is already used by another process

**Solution**:
```bash
# Find process using port
lsof -i :8082

# Terminate process
kill -9 <PID>
```

### Problem 3: Backend API Not Ready

**Cause**: Backend service not started or test database not initialized

**Solution**:
```bash
# Start backend service
pnpm --filter optimus-api run dev

# Initialize test database
pnpm --filter optimus-api run db:seed:test
```

## Configuration

### playwright.config.js

Main configuration items:

- `testDir`: Test directory (`./tests`)
- `timeout`: Test timeout (30 seconds)
- `workers`: Concurrency (1, serial execution)
- `globalSetup`: Global setup script
- `globalTeardown`: Global cleanup script
- `use.baseURL`: Frontend application address

## Summary

1. **All interactive elements must have data-testid**
   - Buttons, inputs, selects, etc.
   - Follow naming convention: `{page}-{function}-{type}`
   - See `packages/optimus-ui/docs/DEVELOP_GUIDELINES.md` for details

2. **Ensure frontend-backend integration is normal**
   - Verify real API behavior
   - Discover real environment issues

3. **Use data-testid to locate elements**
   - ✅ Prioritize `data-testid`
   - ❌ Avoid fragile CSS selectors
   - ❌ Avoid text content selectors (internationalization issues)

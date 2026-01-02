# Test Environment Setup

## Overview

The new test initialization script has been redesigned to automatically complete the following steps before all test cases start:

1. **Database Connection Check** - Verify MySQL database connection
2. **OSS Connection Check** - Verify object storage service connection
3. **Database Initialization** - Initialize database using `optimus-minimal.sql` seed data
4. **Server Startup** - Start test server
5. **Run Tests** - Execute all test cases
6. **Preserve Data** - Do not clean database after tests, convenient for debugging

## Main Features

### 🔄 Automated Initialization
- Automatically check and create test database
- Automatically load seed data
- Automatically start required services

### 🛡️ Error Handling
- Detailed error messages and troubleshooting suggestions
- Graceful error recovery mechanism
- Connection timeout and retry mechanism

### 🐛 Debug Friendly
- Preserve database data after tests
- Detailed log output
- Database statistics

### ⚡ Performance Optimization
- Single initialization, multiple test reuse
- Smart connection management
- Parallel test support

## Usage

### Run All E2E Tests
```bash
npm run test:e2e
```

### Run Specific Tests
```bash
npm run test:auth          # Authentication related tests
npm run test:setup         # Test setup verification
```

### Check Database Configuration
```bash
npm run check:database
```

## Configuration

### E2E Test Environment Variables (.env.e2e)
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_test_database_password
DB_DATABASE=optimus_e2e

# Application Configuration
APP_PORT=8082
NODE_ENV=e2e

# Storage Configuration
STORAGE_PROVIDER=minio
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
```

## Seed Data

Tests use `db/optimus-minimal.sql` as seed data, including:

- **System Users** (sys_user)
  - admin (super admin)
  - operator (operator)  
  - user (regular user)

- **Role Permissions** (sys_role, sys_role_menu)
  - Admin role - All permissions
  - Operator role - Content management permissions
  - User role - Basic permissions

## Test Utilities

### DatabaseTestHelper
```typescript
// Get database helper
const dbHelper = getDatabaseHelper();

// Execute query
const users = await dbHelper.query('SELECT * FROM sys_user');

// Get statistics
const stats = await dbHelper.getDatabaseStats();

// Reset database (optional)
await resetDatabase();
```

## Troubleshooting

### Database Connection Failed
1. Ensure MySQL service is running
2. Check database configuration in `.env.e2e`
3. Ensure database user has CREATE permission
4. Run `npm run check:database` to diagnose issues

### Server Startup Failed
1. Check if port is occupied
2. Ensure all dependencies are installed
3. Check environment variable configuration
4. View server startup logs

### OSS Connection Failed
1. Ensure MinIO service is running (if using MinIO)
2. Check storage configuration
3. Verify access keys

### Seed Data Loading Failed
1. Ensure `db/optimus-minimal.sql` file exists
2. Check SQL syntax
3. Ensure database user has sufficient permissions

## Best Practices

### Test Isolation
- Each test file should be independent
- Use transactions or data cleanup to ensure tests don't affect each other
- Avoid depending on specific data states

### Performance Optimization
- Use `beforeAll` and `afterAll` for setup and cleanup
- Avoid repeated initialization in each test
- Reasonably use test timeout settings

### Debugging Tips
- Use `getDatabaseStats()` to check data state
- View detailed log output
- Check database data after tests

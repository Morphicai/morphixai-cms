# Development Guidelines

## E2E Testing Standards

### data-testid Specification

All interactive elements must have `data-testid` attribute, naming format: `{page/module}-{function}-{element-type}`

**Elements that must be added**:
- Buttons, inputs, selects, links
- Form items, modals, table action columns
- Navigation menu items, tabs

**Example**:
```jsx
<Input data-testid="login-account-input" />
<Button data-testid="login-submit-button">Login</Button>
<Modal data-testid="user-create-modal" />
```

**Element Type Suffixes**:
`button`, `input`, `select`, `checkbox`, `radio`, `link`, `modal`, `drawer`, `table`, `form`, `menu`, `tab`

### Test Case Writing

```javascript
// ✅ Recommended: Use data-testid
await page.locator('[data-testid="login-account-input"]').fill('admin');
await page.click('[data-testid="login-submit-button"]');

// ❌ Not recommended: Use CSS selectors or text content
await page.locator('input[name="account"]').fill('admin');
await page.click('text=Login');
```

### Code Iteration Notes

- ❌ Do not arbitrarily modify existing `data-testid`
- ✅ If modification is necessary, synchronously update related test cases
- ✅ When refactoring, prioritize maintaining original `data-testid`

## Development Environment Configuration

### Test Environment Special Handling

**Captcha Handling**:
```jsx
<Form.Item
  name="verifyCode"
  rules={[{
    required: process.env.NODE_ENV === 'production',
    message: "Please enter verification code",
  }]}
>
  <Input data-testid="login-captcha-input" />
</Form.Item>
```

**Environment Notice**:
```jsx
{process.env.NODE_ENV !== 'production' && (
  <div className="dev-notice">
    ℹ️ Development/Test mode: Captcha not required
  </div>
)}
```

### Test Data Management

**Default Test Accounts**:
- Admin: admin / admin123
- Regular User: testuser / test123

## Code Review Checklist

**E2E Testing Related**:
- [ ] Are new interactive elements added with `data-testid`?
- [ ] Does `data-testid` naming comply with specifications?
- [ ] Are existing `data-testid` modified (need to sync update tests)?
- [ ] Is development/test environment special handling correct?

**Code Quality**:
- [ ] Does code comply with project coding standards?
- [ ] Is there appropriate error handling?
- [ ] Are necessary comments provided?
- [ ] Are there obvious performance issues?

## Deployment Process Standards

### Environment Configuration

**Test Environment Variables**:
```bash
NODE_ENV=test
SKIP_CAPTCHA=true
```

**Production Environment Checks**:
- [ ] Remove all test-related debug code
- [ ] Confirm environment variable configuration is correct
- [ ] Verify `data-testid` does not affect production performance

### Release Checklist

- [ ] All E2E tests pass
- [ ] Code review completed
- [ ] Environment configuration confirmed
- [ ] Test data cleaned

## Best Practices

1. **Write Testable Code** - Every developer's responsibility
2. **Maintain Test Stability** - Use `data-testid` instead of CSS selectors
3. **Environment Isolation** - Test features do not affect production environment
4. **Continuous Improvement** - Regularly review and optimize development processes

# Test Utilities for React 18 and Ant Design 5

This module provides custom test utilities configured for React 18 and Ant Design 5 compatibility.

## Overview

The test utilities wrap components with necessary providers (ConfigProvider, BrowserRouter) to ensure components render correctly in tests with all required context.

## Usage

### Basic Usage

Instead of importing from `@testing-library/react`, import from `./test-utils`:

```javascript
// ❌ Old way
import { render, screen } from '@testing-library/react';

// ✅ New way
import { render, screen } from './utils/test-utils';
```

### Example Test

```javascript
import React from 'react';
import { render, screen, fireEvent } from './utils/test-utils';
import { Button, Form, Input } from 'antd';

describe('MyComponent', () => {
  it('should render with Ant Design theme', () => {
    render(<Button type="primary">Click Me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click Me');
  });

  it('should handle form submission', async () => {
    const onFinish = jest.fn();
    
    render(
      <Form onFinish={onFinish}>
        <Form.Item name="username">
          <Input placeholder="Username" />
        </Form.Item>
        <Button htmlType="submit">Submit</Button>
      </Form>
    );

    const input = screen.getByPlaceholderText('Username');
    fireEvent.change(input, { target: { value: 'testuser' } });
    
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    // Add assertions
  });
});
```

### Custom Provider Props

You can customize the ConfigProvider or BrowserRouter props:

```javascript
import { render } from './utils/test-utils';
import enUS from 'antd/locale/en_US';

// Custom locale
render(<MyComponent />, {
  providerProps: {
    locale: enUS,
  },
});

// Custom theme
render(<MyComponent />, {
  providerProps: {
    theme: {
      token: {
        colorPrimary: '#ff0000',
      },
    },
  },
});

// Custom router initial entries
render(<MyComponent />, {
  routerProps: {
    initialEntries: ['/dashboard'],
  },
});
```

## What's Included

### Providers

1. **ConfigProvider**: Provides Ant Design configuration with:
   - Chinese locale (zh_CN)
   - Application theme from `src/theme`
   - Custom provider props (optional)

2. **BrowserRouter**: Provides routing context with:
   - React Router v7 future flags enabled
   - Custom router props (optional)

### Mocks (in setupTests.js)

The following are automatically mocked for all tests:

1. **window.matchMedia**: Required for responsive Ant Design components
2. **IntersectionObserver**: Required for components using intersection detection
3. **ResizeObserver**: Required for Ant Design 5 components that observe size changes

### Console Warning Suppression

Known React 18 warnings are suppressed in tests:
- ReactDOM.render deprecation warnings
- useLayoutEffect warnings
- HTMLFormElement.prototype.submit warnings

## Best Practices

### 1. Use Custom Render

Always use the custom render function from test-utils:

```javascript
import { render } from './utils/test-utils';
```

### 2. Test User Interactions

Use `@testing-library/user-event` for more realistic user interactions:

```javascript
import { render, screen } from './utils/test-utils';
import userEvent from '@testing-library/user-event';

it('should handle user input', async () => {
  const user = userEvent.setup();
  render(<Input />);
  
  const input = screen.getByRole('textbox');
  await user.type(input, 'Hello World');
  
  expect(input).toHaveValue('Hello World');
});
```

### 3. Wait for Async Updates

Use `waitFor` for async operations:

```javascript
import { render, screen, waitFor } from './utils/test-utils';

it('should load data', async () => {
  render(<MyComponent />);
  
  await waitFor(() => {
    expect(screen.getByText('Loaded Data')).toBeInTheDocument();
  });
});
```

### 4. Query Best Practices

Follow Testing Library's query priority:

1. `getByRole` - Most accessible
2. `getByLabelText` - For form fields
3. `getByPlaceholderText` - For inputs
4. `getByText` - For non-interactive elements
5. `getByTestId` - Last resort

```javascript
// ✅ Good
const button = screen.getByRole('button', { name: /submit/i });

// ❌ Avoid
const button = screen.getByTestId('submit-button');
```

## Troubleshooting

### Issue: "Cannot find module './utils/test-utils'"

Make sure you're using the correct relative path from your test file:

```javascript
// If test is in src/components/MyComponent.test.js
import { render } from '../utils/test-utils';

// If test is in src/pages/dashboard/Dashboard.test.js
import { render } from '../../utils/test-utils';
```

### Issue: "matchMedia is not a function"

This should be automatically mocked in `setupTests.js`. If you still see this error, ensure `setupTests.js` is being loaded by Jest.

### Issue: Ant Design components not rendering

Make sure you're using the custom render function from test-utils, not the default one from @testing-library/react.

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode (for development)
pnpm test -- --watch

# Run tests with coverage
pnpm test -- --coverage

# Run specific test file
pnpm test -- MyComponent.test.js
```

## References

- [Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [React 18 Testing Guide](https://react.dev/learn/testing)
- [Ant Design Testing](https://ant.design/docs/react/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

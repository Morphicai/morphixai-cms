/**
 * Theme Integration Test
 * Verifies that the theme system is properly integrated into the application
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../ThemeProvider';
import { useTheme } from '../useTheme';

// Test component that uses the theme
const TestComponent = () => {
  const { themeMode, theme, isDark } = useTheme();
  
  return (
    <div>
      <div data-testid="theme-mode">{themeMode}</div>
      <div data-testid="is-dark">{isDark ? 'true' : 'false'}</div>
      <div data-testid="primary-color">{theme.colors.primary}</div>
      <div data-testid="bg-primary">{theme.colors.bgPrimary}</div>
    </div>
  );
};

describe('Theme Integration', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should provide theme context to child components', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Verify theme mode is accessible
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('light');
    expect(screen.getByTestId('is-dark')).toHaveTextContent('false');
    
    // Verify theme colors are accessible
    expect(screen.getByTestId('primary-color')).toHaveTextContent('#6C5CE7');
    expect(screen.getByTestId('bg-primary')).toHaveTextContent('#FFFFFF');
  });

  it('should apply data-theme attribute to document', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Verify data-theme attribute is set
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('should work with nested components', () => {
    const NestedComponent = () => {
      const { theme } = useTheme();
      return <div data-testid="nested-color">{theme.colors.primary}</div>;
    };

    render(
      <ThemeProvider>
        <div>
          <TestComponent />
          <NestedComponent />
        </div>
      </ThemeProvider>
    );

    // Verify nested component can access theme
    expect(screen.getByTestId('nested-color')).toHaveTextContent('#6C5CE7');
  });

  it('should throw error when useTheme is used outside ThemeProvider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    const ComponentWithoutProvider = () => {
      try {
        useTheme();
        return <div>Should not render</div>;
      } catch (error) {
        return <div data-testid="error-message">{error.message}</div>;
      }
    };

    render(<ComponentWithoutProvider />);

    expect(screen.getByTestId('error-message')).toHaveTextContent(
      'useTheme must be used within ThemeProvider'
    );

    // Restore console.error
    console.error = originalError;
  });
});

/**
 * Theme Performance Test
 * Verifies that theme switching is fast and doesn't cause unnecessary re-renders
 */

import React, { useState } from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { ThemeProvider } from '../ThemeProvider';
import { useTheme } from '../useTheme';

// Test component with theme switcher
const TestComponentWithSwitcher = () => {
  const { themeMode, toggleTheme } = useTheme();
  
  return (
    <div>
      <div data-testid="theme-mode">{themeMode}</div>
      <button data-testid="toggle-button" onClick={toggleTheme}>
        Toggle Theme
      </button>
    </div>
  );
};

// Component to track render count
let renderCount = 0;
const RenderCountComponent = React.memo(() => {
  renderCount++;
  const { themeMode } = useTheme();
  return <div data-testid="render-count">{renderCount}</div>;
});

describe('Theme Performance', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset render count
    renderCount = 0;
  });

  it('should switch theme within 100ms', () => {
    render(
      <ThemeProvider>
        <TestComponentWithSwitcher />
      </ThemeProvider>
    );

    const toggleButton = screen.getByTestId('toggle-button');
    const themeModeElement = screen.getByTestId('theme-mode');

    // Verify initial state
    expect(themeModeElement).toHaveTextContent('light');

    // Measure theme switch performance
    const startTime = performance.now();
    
    fireEvent.click(toggleButton);
    
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Verify theme switched
    expect(themeModeElement).toHaveTextContent('dark');
    
    // Verify performance requirement (100ms)
    expect(duration).toBeLessThan(100);
  });

  it('should not cause unnecessary re-renders', () => {
    const ParentComponent = () => {
      const [count, setCount] = useState(0);
      
      return (
        <div>
          <button data-testid="increment" onClick={() => setCount(count + 1)}>
            Increment
          </button>
          <div data-testid="count">{count}</div>
          <RenderCountComponent />
        </div>
      );
    };

    render(
      <ThemeProvider>
        <ParentComponent />
      </ThemeProvider>
    );

    // Initial render
    expect(renderCount).toBe(1);

    // Increment parent state - should not re-render RenderCountComponent due to React.memo
    const incrementButton = screen.getByTestId('increment');
    fireEvent.click(incrementButton);

    // RenderCountComponent should not re-render because theme didn't change
    // and it's wrapped in React.memo
    expect(renderCount).toBe(1);
  });

  it('should only re-render when theme actually changes', () => {
    render(
      <ThemeProvider>
        <TestComponentWithSwitcher />
        <RenderCountComponent />
      </ThemeProvider>
    );

    // Initial render
    const initialRenderCount = renderCount;
    expect(initialRenderCount).toBe(1);

    // Toggle theme - should cause re-render
    const toggleButton = screen.getByTestId('toggle-button');
    fireEvent.click(toggleButton);

    // Should have re-rendered once
    expect(renderCount).toBe(initialRenderCount + 1);

    // Toggle theme again - should cause another re-render
    fireEvent.click(toggleButton);

    // Should have re-rendered twice total
    expect(renderCount).toBe(initialRenderCount + 2);
  });

  it('should update document attribute quickly', () => {
    render(
      <ThemeProvider>
        <TestComponentWithSwitcher />
      </ThemeProvider>
    );

    const toggleButton = screen.getByTestId('toggle-button');

    // Verify initial state
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    // Measure document update performance
    const startTime = performance.now();
    
    fireEvent.click(toggleButton);
    
    // Check that document attribute is updated
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should be very fast (well under 100ms)
    expect(duration).toBeLessThan(100);
  });

  it('should handle rapid theme switches efficiently', () => {
    render(
      <ThemeProvider>
        <TestComponentWithSwitcher />
      </ThemeProvider>
    );

    const toggleButton = screen.getByTestId('toggle-button');
    const themeModeElement = screen.getByTestId('theme-mode');

    // Perform multiple rapid switches
    const startTime = performance.now();
    
    for (let i = 0; i < 10; i++) {
      fireEvent.click(toggleButton);
    }
    
    const endTime = performance.now();
    const totalDuration = endTime - startTime;
    const averageDuration = totalDuration / 10;

    // Each switch should average well under 100ms
    expect(averageDuration).toBeLessThan(100);

    // Verify final state (should be light after 10 toggles)
    expect(themeModeElement).toHaveTextContent('light');
  });

  it('should persist theme preference without performance impact', () => {
    render(
      <ThemeProvider>
        <TestComponentWithSwitcher />
      </ThemeProvider>
    );

    const toggleButton = screen.getByTestId('toggle-button');

    // Measure performance including localStorage write
    const startTime = performance.now();
    
    fireEvent.click(toggleButton);
    
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Verify localStorage was updated
    expect(localStorage.getItem('optimus-theme-mode')).toBe('dark');

    // Should still be fast even with localStorage write
    expect(duration).toBeLessThan(100);
  });
});

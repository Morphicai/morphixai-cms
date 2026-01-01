# ThemeSwitcher Component

Theme switcher component providing light/dark theme switching functionality.

## Features

- ✅ Uses Ant Design Switch component for switching
- ✅ Includes sun and moon icons, intuitively showing current theme state
- ✅ Smooth transition animation effects
- ✅ Responsive design, adapts to mobile and desktop
- ✅ Keyboard navigation and accessibility support
- ✅ Automatically highlights currently active theme icon

## Usage

### Basic Usage

```jsx
import { ThemeSwitcher } from '../../components/ThemeSwitcher';

function Header() {
  return (
    <div className="header">
      <ThemeSwitcher />
    </div>
  );
}
```

### Custom Styles

```jsx
import { ThemeSwitcher } from '../../components/ThemeSwitcher';

function Header() {
  return (
    <div className="header">
      <ThemeSwitcher className="custom-theme-switcher" />
    </div>
  );
}
```

## Props

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| className | string | - | Custom class name |

## Dependencies

- React 18+
- Ant Design 5.x
- @ant-design/icons
- Theme system (ThemeProvider, useTheme)

## Notes

1. **Must be used within ThemeProvider**: Component depends on ThemeContext, must ensure application is wrapped by ThemeProvider
2. **CSS Variable Support**: Component uses CSS variables for theme switching, ensure browser supports CSS variables
3. **Accessibility**: Component includes aria-label attribute, supports screen readers

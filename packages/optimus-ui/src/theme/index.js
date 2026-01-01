/**
 * 主题系统入口文件
 * 导出所有主题相关的模块
 */

// 主题配置
export { lightTheme } from './themes/light';
export { darkTheme } from './themes/dark';

// 主题上下文和 Hooks
export { ThemeContext } from './ThemeContext';
export { ThemeProvider } from './ThemeProvider';
export { useTheme } from './useTheme';
export { default as ThemeErrorBoundary } from './ThemeErrorBoundary';

// 设计令牌
export { colorTokens } from './tokens/colors';
export { shadowTokens } from './tokens/shadows';
export { typographyTokens } from './tokens/typography';
export { spacingTokens } from './tokens/spacing';

// 向后兼容：提供默认导出用于旧的 Ant Design ConfigProvider
// 这是一个临时的兼容层，应该在迁移到 ThemeProvider 后移除
const legacyTheme = {
  token: {
    colorPrimary: '#6C5CE7',
    borderRadius: 8,
    fontSize: 14,
    colorSuccess: '#00B894',
    colorWarning: '#FDCB6E',
    colorError: '#D63031',
    colorInfo: '#74B9FF',
  },
  components: {
    Layout: {
      siderBg: '#FFFFFF',
      headerBg: '#FFFFFF',
      bodyBg: '#F5F5F7',
    },
    Menu: {
      itemBg: 'transparent',
    },
  },
};

export default legacyTheme;

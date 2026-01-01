/**
 * 亮色主题配置
 * 组合所有令牌创建完整的亮色主题
 */

import { colorTokens } from '../tokens/colors';
import { shadowTokens } from '../tokens/shadows';
import { typographyTokens } from '../tokens/typography';
import { spacingTokens } from '../tokens/spacing';

export const lightTheme = {
  mode: 'light',
  
  colors: {
    ...colorTokens.light,
  },
  
  shadows: {
    ...shadowTokens.light,
  },
  
  typography: {
    ...typographyTokens,
  },
  
  spacing: {
    ...spacingTokens,
  },
};


/**
 * 暗色主题配置
 * 组合所有令牌创建完整的暗色主题
 */

import { colorTokens } from '../tokens/colors';
import { shadowTokens } from '../tokens/shadows';
import { typographyTokens } from '../tokens/typography';
import { spacingTokens } from '../tokens/spacing';

export const darkTheme = {
  mode: 'dark',
  
  colors: {
    ...colorTokens.dark,
  },
  
  shadows: {
    ...shadowTokens.dark,
  },
  
  typography: {
    ...typographyTokens,
  },
  
  spacing: {
    ...spacingTokens,
  },
};


/**
 * 间距令牌配置
 * 定义统一的间距系统
 */

export const spacingTokens = {
  // 基础间距单位 (4px)
  unit: 4,
  
  // 间距值 (以 px 为单位)
  spacing: {
    0: '0px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
    24: '96px',
  },
  
  // 边距预设
  margin: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  
  // 内边距预设
  padding: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  
  // 间隙预设 (用于 flex/grid)
  gap: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  }
};

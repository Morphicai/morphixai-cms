/**
 * 颜色令牌配置
 * 定义亮色和暗色主题的完整颜色系统
 */

export const colorTokens = {
  light: {
    // 主色
    primary: '#6C5CE7',
    primaryHover: '#5F4FD1',
    primaryActive: '#5243C2',
    
    // 背景色
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F5F5F7',
    bgTertiary: '#EBEBED',
    bgElevated: '#FFFFFF',
    
    // 文本色
    textPrimary: '#2D3436',
    textSecondary: '#636E72',
    textTertiary: '#95A5A6',
    textDisabled: '#B2BEC3',
    
    // 边框色
    borderPrimary: '#DFE6E9',
    borderSecondary: '#EBEBED',
    
    // 状态色
    success: '#00B894',
    warning: '#FDCB6E',
    error: '#D63031',
    info: '#74B9FF',
    
    // 图表色
    chart: {
      blue: ['#4A90E2', '#74B9FF', '#A8D8FF'],
      purple: ['#6C5CE7', '#A29BFE', '#D6D1FF'],
      green: ['#00B894', '#55EFC4', '#A8FFE5'],
      orange: ['#FDCB6E', '#FFE5A3', '#FFF3D4'],
    }
  },
  
  dark: {
    // 主色
    primary: '#A855F7',
    primaryHover: '#C084FC',
    primaryActive: '#D8B4FE',
    
    // 背景色
    bgPrimary: '#1A1D29',
    bgSecondary: '#252A3D',
    bgTertiary: '#2D3348',
    bgElevated: '#2D3348',
    
    // 文本色
    textPrimary: '#E5E7EB',
    textSecondary: '#9CA3AF',
    textTertiary: '#6B7280',
    textDisabled: '#4B5563',
    
    // 边框色
    borderPrimary: '#374151',
    borderSecondary: '#2D3348',
    
    // 状态色
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    
    // 图表色
    chart: {
      blue: ['#3B82F6', '#60A5FA', '#93C5FD'],
      purple: ['#A855F7', '#C084FC', '#E9D5FF'],
      green: ['#10B981', '#34D399', '#6EE7B7'],
      orange: ['#F59E0B', '#FBBF24', '#FCD34D'],
    }
  }
};

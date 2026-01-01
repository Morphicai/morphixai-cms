/**
 * ThemeProvider 组件
 * 管理主题状态和切换逻辑,集成 localStorage 和 Ant Design ConfigProvider
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { ThemeContext } from './ThemeContext';
import { lightTheme } from './themes/light';
import { darkTheme } from './themes/dark';
import {
  THEME_STORAGE_KEY,
  VALID_THEME_MODES,
  DEFAULT_THEME_MODE,
  isValidThemeMode,
  safeGetLocalStorage,
  safeSetLocalStorage,
  safeRemoveLocalStorage,
  getBrowserEnvironment,
} from './utils/validation';

/**
 * 从 localStorage 安全地读取主题偏好
 * @returns {string} 有效的主题模式或默认值
 */
const loadThemePreference = () => {
  const stored = safeGetLocalStorage(THEME_STORAGE_KEY);
  
  // 如果没有存储的值,使用默认主题
  if (!stored) {
    return DEFAULT_THEME_MODE;
  }

  // 验证存储的值是否有效
  if (isValidThemeMode(stored)) {
    return stored;
  }

  // 如果存储的值无效,清除它并使用默认主题
  console.warn(`Invalid theme mode "${stored}" found in localStorage, resetting to default`);
  safeRemoveLocalStorage(THEME_STORAGE_KEY);
  return DEFAULT_THEME_MODE;
};

/**
 * 安全地保存主题偏好到 localStorage
 * @param {string} mode - 要保存的主题模式
 * @returns {boolean} 是否保存成功
 */
const saveThemePreference = (mode) => {
  // 验证主题模式
  if (!isValidThemeMode(mode)) {
    console.error(`Invalid theme mode "${mode}", cannot save to localStorage`);
    return false;
  }

  return safeSetLocalStorage(THEME_STORAGE_KEY, mode);
};

export const ThemeProvider = ({ children }) => {
  // 从 localStorage 读取主题偏好,默认为 light
  const [themeMode, setThemeMode] = useState(() => loadThemePreference());

  // 检查浏览器环境和功能支持
  useEffect(() => {
    const env = getBrowserEnvironment();
    
    // 警告：不支持 CSS 变量
    if (!env.supportsCSSVariables) {
      console.warn(
        'Your browser does not support CSS variables. ' +
        'The theme system will use fallback styles, but some features may not work correctly. ' +
        'Please consider upgrading to a modern browser.'
      );
    }

    // 警告：不支持 localStorage
    if (!env.supportsLocalStorage) {
      console.warn(
        'localStorage is not available. ' +
        'Theme preferences will not be persisted across sessions.'
      );
    }

    // 开发环境下输出环境信息
    if (process.env.NODE_ENV === 'development') {
      console.log('Theme system environment:', env);
    }
  }, []);

  // 切换主题 - 使用 useCallback 优化性能,避免不必要的重新渲染
  const toggleTheme = useCallback(() => {
    setThemeMode(prev => {
      // 验证当前主题模式
      if (!isValidThemeMode(prev)) {
        console.warn(`Invalid current theme mode "${prev}", resetting to default`);
        return DEFAULT_THEME_MODE;
      }
      
      // 切换到另一个主题
      const newMode = prev === 'light' ? 'dark' : 'light';
      return newMode;
    });
  }, []);

  // 持久化主题偏好
  useEffect(() => {
    // 验证主题模式
    if (!isValidThemeMode(themeMode)) {
      console.error(`Invalid theme mode "${themeMode}", resetting to default`);
      setThemeMode(DEFAULT_THEME_MODE);
      return;
    }

    // 保存到 localStorage
    saveThemePreference(themeMode);
    
    // 更新 document 的 data-theme 属性,用于 CSS 变量
    try {
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.setAttribute('data-theme', themeMode);
      }
    } catch (error) {
      console.error('Failed to set data-theme attribute:', error);
    }
  }, [themeMode]);

  // 获取当前主题配置 - 使用 useMemo 优化性能
  const currentTheme = useMemo(() => {
    return themeMode === 'light' ? lightTheme : darkTheme;
  }, [themeMode]);

  // Ant Design 主题配置 - 使用 useMemo 优化性能
  const antdConfig = useMemo(() => ({
    algorithm: themeMode === 'light' ? antdTheme.defaultAlgorithm : antdTheme.darkAlgorithm,
    token: {
      // 主色配置
      colorPrimary: currentTheme.colors.primary,
      colorPrimaryHover: currentTheme.colors.primaryHover,
      colorPrimaryActive: currentTheme.colors.primaryActive,
      
      // 背景色配置
      colorBgContainer: currentTheme.colors.bgElevated,
      colorBgLayout: currentTheme.colors.bgSecondary,
      colorBgElevated: currentTheme.colors.bgElevated,
      colorBgSpotlight: currentTheme.colors.bgTertiary,
      
      // 文本色配置
      colorText: currentTheme.colors.textPrimary,
      colorTextSecondary: currentTheme.colors.textSecondary,
      colorTextTertiary: currentTheme.colors.textTertiary,
      colorTextDisabled: currentTheme.colors.textDisabled,
      
      // 边框色配置
      colorBorder: currentTheme.colors.borderPrimary,
      colorBorderSecondary: currentTheme.colors.borderSecondary,
      
      // 状态色配置
      colorSuccess: currentTheme.colors.success,
      colorWarning: currentTheme.colors.warning,
      colorError: currentTheme.colors.error,
      colorInfo: currentTheme.colors.info,
      
      // 基础配置
      borderRadius: 8,
      fontSize: 14,
      fontFamily: currentTheme.typography.fontFamily.base,
      
      // 阴影配置
      boxShadow: currentTheme.shadows.sm,
      boxShadowSecondary: currentTheme.shadows.md,
    },
    components: {
      // Layout 组件配置
      Layout: {
        siderBg: currentTheme.colors.bgPrimary,
        headerBg: currentTheme.colors.bgElevated,
        bodyBg: currentTheme.colors.bgSecondary,
        footerBg: currentTheme.colors.bgElevated,
        triggerBg: currentTheme.colors.primary,
        triggerColor: '#FFFFFF',
      },
      
      // Menu 组件配置 - 主题色和交互状态
      Menu: {
        itemBg: 'transparent',
        itemColor: currentTheme.colors.textSecondary,
        itemHoverBg: currentTheme.colors.bgSecondary,
        itemHoverColor: currentTheme.colors.textPrimary,
        itemSelectedBg: currentTheme.colors.primary + '15',
        itemSelectedColor: currentTheme.colors.primary,
        itemActiveBg: currentTheme.colors.primary + '20',
        subMenuItemBg: 'transparent',
        groupTitleColor: currentTheme.colors.textTertiary,
        iconSize: 16,
        iconMarginInlineEnd: 10,
      },
      
      // Card 组件配置 - 阴影和背景色
      Card: {
        colorBgContainer: currentTheme.colors.bgElevated,
        colorBorderSecondary: currentTheme.colors.borderSecondary,
        boxShadow: currentTheme.shadows.md,
        boxShadowTertiary: currentTheme.shadows.sm,
        headerBg: 'transparent',
        headerFontSize: 16,
        headerFontSizeSM: 14,
        headerHeight: 56,
        headerHeightSM: 48,
        paddingLG: 24,
        padding: 16,
      },
      
      // Table 组件配置 - 表头和行样式
      Table: {
        colorBgContainer: currentTheme.colors.bgElevated,
        headerBg: currentTheme.colors.bgSecondary,
        headerColor: currentTheme.colors.textPrimary,
        headerSortActiveBg: currentTheme.colors.bgTertiary,
        headerSortHoverBg: currentTheme.colors.bgTertiary,
        rowHoverBg: currentTheme.colors.bgSecondary,
        rowSelectedBg: currentTheme.colors.primary + '10',
        rowSelectedHoverBg: currentTheme.colors.primary + '15',
        borderColor: currentTheme.colors.borderSecondary,
        footerBg: currentTheme.colors.bgSecondary,
        cellPaddingBlock: 12,
        cellPaddingInline: 16,
      },
      
      // Form 组件配置 - 输入框和标签样式
      Form: {
        labelColor: currentTheme.colors.textPrimary,
        labelFontSize: 14,
        labelHeight: 32,
        labelColonMarginInlineStart: 2,
        labelColonMarginInlineEnd: 8,
        itemMarginBottom: 24,
        verticalLabelPadding: '0 0 8px',
      },
      
      // Input 组件配置
      Input: {
        colorBgContainer: currentTheme.colors.bgElevated,
        colorBorder: currentTheme.colors.borderPrimary,
        colorText: currentTheme.colors.textPrimary,
        colorTextPlaceholder: currentTheme.colors.textTertiary,
        hoverBorderColor: currentTheme.colors.primary,
        activeBorderColor: currentTheme.colors.primary,
        activeShadow: `0 0 0 2px ${currentTheme.colors.primary}20`,
        paddingBlock: 8,
        paddingInline: 12,
      },
      
      // Select 组件配置
      Select: {
        colorBgContainer: currentTheme.colors.bgElevated,
        colorBorder: currentTheme.colors.borderPrimary,
        colorText: currentTheme.colors.textPrimary,
        colorTextPlaceholder: currentTheme.colors.textTertiary,
        optionSelectedBg: currentTheme.colors.primary + '15',
        optionSelectedColor: currentTheme.colors.primary,
        optionActiveBg: currentTheme.colors.bgSecondary,
        selectorBg: currentTheme.colors.bgElevated,
      },
      
      // Button 组件配置 - 颜色和悬停状态
      Button: {
        colorPrimary: currentTheme.colors.primary,
        colorPrimaryHover: currentTheme.colors.primaryHover,
        colorPrimaryActive: currentTheme.colors.primaryActive,
        colorPrimaryBorder: currentTheme.colors.primary,
        primaryShadow: `0 2px 0 ${currentTheme.colors.primary}20`,
        defaultBg: currentTheme.colors.bgElevated,
        defaultBorderColor: currentTheme.colors.borderPrimary,
        defaultColor: currentTheme.colors.textPrimary,
        defaultHoverBg: currentTheme.colors.bgSecondary,
        defaultHoverBorderColor: currentTheme.colors.primary,
        defaultHoverColor: currentTheme.colors.primary,
        defaultActiveBg: currentTheme.colors.bgTertiary,
        defaultActiveBorderColor: currentTheme.colors.primaryActive,
        defaultActiveColor: currentTheme.colors.primaryActive,
        dangerColor: currentTheme.colors.error,
        dangerShadow: `0 2px 0 ${currentTheme.colors.error}20`,
        paddingContentHorizontal: 16,
        contentFontSize: 14,
        contentFontSizeLG: 16,
        contentFontSizeSM: 14,
      },
      
      // Modal 组件配置 - 遮罩和内容样式
      Modal: {
        contentBg: currentTheme.colors.bgElevated,
        headerBg: currentTheme.colors.bgElevated,
        footerBg: 'transparent',
        titleColor: currentTheme.colors.textPrimary,
        titleFontSize: 16,
        colorIcon: currentTheme.colors.textSecondary,
        colorIconHover: currentTheme.colors.textPrimary,
        boxShadow: currentTheme.shadows.xl,
        borderRadiusLG: 8,
        paddingContentHorizontalLG: 24,
        paddingMD: 20,
      },
      
      // Drawer 组件配置 - 遮罩和内容样式
      Drawer: {
        colorBgElevated: currentTheme.colors.bgElevated,
        colorBgMask: themeMode === 'dark' ? 'rgba(0, 0, 0, 0.65)' : 'rgba(0, 0, 0, 0.45)',
        colorIcon: currentTheme.colors.textSecondary,
        colorIconHover: currentTheme.colors.textPrimary,
        colorText: currentTheme.colors.textPrimary,
        footerPaddingBlock: 16,
        footerPaddingInline: 24,
        padding: 24,
        paddingLG: 24,
      },
      
      // Pagination 组件配置
      Pagination: {
        colorPrimary: currentTheme.colors.primary,
        colorPrimaryHover: currentTheme.colors.primaryHover,
        colorBgContainer: currentTheme.colors.bgElevated,
        colorText: currentTheme.colors.textPrimary,
        colorTextDisabled: currentTheme.colors.textDisabled,
        itemActiveBg: currentTheme.colors.primary,
        itemBg: currentTheme.colors.bgElevated,
        itemLinkBg: currentTheme.colors.bgElevated,
        itemInputBg: currentTheme.colors.bgElevated,
      },
      
      // Tabs 组件配置
      Tabs: {
        colorBgContainer: currentTheme.colors.bgElevated,
        colorText: currentTheme.colors.textSecondary,
        colorPrimary: currentTheme.colors.primary,
        itemColor: currentTheme.colors.textSecondary,
        itemSelectedColor: currentTheme.colors.primary,
        itemHoverColor: currentTheme.colors.primary,
        itemActiveColor: currentTheme.colors.primary,
        inkBarColor: currentTheme.colors.primary,
        cardBg: currentTheme.colors.bgElevated,
        cardGutter: 4,
      },
      
      // Message 组件配置
      Message: {
        contentBg: currentTheme.colors.bgElevated,
        contentPadding: '10px 16px',
        boxShadow: currentTheme.shadows.lg,
      },
      
      // Notification 组件配置
      Notification: {
        colorBgElevated: currentTheme.colors.bgElevated,
        colorText: currentTheme.colors.textPrimary,
        colorTextHeading: currentTheme.colors.textPrimary,
        colorIcon: currentTheme.colors.textSecondary,
        boxShadow: currentTheme.shadows.xl,
        width: 384,
      },
      
      // Popover 组件配置
      Popover: {
        colorBgElevated: currentTheme.colors.bgElevated,
        colorText: currentTheme.colors.textPrimary,
        boxShadow: currentTheme.shadows.lg,
        borderRadiusLG: 8,
      },
      
      // Tooltip 组件配置
      Tooltip: {
        colorBgSpotlight: themeMode === 'dark' ? currentTheme.colors.bgTertiary : currentTheme.colors.textPrimary,
        colorTextLightSolid: themeMode === 'dark' ? currentTheme.colors.textPrimary : '#FFFFFF',
        borderRadius: 6,
      },
      
      // Dropdown 组件配置
      Dropdown: {
        colorBgElevated: currentTheme.colors.bgElevated,
        colorText: currentTheme.colors.textPrimary,
        controlItemBgHover: currentTheme.colors.bgSecondary,
        controlItemBgActive: currentTheme.colors.primary + '15',
        controlItemBgActiveHover: currentTheme.colors.primary + '20',
        boxShadow: currentTheme.shadows.lg,
        paddingBlock: 8,
      },
      
      // Badge 组件配置
      Badge: {
        colorBorderBg: currentTheme.colors.bgElevated,
        textFontSize: 12,
        textFontSizeSM: 12,
        textFontWeight: 400,
      },
      
      // Tag 组件配置
      Tag: {
        defaultBg: currentTheme.colors.bgSecondary,
        defaultColor: currentTheme.colors.textPrimary,
        colorBorder: currentTheme.colors.borderPrimary,
      },
      
      // Alert 组件配置
      Alert: {
        colorInfoBg: currentTheme.colors.info + '15',
        colorInfoBorder: currentTheme.colors.info + '40',
        colorSuccessBg: currentTheme.colors.success + '15',
        colorSuccessBorder: currentTheme.colors.success + '40',
        colorWarningBg: currentTheme.colors.warning + '15',
        colorWarningBorder: currentTheme.colors.warning + '40',
        colorErrorBg: currentTheme.colors.error + '15',
        colorErrorBorder: currentTheme.colors.error + '40',
      },
      
      // Progress 组件配置
      Progress: {
        defaultColor: currentTheme.colors.primary,
        remainingColor: currentTheme.colors.bgSecondary,
        circleTextColor: currentTheme.colors.textPrimary,
      },
      
      // Switch 组件配置
      Switch: {
        colorPrimary: currentTheme.colors.primary,
        colorPrimaryHover: currentTheme.colors.primaryHover,
        colorTextQuaternary: currentTheme.colors.borderPrimary,
        colorTextTertiary: currentTheme.colors.textTertiary,
      },
      
      // Checkbox 组件配置
      Checkbox: {
        colorPrimary: currentTheme.colors.primary,
        colorPrimaryHover: currentTheme.colors.primaryHover,
        colorBorder: currentTheme.colors.borderPrimary,
        colorBgContainer: currentTheme.colors.bgElevated,
      },
      
      // Radio 组件配置
      Radio: {
        colorPrimary: currentTheme.colors.primary,
        colorPrimaryHover: currentTheme.colors.primaryHover,
        colorBorder: currentTheme.colors.borderPrimary,
        colorBgContainer: currentTheme.colors.bgElevated,
        buttonBg: currentTheme.colors.bgElevated,
        buttonCheckedBg: currentTheme.colors.bgElevated,
        buttonColor: currentTheme.colors.textPrimary,
        buttonPaddingInline: 16,
      },
      
      // DatePicker 组件配置
      DatePicker: {
        colorBgContainer: currentTheme.colors.bgElevated,
        colorBgElevated: currentTheme.colors.bgElevated,
        colorText: currentTheme.colors.textPrimary,
        colorTextHeading: currentTheme.colors.textPrimary,
        colorTextDisabled: currentTheme.colors.textDisabled,
        colorIcon: currentTheme.colors.textSecondary,
        colorIconHover: currentTheme.colors.primary,
        colorPrimary: currentTheme.colors.primary,
        cellHoverBg: currentTheme.colors.bgSecondary,
        cellActiveWithRangeBg: currentTheme.colors.primary + '15',
        cellRangeBorderColor: currentTheme.colors.primary + '40',
      },
      
      // Upload 组件配置
      Upload: {
        colorBorder: currentTheme.colors.borderPrimary,
        colorBgContainer: currentTheme.colors.bgElevated,
        colorText: currentTheme.colors.textPrimary,
        colorTextDescription: currentTheme.colors.textSecondary,
        colorFillAlter: currentTheme.colors.bgSecondary,
      },
      
      // Divider 组件配置
      Divider: {
        colorSplit: currentTheme.colors.borderSecondary,
        colorText: currentTheme.colors.textTertiary,
        colorTextHeading: currentTheme.colors.textPrimary,
      },
      
      // Spin 组件配置
      Spin: {
        colorPrimary: currentTheme.colors.primary,
        contentHeight: 400,
      },
      
      // Skeleton 组件配置
      Skeleton: {
        colorFill: currentTheme.colors.bgSecondary,
        colorFillContent: currentTheme.colors.bgTertiary,
        borderRadiusSM: 4,
      },
    }
  }), [themeMode, currentTheme]);

  // 设置主题模式 - 带验证的 setter 函数
  const setThemeModeWithValidation = useCallback((mode) => {
    if (!isValidThemeMode(mode)) {
      console.error(`Invalid theme mode "${mode}". Valid modes are: ${VALID_THEME_MODES.join(', ')}`);
      return false;
    }
    setThemeMode(mode);
    return true;
  }, []);

  const contextValue = useMemo(() => ({
    themeMode,
    theme: currentTheme,
    toggleTheme,
    setThemeMode: setThemeModeWithValidation,
    isDark: themeMode === 'dark',
    isLight: themeMode === 'light',
  }), [themeMode, currentTheme, toggleTheme, setThemeModeWithValidation]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <ConfigProvider theme={antdConfig} locale={zhCN}>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};


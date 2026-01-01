/**
 * 主题验证工具函数
 * 提供主题相关的验证和错误处理功能
 */

/**
 * 有效的主题模式列表
 */
export const VALID_THEME_MODES = ['light', 'dark'];

/**
 * 默认主题模式
 */
export const DEFAULT_THEME_MODE = 'light';

/**
 * localStorage 键名
 */
export const THEME_STORAGE_KEY = 'optimus-theme-mode';

/**
 * 验证主题模式是否有效
 * @param {string} mode - 要验证的主题模式
 * @returns {boolean} 是否为有效的主题模式
 */
export const isValidThemeMode = (mode) => {
  return typeof mode === 'string' && VALID_THEME_MODES.includes(mode);
};

/**
 * 检查浏览器是否支持 CSS 变量
 * @returns {boolean} 是否支持 CSS 变量
 */
export const supportsCSSVariables = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    // 检查 CSS.supports API
    if (window.CSS && window.CSS.supports) {
      return window.CSS.supports('--test-var', '0');
    }

    // 回退检查：尝试设置和读取 CSS 变量
    const testElement = document.createElement('div');
    testElement.style.setProperty('--test-var', '0');
    const value = testElement.style.getPropertyValue('--test-var');
    return value === '0';
  } catch (error) {
    console.warn('Failed to check CSS variables support:', error);
    return false;
  }
};

/**
 * 检查 localStorage 是否可用
 * @returns {boolean} 是否可用
 */
export const isLocalStorageAvailable = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    const testKey = '__theme_storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    // localStorage 可能被禁用（隐私模式）或配额已满
    return false;
  }
};

/**
 * 安全地从 localStorage 读取值
 * @param {string} key - 键名
 * @param {*} defaultValue - 默认值
 * @returns {*} 读取的值或默认值
 */
export const safeGetLocalStorage = (key, defaultValue = null) => {
  if (!isLocalStorageAvailable()) {
    return defaultValue;
  }

  try {
    const value = localStorage.getItem(key);
    return value !== null ? value : defaultValue;
  } catch (error) {
    console.error(`Failed to read from localStorage (key: ${key}):`, error);
    return defaultValue;
  }
};

/**
 * 安全地向 localStorage 写入值
 * @param {string} key - 键名
 * @param {*} value - 值
 * @returns {boolean} 是否写入成功
 */
export const safeSetLocalStorage = (key, value) => {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available');
    return false;
  }

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Failed to write to localStorage (key: ${key}):`, error);
    return false;
  }
};

/**
 * 安全地从 localStorage 删除值
 * @param {string} key - 键名
 * @returns {boolean} 是否删除成功
 */
export const safeRemoveLocalStorage = (key) => {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove from localStorage (key: ${key}):`, error);
    return false;
  }
};

/**
 * 获取浏览器环境信息
 * @returns {object} 环境信息
 */
export const getBrowserEnvironment = () => {
  if (typeof window === 'undefined') {
    return {
      isServer: true,
      supportsCSSVariables: false,
      supportsLocalStorage: false,
    };
  }

  return {
    isServer: false,
    supportsCSSVariables: supportsCSSVariables(),
    supportsLocalStorage: isLocalStorageAvailable(),
    userAgent: navigator.userAgent,
  };
};

/**
 * 验证主题配置对象
 * @param {object} theme - 主题配置对象
 * @returns {boolean} 是否为有效的主题配置
 */
export const isValidThemeConfig = (theme) => {
  if (!theme || typeof theme !== 'object') {
    return false;
  }

  // 检查必需的属性
  const requiredProps = ['colors', 'shadows', 'typography'];
  for (const prop of requiredProps) {
    if (!theme[prop] || typeof theme[prop] !== 'object') {
      return false;
    }
  }

  return true;
};

/**
 * 创建主题错误对象
 * @param {string} message - 错误消息
 * @param {string} code - 错误代码
 * @param {object} details - 错误详情
 * @returns {Error} 错误对象
 */
export const createThemeError = (message, code, details = {}) => {
  const error = new Error(message);
  error.name = 'ThemeError';
  error.code = code;
  error.details = details;
  return error;
};

/**
 * 错误代码常量
 */
export const ThemeErrorCodes = {
  INVALID_MODE: 'INVALID_MODE',
  STORAGE_ERROR: 'STORAGE_ERROR',
  INVALID_CONFIG: 'INVALID_CONFIG',
  CONTEXT_ERROR: 'CONTEXT_ERROR',
  CSS_VARIABLES_UNSUPPORTED: 'CSS_VARIABLES_UNSUPPORTED',
};

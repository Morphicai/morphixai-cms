/**
 * 错误处理演示脚本
 * 展示主题系统的各种错误处理场景
 * 
 * 注意：这不是测试文件，而是用于演示的示例代码
 */

import {
  isValidThemeMode,
  isLocalStorageAvailable,
  supportsCSSVariables,
  safeGetLocalStorage,
  safeSetLocalStorage,
  getBrowserEnvironment,
  VALID_THEME_MODES,
  DEFAULT_THEME_MODE,
} from '../utils/validation';

/**
 * 演示主题模式验证
 */
export function demoThemeModeValidation() {
  console.group('🔍 主题模式验证演示');
  
  console.log('有效的主题模式:', VALID_THEME_MODES);
  console.log('默认主题模式:', DEFAULT_THEME_MODE);
  
  // 测试有效值
  console.log('\n✅ 有效值测试:');
  console.log('  light:', isValidThemeMode('light'));
  console.log('  dark:', isValidThemeMode('dark'));
  
  // 测试无效值
  console.log('\n❌ 无效值测试:');
  console.log('  blue:', isValidThemeMode('blue'));
  console.log('  null:', isValidThemeMode(null));
  console.log('  undefined:', isValidThemeMode(undefined));
  console.log('  123:', isValidThemeMode(123));
  console.log('  {}:', isValidThemeMode({}));
  console.log('  "":', isValidThemeMode(''));
  console.log('  "Light":', isValidThemeMode('Light'));
  
  console.groupEnd();
}

/**
 * 演示 localStorage 安全操作
 */
export function demoLocalStorageSafety() {
  console.group('💾 localStorage 安全操作演示');
  
  const available = isLocalStorageAvailable();
  console.log('localStorage 可用:', available);
  
  if (available) {
    // 测试写入
    console.log('\n📝 写入测试:');
    const writeSuccess = safeSetLocalStorage('demo-key', 'demo-value');
    console.log('  写入成功:', writeSuccess);
    
    // 测试读取
    console.log('\n📖 读取测试:');
    const value = safeGetLocalStorage('demo-key');
    console.log('  读取值:', value);
    
    // 测试默认值
    console.log('\n🔄 默认值测试:');
    const defaultValue = safeGetLocalStorage('non-existent', 'default');
    console.log('  不存在的键返回默认值:', defaultValue);
    
    // 清理
    localStorage.removeItem('demo-key');
  } else {
    console.warn('⚠️ localStorage 不可用，跳过测试');
  }
  
  console.groupEnd();
}

/**
 * 演示 CSS 变量支持检查
 */
export function demoCSSVariablesSupport() {
  console.group('🎨 CSS 变量支持检查');
  
  const supported = supportsCSSVariables();
  console.log('CSS 变量支持:', supported);
  
  if (supported) {
    console.log('✅ 您的浏览器支持 CSS 变量');
  } else {
    console.warn('⚠️ 您的浏览器不支持 CSS 变量，将使用回退样式');
  }
  
  console.groupEnd();
}

/**
 * 演示浏览器环境检查
 */
export function demoBrowserEnvironment() {
  console.group('🌐 浏览器环境信息');
  
  const env = getBrowserEnvironment();
  console.log('环境信息:', env);
  
  if (env.isServer) {
    console.log('🖥️ 服务器端渲染环境');
  } else {
    console.log('🌐 浏览器环境');
    console.log('  CSS 变量支持:', env.supportsCSSVariables ? '✅' : '❌');
    console.log('  localStorage 支持:', env.supportsLocalStorage ? '✅' : '❌');
    console.log('  用户代理:', env.userAgent);
  }
  
  console.groupEnd();
}

/**
 * 演示无效主题模式处理
 */
export function demoInvalidThemeModeHandling() {
  console.group('🚨 无效主题模式处理演示');
  
  // 模拟设置无效值
  console.log('设置无效的主题模式到 localStorage...');
  localStorage.setItem('optimus-theme-mode', 'invalid-mode');
  
  // 读取并验证
  const stored = localStorage.getItem('optimus-theme-mode');
  console.log('存储的值:', stored);
  console.log('验证结果:', isValidThemeMode(stored));
  
  if (!isValidThemeMode(stored)) {
    console.warn('⚠️ 检测到无效的主题模式');
    console.log('🔧 自动修复：清除无效值并使用默认主题');
    localStorage.removeItem('optimus-theme-mode');
    console.log('✅ 已重置为默认主题:', DEFAULT_THEME_MODE);
  }
  
  console.groupEnd();
}

/**
 * 运行所有演示
 */
export function runAllDemos() {
  console.clear();
  console.log('🎭 主题系统错误处理演示\n');
  
  demoThemeModeValidation();
  console.log('\n');
  
  demoLocalStorageSafety();
  console.log('\n');
  
  demoCSSVariablesSupport();
  console.log('\n');
  
  demoBrowserEnvironment();
  console.log('\n');
  
  demoInvalidThemeModeHandling();
  console.log('\n');
  
  console.log('✨ 所有演示完成！');
}

// 如果直接运行此文件，执行所有演示
if (typeof window !== 'undefined' && window.location.search.includes('demo=theme-errors')) {
  runAllDemos();
}

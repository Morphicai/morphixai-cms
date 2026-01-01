/**
 * ThemeSwitcher 组件
 * 提供亮色/暗色主题切换功能
 * 使用 React.memo 优化性能,避免不必要的重新渲染
 */

import React from 'react';
import { Switch } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useTheme } from '../../theme/useTheme';
import styles from './styles.module.css';

export const ThemeSwitcher = React.memo(({ className }) => {
  const { themeMode, toggleTheme } = useTheme();
  
  return (
    <div className={`${styles.themeSwitcher} ${className || ''}`}>
      <SunOutlined 
        className={`${styles.icon} ${themeMode === 'light' ? styles.active : ''}`} 
      />
      <Switch
        checked={themeMode === 'dark'}
        onChange={toggleTheme}
        className={styles.switch}
        aria-label="切换主题"
      />
      <MoonOutlined 
        className={`${styles.icon} ${themeMode === 'dark' ? styles.active : ''}`} 
      />
    </div>
  );
});

ThemeSwitcher.displayName = 'ThemeSwitcher';

export default ThemeSwitcher;

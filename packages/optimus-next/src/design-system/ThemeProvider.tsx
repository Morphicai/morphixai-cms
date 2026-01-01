'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { designTokens, generateCSSVariables, type DesignTokens } from './tokens';

export type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  tokens: DesignTokens;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'auto',
  storageKey = 'optimus-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // 从 localStorage 读取主题设置
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey) as Theme;
      if (stored && ['light', 'dark', 'auto'].includes(stored)) {
        setThemeState(stored);
      }
    } catch (error) {
      console.warn('Failed to read theme from localStorage:', error);
    }
    setMounted(true);
  }, [storageKey]);

  // 解析实际主题（处理 auto 模式）
  useEffect(() => {
    const resolveTheme = () => {
      if (theme === 'auto') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return theme;
    };

    const resolved = resolveTheme();
    setResolvedTheme(resolved);

    // 监听系统主题变化
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setResolvedTheme(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // 应用主题到 DOM
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    // 移除之前的主题类
    root.classList.remove('light', 'dark');
    
    // 添加当前主题类
    root.classList.add(resolvedTheme);

    // 生成并应用 CSS 变量
    const cssVars = generateCSSVariables(designTokens);
    Object.entries(cssVars).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // 设置主题相关的 CSS 变量
    if (resolvedTheme === 'dark') {
      root.style.setProperty('--background', '#0a0a0a');
      root.style.setProperty('--foreground', '#ededed');
      root.style.setProperty('--muted', '#262626');
      root.style.setProperty('--muted-foreground', '#a3a3a3');
      root.style.setProperty('--border', '#404040');
      root.style.setProperty('--input', '#262626');
      root.style.setProperty('--card', '#171717');
      root.style.setProperty('--card-foreground', '#ededed');
      root.style.setProperty('--popover', '#171717');
      root.style.setProperty('--popover-foreground', '#ededed');
    } else {
      root.style.setProperty('--background', '#ffffff');
      root.style.setProperty('--foreground', '#171717');
      root.style.setProperty('--muted', '#f5f5f5');
      root.style.setProperty('--muted-foreground', '#737373');
      root.style.setProperty('--border', '#e5e5e5');
      root.style.setProperty('--input', '#ffffff');
      root.style.setProperty('--card', '#ffffff');
      root.style.setProperty('--card-foreground', '#171717');
      root.style.setProperty('--popover', '#ffffff');
      root.style.setProperty('--popover-foreground', '#171717');
    }
  }, [resolvedTheme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(storageKey, newTheme);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  };

  const toggleTheme = () => {
    if (theme === 'auto') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  };

  const contextValue: ThemeContextType = {
    theme,
    resolvedTheme,
    tokens: designTokens,
    setTheme,
    toggleTheme,
  };

  // 防止服务端渲染时的闪烁
  if (!mounted) {
    return (
      <ThemeContext.Provider value={contextValue}>
        <div style={{ visibility: 'hidden' }}>{children}</div>
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// 主题切换按钮组件
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        inline-flex items-center justify-center rounded-md p-2
        text-sm font-medium transition-colors
        hover:bg-gray-100 dark:hover:bg-gray-800
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
      aria-label="切换主题"
      title={`当前主题: ${theme === 'auto' ? `自动 (${resolvedTheme})` : theme}`}
    >
      {resolvedTheme === 'dark' ? (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
}
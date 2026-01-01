/**
 * AuthProvider - 认证上下文提供者
 * 提供全局的认证状态管理和弹窗控制
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { optimusSDK } from '../../sdk';
import AuthModals, { AuthModalType } from './AuthModals';

export interface User {
  sub: string;
  username: string;
  type: string;
  nickname?: string;
  email?: string;
  avatar?: string;
  iat?: number;
  exp?: number;
}

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, email?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => void;
  // Modal 控制
  openLogin: () => void;
  openRegister: () => void;
  closeModals: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<AuthModalType>(null);

  // 刷新用户信息
  const refreshUser = useCallback(() => {
    const currentUser = optimusSDK.getCurrentUser();
    setUser(currentUser);
  }, []);

  // 初始化时获取用户信息
  useEffect(() => {
    refreshUser();
    setIsLoading(false);
  }, [refreshUser]);

  // 登录
  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await optimusSDK.http.post('/client-user/login', {
        username,
        password,
      });

      if (response.data) {
        const { accessToken, refreshToken, expiresIn } = response.data;
        optimusSDK.token.setTokens(accessToken, refreshToken, expiresIn);
        refreshUser();
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, [refreshUser]);

  // 注册
  const register = useCallback(async (username: string, password: string, email?: string) => {
    try {
      const response = await optimusSDK.http.post('/client-user/register', {
        username,
        password,
        email,
      });

      if (response.data) {
        const { accessToken, refreshToken, expiresIn } = response.data;
        optimusSDK.token.setTokens(accessToken, refreshToken, expiresIn);
        refreshUser();
      }
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }, [refreshUser]);

  // 登出
  const logout = useCallback(() => {
    optimusSDK.logout();
    setUser(null);
  }, []);

  // Modal 控制
  const openLogin = useCallback(() => setActiveModal('login'), []);
  const openRegister = useCallback(() => setActiveModal('register'), []);
  const closeModals = useCallback(() => setActiveModal(null), []);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
    openLogin,
    openRegister,
    closeModals,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* 在顶层渲染认证弹窗，确保 fixed 定位正常工作 */}
      <AuthModals activeModal={activeModal} onClose={closeModals} />
    </AuthContext.Provider>
  );
}

/**
 * useAuth Hook
 * 在组件中使用认证功能
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


/**
 * AuthProvider - 认证上下文提供者
 * 提供全局的认证状态管理和弹窗控制
 *
 * 登录态的真相在 httpOnly cookie 里（前端读不到），所以这里的 user 状态
 * 分两步建立：先用 localStorage 缓存乐观渲染首屏，再用 /client-user/me
 * 向后台校验——校验不过就清掉，UI 回到未登录。
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { encryptPasswordFields } from '@optimus/common';
import { optimusSDK, userSessionService } from '../../sdk';
import type { ClientUserInfo } from '../../sdk';
import AuthModals, { AuthModalType } from './AuthModals';

export type User = ClientUserInfo;

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

  // 向后台校验登录态并同步本地状态
  const refreshUser = useCallback(() => {
    optimusSDK.fetchCurrentUser().then(setUser);
  }, []);

  // 初始化：先拿缓存乐观渲染，再向后台校验
  useEffect(() => {
    setUser(optimusSDK.getCurrentUser());
    setIsLoading(false);
    refreshUser();
  }, [refreshUser]);

  // 登录标识按形状路由：后端 LoginDto 是 username/email/phone 三选一的独立字段，
  // 把邮箱塞进 username 字段会按用户名去查库然后 401——Modal 的登录框收集的
  // 就是邮箱，这里必须分流
  const buildIdentifier = (identifier: string) => {
    if (identifier.includes('@')) return { email: identifier };
    if (/^1[3-9]\d{9}$/.test(identifier)) return { phone: identifier };
    return { username: identifier };
  };

  // 登录：后台在响应里 Set-Cookie（httpOnly），响应体带用户信息
  const login = useCallback(async (identifier: string, password: string) => {
    const response = await optimusSDK.http.post(
      '/client-user/login',
      encryptPasswordFields({ ...buildIdentifier(identifier), password })
    );

    if (response?.code !== 200) {
      throw new Error(response?.msg || 'Login failed');
    }

    const userInfo = response.data?.user;
    if (userInfo) {
      userSessionService.setUser(userInfo);
      setUser(userInfo);
    }
  }, []);

  // 注册：注册接口不发 token（后台如此设计），成功后串一次登录补上会话。
  // username 是可选的且规则严格（字母数字下划线），Modal 的邮箱注册流程
  // 没有用户名——传进来的 username 长得像邮箱就丢弃，走纯邮箱注册
  const register = useCallback(async (username: string, password: string, email?: string) => {
    const isEmailShaped = username.includes('@');
    const payload: Record<string, string> = { password };
    if (!isEmailShaped && username) payload.username = username;
    const finalEmail = email || (isEmailShaped ? username : undefined);
    if (finalEmail) payload.email = finalEmail;

    const response = await optimusSDK.http.post(
      '/client-user/register',
      encryptPasswordFields(payload)
    );

    if (response?.code !== 200) {
      throw new Error(
        Array.isArray(response?.msg) ? response.msg[0] : response?.msg || 'Registration failed'
      );
    }

    await login(payload.username || finalEmail!, password);
  }, [login]);

  // 登出：后台清 cookie，SDK 清缓存并跳转 /auth
  const logout = useCallback(() => {
    setUser(null);
    optimusSDK.logout();
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

'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth, AuthState, User } from '@/hooks/useAuth';

interface AuthContextType extends AuthState {
  login: (credentials: { username: string; password: string }) => Promise<{ success: boolean; data?: any; message?: string }>;
  logout: () => Promise<{ success: boolean; message?: string }>;
  refreshUser: () => Promise<void>;
  checkAndRefreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * 用户认证上下文提供者
 * 为整个应用提供用户认证状态管理
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 使用认证上下文的 Hook
 * @returns 认证状态和方法
 */
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

/**
 * 高阶组件：需要认证的页面包装器
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading, user } = useAuthContext();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">需要登录</h2>
            <p className="text-gray-600 mb-4">请先登录后再访问此页面</p>
            <a
              href="/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              前往登录
            </a>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

/**
 * 用户信息显示组件
 */
export function UserInfo() {
  const { user, isAuthenticated, logout } = useAuthContext();

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      // 可以添加成功提示
      console.log('退出登录成功');
    } else {
      // 可以添加错误提示
      console.error('退出登录失败:', result.message);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      {user.avatar && (
        <img
          src={user.avatar}
          alt={user.nickname || user.username}
          className="h-8 w-8 rounded-full"
        />
      )}
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900">
          {user.nickname || user.username}
        </span>
        {user.email && (
          <span className="text-xs text-gray-500">{user.email}</span>
        )}
      </div>
      <button
        onClick={handleLogout}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        退出
      </button>
    </div>
  );
}

/**
 * 登录状态检查组件
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">需要登录</h2>
          <p className="text-gray-600 mb-4">请先登录后再访问此页面</p>
          <a
            href="/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            前往登录
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
import { useState, useEffect, useCallback } from 'react';
import { UniversalClientUserService } from '@/lib/universal-api';
import { TokenService } from '@/services/TokenService';

export interface User {
  userId: string;
  username: string;
  email?: string;
  nickname?: string;
  avatar?: string;
  userSource: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/**
 * 用户认证状态管理 Hook
 * 自动获取和管理当前用户的登录态
 */
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  /**
   * 获取当前用户信息
   */
  const fetchCurrentUser = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // 直接调用 API，让服务端验证 httpOnly cookie
      const response = await UniversalClientUserService.getCurrentUser();
      
      if (response.code === 200 && response.data) {
        setAuthState({
          user: response.data,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  /**
   * 登录
   */
  const login = useCallback(async (credentials: { username: string; password: string }) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const response = await UniversalClientUserService.login(credentials);
      
      if (response.code === 200 && response.data) {
        // 登录成功，重新获取用户信息
        await fetchCurrentUser();
        return { success: true, data: response.data };
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return { success: false, message: response.message || '登录失败' };
      }
    } catch (error) {
      console.error('Login failed:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { success: false, message: '登录失败，请稍后重试' };
    }
  }, [fetchCurrentUser]);

  /**
   * 退出登录
   */
  const logout = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // 调用退出登录接口
      await UniversalClientUserService.logout();
      
      // 清除本地 token
      TokenService.clearTokens();
      
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });

      return { success: true };
    } catch (error) {
      console.error('Logout failed:', error);
      
      // 即使接口调用失败，也要清除本地状态
      TokenService.clearTokens();
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });

      return { success: false, message: '退出登录失败' };
    }
  }, []);

  /**
   * 刷新用户信息
   */
  const refreshUser = useCallback(async () => {
    await fetchCurrentUser();
  }, [fetchCurrentUser]);

  /**
   * 检查 token 是否即将过期并自动刷新
   */
  const checkAndRefreshToken = useCallback(async () => {
    if (TokenService.shouldRefreshToken()) {
      try {
        const response = await UniversalClientUserService.refreshToken();
        if (response.code === 200) {
          // Token 刷新成功，重新获取用户信息
          await fetchCurrentUser();
          return true;
        } else {
          // 刷新失败，清除登录状态
          TokenService.clearTokens();
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
          });
          return false;
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        TokenService.clearTokens();
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
        return false;
      }
    }
    return true;
  }, [fetchCurrentUser]);

  // 组件挂载时获取用户信息
  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // 定期检查 token 状态
  useEffect(() => {
    const interval = setInterval(() => {
      if (authState.isAuthenticated) {
        checkAndRefreshToken();
      }
    }, 5 * 60 * 1000); // 每5分钟检查一次

    return () => clearInterval(interval);
  }, [authState.isAuthenticated, checkAndRefreshToken]);

  return {
    ...authState,
    login,
    logout,
    refreshUser,
    checkAndRefreshToken,
  };
}

/**
 * 用户认证状态管理 Hook（简化版）
 * 只获取认证状态，不包含登录退出方法
 */
export function useAuthState() {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  return {
    user,
    isLoading,
    isAuthenticated,
  };
}
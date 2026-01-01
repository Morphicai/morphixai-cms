'use client';

import { useState, useCallback } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';

interface LoginFormProps {
  onLoginSuccess?: (user: any) => void;
  onLoginError?: (error: string) => void;
}

export default function LoginForm({ onLoginSuccess, onLoginError }: LoginFormProps) {
  const { login } = useAuthContext();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 使用 useCallback 防止重复创建函数
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 防止重复提交
    if (loading) {
      console.log('⚠️ 登录请求正在进行中，忽略重复提交');
      return;
    }

    if (!formData.username || !formData.password) {
      setError('请输入用户名和密码');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔐 [LoginForm] 开始登录请求...');
      const result = await login({
        username: formData.username,
        password: formData.password,
      });

      if (result.success) {
        console.log('✅ [LoginForm] 登录成功');
        onLoginSuccess?.(result.data);
        // 清空表单
        setFormData({ username: '', password: '' });
      } else {
        const errorMsg = result.message || '登录失败';
        setError(errorMsg);
        onLoginError?.(errorMsg);
        console.log('❌ [LoginForm] 登录失败:', errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '登录失败';
      console.error('💥 [LoginForm] 登录异常:', err);
      setError(errorMsg);
      onLoginError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [formData, loading, login, onLoginSuccess, onLoginError]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // 清除错误信息
    if (error) {
      setError(null);
    }
  }, [error]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          用户名
        </label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleInputChange}
          disabled={loading}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          placeholder="请输入用户名"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          密码
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          disabled={loading}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          placeholder="请输入密码"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !formData.username || !formData.password}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            登录中...
          </div>
        ) : (
          '登录'
        )}
      </button>

      <div className="text-xs text-gray-500 text-center">
        <p>💡 提示: 使用新的认证系统，登录后会自动更新 Header 显示</p>
      </div>
    </form>
  );
}
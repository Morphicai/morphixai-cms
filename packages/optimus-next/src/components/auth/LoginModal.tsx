/**
 * LoginModal - 登录弹窗组件
 * 现代化的两步登录流程设计
 */

'use client';

import { useState } from 'react';
import { Mail, Loader2, AlertCircle, Apple } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { Modal } from '../ui/Modal';

export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister?: () => void;
  onSuccess?: () => void;
}

export function LoginModal({
  isOpen,
  onClose,
  onSwitchToRegister,
  onSuccess,
}: LoginModalProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordStep, setShowPasswordStep] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    setShowPasswordStep(true);
    setError('');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setShowPasswordStep(false);
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="xl">
      <div>
        {!showPasswordStep ? (
            // 第一步：输入邮箱
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              {/* Email 输入 */}
              <div>
                <label className="flex items-center gap-2 text-base font-medium text-neutral-900 mb-3">
                  <Mail className="w-5 h-5" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address to start"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-base"
                  disabled={isLoading}
                />
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-error-50 border border-error-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-error-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-error-700">{error}</p>
                </div>
              )}

              {/* Continue 按钮 */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-neutral-200 hover:bg-neutral-300 text-neutral-900 font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                Continue
              </button>

              {/* 分隔线 */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-neutral-400">OR</span>
                </div>
              </div>

              {/* 第三方登录 - Disabled */}
              <div className="space-y-3">
                <button
                  type="button"
                  disabled
                  className="w-full py-3 px-4 bg-gray-100 border border-gray-200 rounded-xl cursor-not-allowed flex items-center justify-center gap-3 text-gray-400 font-medium opacity-50"
                >
                  <Apple className="w-5 h-5" />
                  Continue with Apple (Coming Soon)
                </button>

                <button
                  type="button"
                  disabled
                  className="w-full py-3 px-4 bg-gray-100 border border-gray-200 rounded-xl cursor-not-allowed flex items-center justify-center gap-3 text-gray-400 font-medium opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google (Coming Soon)
                </button>
              </div>

              {/* 条款说明 */}
              <div className="space-y-2 text-xs text-neutral-500">
                <p>
                  By continuing, you agree to our{' '}
                  <a href="#" className="text-neutral-700 underline hover:text-neutral-900">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-neutral-700 underline hover:text-neutral-900">
                    Privacy Policy
                  </a>
                  .
                </p>
                <p>By continuing, you agree to receive marketing email.</p>
              </div>

              {/* 切换到注册 */}
              {onSwitchToRegister && (
                <div className="text-center pt-4">
                  <p className="text-sm text-neutral-600">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={onSwitchToRegister}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Sign up
                    </button>
                  </p>
                </div>
              )}
            </form>
          ) : (
            // 第二步：输入密码
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <button
                  type="button"
                  onClick={() => setShowPasswordStep(false)}
                  className="text-sm text-neutral-600 hover:text-neutral-900 mb-4"
                >
                  ← Back
                </button>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  Welcome back
                </h3>
                <p className="text-sm text-neutral-600">{email}</p>
              </div>

              {/* 密码输入 */}
              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  autoFocus
                />
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-error-50 border border-error-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-error-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-error-700">{error}</p>
                </div>
              )}

              {/* 登录按钮 */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>

              <div className="text-center">
                <a href="#" className="text-sm text-primary-600 hover:text-primary-700">
                  Forgot password?
                </a>
              </div>
            </form>
          )}
      </div>
    </Modal>
  );
}

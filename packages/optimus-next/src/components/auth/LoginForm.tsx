/**
 * LoginForm - Login form component
 */

'use client';

import { useState } from 'react';
import { LogIn, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from './AuthProvider';

export interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  className?: string;
}

export function LoginForm({
  onSuccess,
  onSwitchToRegister,
  className = '',
}: LoginFormProps) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }

    setIsLoading(true);

    try {
      await login(username, password);
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed, please check your credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <LogIn className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-3xl font-bold text-neutral-900 mb-2">Welcome Back</h2>
          <p className="text-neutral-600">Sign in to your account to continue</p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-error-700">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-neutral-700 mb-2">
              Username
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                placeholder="Enter your username"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Remember me and forgot password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-neutral-700">Remember me</span>
            </label>
            <a href="#" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Forgot password?
            </a>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Register link */}
        {onSwitchToRegister && (
          <div className="mt-6 text-center">
            <p className="text-neutral-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Sign up now
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


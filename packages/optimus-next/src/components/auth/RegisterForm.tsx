/**
 * RegisterForm - Registration form component
 */

'use client';

import { useState } from 'react';
import { UserPlus, Mail, Lock, User, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from './AuthProvider';

export interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
  className?: string;
}

export function RegisterForm({
  onSuccess,
  onSwitchToLogin,
  className = '',
}: RegisterFormProps) {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 密码强度检查
  const passwordStrength = password.length === 0 ? null : 
    password.length < 6 ? 'weak' :
    password.length < 10 ? 'medium' : 'strong';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!username || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await register(username, password, email || undefined);
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed, please try again later');
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
            <UserPlus className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-3xl font-bold text-neutral-900 mb-2">Create Account</h2>
          <p className="text-neutral-600">Join us and start your journey</p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-error-700">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-neutral-700 mb-2">
              Username <span className="text-error-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
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

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
              Email (Optional)
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                placeholder="Enter your email"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
              Password <span className="text-error-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                placeholder="Enter password (min 6 characters)"
                disabled={isLoading}
              />
            </div>
            {/* Password strength indicator */}
            {passwordStrength && (
              <div className="mt-2">
                <div className="flex gap-1">
                  <div className={`h-1 flex-1 rounded ${passwordStrength === 'weak' ? 'bg-error-500' : passwordStrength === 'medium' ? 'bg-warning-500' : 'bg-success-500'}`}></div>
                  <div className={`h-1 flex-1 rounded ${passwordStrength === 'medium' || passwordStrength === 'strong' ? 'bg-warning-500' : 'bg-neutral-200'}`}></div>
                  <div className={`h-1 flex-1 rounded ${passwordStrength === 'strong' ? 'bg-success-500' : 'bg-neutral-200'}`}></div>
                </div>
                <p className={`text-xs mt-1 ${passwordStrength === 'weak' ? 'text-error-600' : passwordStrength === 'medium' ? 'text-warning-600' : 'text-success-600'}`}>
                  {passwordStrength === 'weak' && 'Password strength: Weak'}
                  {passwordStrength === 'medium' && 'Password strength: Medium'}
                  {passwordStrength === 'strong' && 'Password strength: Strong'}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
              Confirm Password <span className="text-error-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                placeholder="Confirm your password"
                disabled={isLoading}
              />
              {confirmPassword && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {password === confirmPassword ? (
                    <CheckCircle className="w-5 h-5 text-success-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-error-500" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Terms of Service */}
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="terms"
              required
              className="w-4 h-4 mt-1 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="terms" className="text-sm text-neutral-600">
              I have read and agree to the{' '}
              <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                Terms of Service
              </a>
              {' '}and{' '}
              <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                Privacy Policy
              </a>
            </label>
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
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                <span>Sign Up</span>
              </>
            )}
          </button>
        </form>

        {/* Login link */}
        {onSwitchToLogin && (
          <div className="mt-6 text-center">
            <p className="text-neutral-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Sign in now
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


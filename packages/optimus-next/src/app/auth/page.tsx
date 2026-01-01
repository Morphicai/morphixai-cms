/**
 * 认证页面示例
 * 展示如何使用 LoginForm 和 RegisterForm
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm, RegisterForm } from '../../components/auth';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const handleSuccess = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f7ff] via-[#faf6ff] to-[#fff8f5] py-12 px-4">
      {mode === 'login' ? (
        <LoginForm
          onSuccess={handleSuccess}
          onSwitchToRegister={() => setMode('register')}
        />
      ) : (
        <RegisterForm
          onSuccess={handleSuccess}
          onSwitchToLogin={() => setMode('login')}
        />
      )}
    </div>
  );
}


/**
 * 认证页面示例
 * 展示如何使用 LoginForm 和 RegisterForm
 * 支持 ?redirect= 回跳:zone/子应用跳转来登录,完成后送回原页
 */

'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoginForm, RegisterForm } from '../../components/auth';

function AuthPageInner() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const handleSuccess = () => {
    const redirect = searchParams.get('redirect') || '/';
    // 只接受站内相对路径:以 / 开头且非 //(协议相对),防 open redirect
    const target = redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/';
    // zone 路径不在本应用路由表里,router.push 会 404——跨 zone 一律硬导航
    window.location.href = target;
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

export default function AuthPage() {
  // useSearchParams 要求 Suspense 边界,否则整页退化为客户端渲染并在构建时告警
  return (
    <Suspense>
      <AuthPageInner />
    </Suspense>
  );
}


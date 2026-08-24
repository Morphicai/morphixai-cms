/**
 * 嵌入形态的登录页——给 zone/子应用在 iframe 弹层里共享主站登录能力。
 * 主站不分发任何组件代码,子应用拿到的只是这个 URL 和一条完成消息:
 *   登录成功 → window.parent.postMessage({ type: 'optimus:login-success' }, origin)
 * cookie 由主站自己的登录链路写入;zone 与主站同域,消息 origin 校验同源即可。
 * 非 iframe 直开时(parent === window)退化为跳回首页。
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm, RegisterForm } from '../../../components/auth';

export default function LoginEmbedPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const handleSuccess = () => {
    if (window.parent !== window) {
      // 同源 targetOrigin:zone 与主站在同一个域名下,这是 Multi-Zones 的前提
      window.parent.postMessage({ type: 'optimus:login-success' }, window.location.origin);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center px-4 py-8">
      {mode === 'login' ? (
        <LoginForm onSuccess={handleSuccess} onSwitchToRegister={() => setMode('register')} />
      ) : (
        <RegisterForm onSuccess={handleSuccess} onSwitchToLogin={() => setMode('login')} />
      )}
    </div>
  );
}

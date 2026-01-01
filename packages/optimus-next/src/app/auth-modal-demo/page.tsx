/**
 * 认证弹窗示例页面
 * 展示如何使用 LoginModal 和 RegisterModal
 */

'use client';

import { useState } from 'react';
import { LoginModal, RegisterModal } from '../../components/auth';
import { LogIn, UserPlus } from 'lucide-react';

export default function AuthModalDemoPage() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f7ff] via-[#faf6ff] to-[#fff8f5] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-neutral-900 mb-4">
            Welcome to Optimus CMS
          </h1>
          <p className="text-xl text-neutral-600">
            Click the buttons below to try the authentication modals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 登录按钮 */}
          <button
            onClick={() => setShowLoginModal(true)}
            className="group p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-primary-200"
          >
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
              <LogIn className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">Sign In</h3>
            <p className="text-neutral-600 text-sm">
              Already have an account? Sign in to continue
            </p>
          </button>

          {/* 注册按钮 */}
          <button
            onClick={() => setShowRegisterModal(true)}
            className="group p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-primary-200"
          >
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
              <UserPlus className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">Sign Up</h3>
            <p className="text-neutral-600 text-sm">
              New to Optimus? Create an account to get started
            </p>
          </button>
        </div>

        {/* 功能说明 */}
        <div className="mt-12 bg-white/80 backdrop-blur-sm rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-3">Features:</h3>
          <ul className="space-y-2 text-neutral-600">
            <li className="flex items-start gap-2">
              <span className="text-primary-600 mt-1">✓</span>
              <span>Clean and modern design with smooth user experience</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600 mt-1">✓</span>
              <span>Two-step authentication flow (email → password)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600 mt-1">✓</span>
              <span>Third-party login support (Apple, Google)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600 mt-1">✓</span>
              <span>QR code login option (desktop only)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600 mt-1">✓</span>
              <span>Responsive modal design with smooth animations</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 登录弹窗 */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }}
        onSuccess={() => {
          alert('Login successful!');
        }}
      />

      {/* 注册弹窗 */}
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }}
        onSuccess={() => {
          alert('Registration successful!');
        }}
      />
    </div>
  );
}


'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Button } from '../Button';
import { Logo } from '../Logo';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, isAuthenticated, isLoading, logout, openLogin, openRegister } = useAuth();

  const handleLogout = async () => {
    try {
      logout();
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout failed:', error);
    }
    setShowUserMenu(false);
  };

  // 用户头像组件
  const UserAvatar = ({ size = 'md' }: { size?: 'sm' | 'md' }) => {
    if (!user) return null;

    const sizeClasses = {
      sm: 'w-6 h-6 text-xs',
      md: 'w-8 h-8 text-sm'
    };

    if (user.avatar) {
      return (
        <img
          src={user.avatar}
          alt={user.nickname || user.username}
          className={`${sizeClasses[size]} rounded-full object-cover`}
        />
      );
    }

    const initial = (user.nickname || user.username).charAt(0).toUpperCase();
    return (
      <div className={`${sizeClasses[size]} bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center`}>
        <span className="text-primary-600 dark:text-primary-400 font-medium">
          {initial}
        </span>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-slate-900/70 border-b border-gray-200/50 dark:border-slate-700/50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-20">
          {/* Logo - SVG渐变色设计 */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="transition-transform group-hover:scale-105">
              <Logo size={40} className="drop-shadow-md group-hover:drop-shadow-lg transition-all" />
            </div>
            <span className="text-2xl font-bold text-black dark:text-white tracking-tight">
              Optimus
            </span>
          </Link>

          {/* Desktop Navigation - 简洁导航栏 */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link
              href="/products"
              className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors"
            >
              Products
            </Link>
            <Link
              href="/use-cases"
              className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors"
            >
              Use Cases
            </Link>
            <Link
              href="/blog"
              className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/docs"
              className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors"
            >
              Docs
            </Link>
          </nav>

          {/* Right Side Actions - 用户操作区 */}
          <div className="hidden lg:flex items-center space-x-4">
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-[#3576f6]"></div>
              </div>
            ) : isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <UserAvatar />
                  <span className="font-medium text-black dark:text-white text-sm">
                    {user.nickname || user.username}
                  </span>
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowUserMenu(false)}
                    />
                    
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 z-20 overflow-hidden">
                      <div className="py-2">
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
                          <div className="flex items-center space-x-3">
                            <UserAvatar size="sm" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-black dark:text-white truncate">
                                {user.nickname || user.username}
                              </p>
                              {user.email && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                  {user.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 font-medium transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Profile
                        </Link>
                        
                        <Link
                          href="/settings"
                          className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 font-medium transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Settings
                        </Link>
                        
                        <div className="border-t border-gray-200 dark:border-slate-700 mt-2 pt-2">
                          <button
                            onClick={handleLogout}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors"
                          >
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button 
                  variant="ghost" 
                  onClick={openLogin}
                  className="text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={openRegister}
                  className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-900 dark:hover:bg-gray-100 px-6 py-2 rounded-full font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center space-x-2">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation - 移动端导航 */}
        {isMenuOpen && (
          <div className="lg:hidden py-6 border-t border-gray-200 dark:border-slate-700">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/products"
                className="text-base font-medium text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Products
              </Link>
              <Link
                href="/use-cases"
                className="text-base font-medium text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Use Cases
              </Link>
              <Link
                href="/blog"
                className="text-base font-medium text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Blog
              </Link>
              <Link
                href="/docs"
                className="text-base font-medium text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Docs
              </Link>
              
              {isLoading ? (
                <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-[#3576f6]"></div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">Loading...</span>
                  </div>
                </div>
              ) : isAuthenticated && user ? (
                <div className="pt-4 border-t border-gray-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-center space-x-3">
                    <UserAvatar size="sm" />
                    <div>
                      <div className="text-sm font-semibold text-black dark:text-white">
                        {user.nickname || user.username}
                      </div>
                      {user.email && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {user.email}
                        </div>
                      )}
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    className="block text-base font-medium text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="block text-base font-medium text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left text-base font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-200 dark:border-slate-700 space-y-3">
                  <Button
                    variant="ghost"
                    className="w-full justify-center"
                    onClick={() => {
                      openLogin();
                      setIsMenuOpen(false);
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    className="w-full justify-center bg-black dark:bg-white text-white dark:text-black hover:bg-gray-900 dark:hover:bg-gray-100 rounded-full font-semibold"
                    onClick={() => {
                      openRegister();
                      setIsMenuOpen(false);
                    }}
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
/**
 * Modal - 通用弹窗组件
 */

'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  children,
  maxWidth = 'md',
  showCloseButton = true,
}: ModalProps) {
  // 处理 ESC 键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',      // 384px
    md: 'max-w-md',      // 448px
    lg: 'max-w-lg',      // 512px
    xl: 'max-w-xl',      // 576px
    '2xl': 'max-w-2xl',  // 672px
    '3xl': 'max-w-3xl',  // 768px
    '4xl': 'max-w-4xl',  // 896px
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div
        className={`relative w-full ${maxWidthClasses[maxWidth]} bg-white rounded-3xl shadow-2xl transform transition-all`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 transition-colors rounded-full hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* 内容 */}
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

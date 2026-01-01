import React, { forwardRef } from 'react';
import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

// 按钮变体配置 - 使用 CVA (Class Variance Authority) 进行类型安全的样式管理
const buttonVariants = cva(
  // 基础样式
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // 主要按钮 - 品牌色背景
        primary: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500 active:bg-primary-800',
        // 次要按钮 - 中性色背景
        secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus-visible:ring-secondary-500 active:bg-secondary-800',
        // 轮廓按钮 - 透明背景，有边框
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-primary-500',
        // 幽灵按钮 - 完全透明，仅在悬停时显示背景
        ghost: 'hover:bg-accent hover:text-accent-foreground focus-visible:ring-primary-500',
        // 链接样式按钮
        link: 'text-primary-600 underline-offset-4 hover:underline focus-visible:ring-primary-500',
        // 危险操作按钮
        destructive: 'bg-error-600 text-white hover:bg-error-700 focus-visible:ring-error-500 active:bg-error-800',
      },
      size: {
        // 小尺寸
        sm: 'h-9 rounded-md px-3 text-xs',
        // 默认尺寸
        default: 'h-10 px-4 py-2',
        // 大尺寸
        lg: 'h-11 rounded-md px-8 text-base',
        // 图标按钮
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

// 加载图标组件
const LoadingSpinner = ({ className }: { className?: string }) => (
  <svg
    className={cn('animate-spin', className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  // 是否显示加载状态
  loading?: boolean;
  // 左侧图标
  leftIcon?: React.ReactNode;
  // 右侧图标
  rightIcon?: React.ReactNode;
  // 是否为全宽按钮
  fullWidth?: boolean;
  // 链接地址（如果提供，则渲染为 Link）
  href?: string;
  // 是否在新标签页打开
  target?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      href,
      target,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const buttonClasses = cn(
      buttonVariants({ variant, size, className }),
      fullWidth && 'w-full',
      loading && 'cursor-wait'
    );

    const content = (
      <>
        {/* 左侧图标或加载图标 */}
        {loading ? (
          <LoadingSpinner className="mr-2 h-4 w-4" />
        ) : leftIcon ? (
          <span className="mr-2 flex items-center">{leftIcon}</span>
        ) : null}

        {/* 按钮内容 */}
        {children}

        {/* 右侧图标 */}
        {rightIcon && !loading && (
          <span className="ml-2 flex items-center">{rightIcon}</span>
        )}
      </>
    );

    // 如果提供了 href，渲染为 Link
    if (href && !isDisabled) {
      return (
        <Link
          href={href}
          target={target}
          className={buttonClasses}
        >
          {content}
        </Link>
      );
    }

    // 否则渲染为 button
    return (
      <button
        className={buttonClasses}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
export default Button;


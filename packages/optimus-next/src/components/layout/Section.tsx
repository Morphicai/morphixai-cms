import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// Section 变体配置
const sectionVariants = cva(
  'w-full',
  {
    variants: {
      // 内边距变体
      padding: {
        none: '',
        sm: 'py-8',
        default: 'py-12',
        lg: 'py-16',
        xl: 'py-20',
      },
      // 背景变体
      background: {
        transparent: 'bg-transparent',
        default: 'bg-background',
        muted: 'bg-muted',
        accent: 'bg-accent',
        primary: 'bg-primary-50 dark:bg-primary-950',
        secondary: 'bg-secondary-50 dark:bg-secondary-950',
      },
      // 边框变体
      border: {
        none: '',
        top: 'border-t border-border',
        bottom: 'border-b border-border',
        both: 'border-t border-b border-border',
      },
      // 最大宽度
      maxWidth: {
        none: '',
        sm: 'max-w-screen-sm mx-auto',
        md: 'max-w-screen-md mx-auto',
        lg: 'max-w-screen-lg mx-auto',
        xl: 'max-w-screen-xl mx-auto',
        '2xl': 'max-w-screen-2xl mx-auto',
        full: 'max-w-full',
      },
    },
    defaultVariants: {
      padding: 'default',
      background: 'transparent',
      border: 'none',
      maxWidth: 'xl',
    },
  }
);

export interface SectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionVariants> {
  // 是否使用 section 标签
  as?: 'section' | 'div' | 'article' | 'main' | 'aside';
  // 内容容器
  container?: boolean;
  // 容器内边距
  containerPadding?: 'sm' | 'md' | 'lg';
}

const Section = forwardRef<HTMLElement, SectionProps>(
  (
    {
      className,
      padding,
      background,
      border,
      maxWidth,
      as: Component = 'section',
      container = true,
      containerPadding = 'md',
      children,
      ...props
    },
    ref
  ) => {
    const containerPaddingClasses = {
      sm: 'px-4',
      md: 'px-6',
      lg: 'px-8',
    };

    const content = container ? (
      <div className={cn('mx-auto w-full', maxWidth !== 'none' && maxWidth !== 'full' && 'container', containerPaddingClasses[containerPadding])}>
        {children}
      </div>
    ) : (
      children
    );

    return (
      <Component
        ref={ref as any}
        className={cn(sectionVariants({ padding, background, border, maxWidth: container ? 'full' : maxWidth, className }))}
        {...props}
      >
        {content}
      </Component>
    );
  }
);

Section.displayName = 'Section';

export { Section, sectionVariants };
export default Section;
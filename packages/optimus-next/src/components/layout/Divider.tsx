import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// Divider 变体配置
const dividerVariants = cva(
  'border-border',
  {
    variants: {
      // 方向
      orientation: {
        horizontal: 'w-full border-t',
        vertical: 'h-full border-l',
      },
      // 粗细
      thickness: {
        thin: 'border-t-[1px] border-l-[1px]',
        medium: 'border-t-2 border-l-2',
        thick: 'border-t-4 border-l-4',
      },
      // 样式
      variant: {
        solid: 'border-solid',
        dashed: 'border-dashed',
        dotted: 'border-dotted',
      },
      // 颜色
      colorScheme: {
        default: 'border-border',
        muted: 'border-muted-foreground/20',
        primary: 'border-primary-200 dark:border-primary-800',
        secondary: 'border-secondary-200 dark:border-secondary-800',
        accent: 'border-accent-200 dark:border-accent-800',
      },
      // 间距
      spacing: {
        none: '',
        sm: '',
        md: '',
        lg: '',
        xl: '',
      },
    },
    compoundVariants: [
      // 水平分隔符间距
      { orientation: 'horizontal', spacing: 'sm', class: 'my-2' },
      { orientation: 'horizontal', spacing: 'md', class: 'my-4' },
      { orientation: 'horizontal', spacing: 'lg', class: 'my-6' },
      { orientation: 'horizontal', spacing: 'xl', class: 'my-8' },
      
      // 垂直分隔符间距
      { orientation: 'vertical', spacing: 'sm', class: 'mx-2' },
      { orientation: 'vertical', spacing: 'md', class: 'mx-4' },
      { orientation: 'vertical', spacing: 'lg', class: 'mx-6' },
      { orientation: 'vertical', spacing: 'xl', class: 'mx-8' },
    ],
    defaultVariants: {
      orientation: 'horizontal',
      thickness: 'thin',
      variant: 'solid',
      colorScheme: 'default',
      spacing: 'md',
    },
  }
);

export interface DividerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dividerVariants> {
  // 标签文本
  label?: string;
  // 标签位置
  labelPosition?: 'left' | 'center' | 'right';
}

const Divider = forwardRef<HTMLDivElement, DividerProps>(
  (
    {
      className,
      orientation,
      thickness,
      variant,
      colorScheme,
      spacing,
      label,
      labelPosition = 'center',
      ...props
    },
    ref
  ) => {
    // 如果有标签，只支持水平分隔符
    if (label && orientation === 'horizontal') {
      const labelPositionClasses = {
        left: 'justify-start',
        center: 'justify-center',
        right: 'justify-end',
      };

      return (
        <div
          ref={ref}
          className={cn(
            'flex items-center',
            spacing === 'sm' && 'my-2',
            spacing === 'md' && 'my-4',
            spacing === 'lg' && 'my-6',
            spacing === 'xl' && 'my-8',
            labelPositionClasses[labelPosition],
            className
          )}
          {...props}
        >
          <div className={cn(
            'flex-1',
            dividerVariants({ orientation, thickness, variant, colorScheme, spacing: 'none' })
          )} />
          <span className="px-3 text-sm text-muted-foreground bg-background">
            {label}
          </span>
          <div className={cn(
            'flex-1',
            dividerVariants({ orientation, thickness, variant, colorScheme, spacing: 'none' })
          )} />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(dividerVariants({ orientation, thickness, variant, colorScheme, spacing, className }))}
        {...props}
      />
    );
  }
);

Divider.displayName = 'Divider';

export { Divider, dividerVariants };
export default Divider;
import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

// 卡片变体配置
const cardVariants = cva(
  'rounded-lg border bg-card text-card-foreground shadow-sm transition-colors',
  {
    variants: {
      variant: {
        // 默认卡片 - 简单边框
        default: 'border-border',
        // 立体卡片 - 带阴影
        elevated: 'border-border shadow-md hover:shadow-lg',
        // 轮廓卡片 - 粗边框
        outlined: 'border-2 border-border',
        // 幽灵卡片 - 透明背景
        ghost: 'border-transparent bg-transparent shadow-none',
        // 填充卡片 - 有背景色
        filled: 'border-transparent bg-muted',
      },
      padding: {
        none: '',
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'default',
    },
  }
);

// 卡片头部变体
const cardHeaderVariants = cva(
  'flex flex-col space-y-1.5',
  {
    variants: {
      padding: {
        none: '',
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      padding: 'default',
    },
  }
);

// 卡片内容变体
const cardContentVariants = cva(
  '',
  {
    variants: {
      padding: {
        none: '',
        sm: 'p-4 pt-0',
        default: 'p-6 pt-0',
        lg: 'p-8 pt-0',
      },
    },
    defaultVariants: {
      padding: 'default',
    },
  }
);

// 卡片页脚变体
const cardFooterVariants = cva(
  'flex items-center border-t bg-muted/50',
  {
    variants: {
      padding: {
        none: '',
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      padding: 'default',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  // 卡片标题
  title?: string;
  // 卡片描述
  description?: string;
  // 卡片页脚内容
  footer?: React.ReactNode;
  // 是否可悬停
  hoverable?: boolean;
  // 是否可点击
  clickable?: boolean;
}

// 主卡片组件
const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant,
      padding,
      title,
      description,
      footer,
      hoverable = false,
      clickable = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, padding, className }),
          hoverable && 'hover:shadow-md transition-shadow',
          clickable && 'cursor-pointer hover:bg-accent/50'
        )}
        {...props}
      >
        {(title || description) && (
          <CardHeader padding={padding}>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        
        {children && (
          <CardContent padding={padding}>
            {children}
          </CardContent>
        )}
        
        {footer && (
          <CardFooter padding={padding}>
            {footer}
          </CardFooter>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';

// 卡片头部组件
export interface CardHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardHeaderVariants> {}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardHeaderVariants({ padding, className }))}
      {...props}
    />
  )
);

CardHeader.displayName = 'CardHeader';

// 卡片标题组件
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const CardTitle = forwardRef<HTMLParagraphElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);

CardTitle.displayName = 'CardTitle';

// 卡片描述组件
export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
);

CardDescription.displayName = 'CardDescription';

// 卡片内容组件
export interface CardContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardContentVariants> {}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardContentVariants({ padding, className }))}
      {...props}
    />
  )
);

CardContent.displayName = 'CardContent';

// 卡片页脚组件
export interface CardFooterProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardFooterVariants> {}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardFooterVariants({ padding, className }))}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
};

export default Card;


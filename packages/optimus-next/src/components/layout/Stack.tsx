import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// Stack 变体配置
const stackVariants = cva(
  'flex',
  {
    variants: {
      // 方向
      direction: {
        vertical: 'flex-col',
        horizontal: 'flex-row',
      },
      // 间距
      spacing: {
        none: 'gap-0',
        xs: 'gap-1',
        sm: 'gap-2',
        md: 'gap-4',
        lg: 'gap-6',
        xl: 'gap-8',
        '2xl': 'gap-12',
      },
      // 对齐方式
      align: {
        start: 'items-start',
        center: 'items-center',
        end: 'items-end',
        stretch: 'items-stretch',
        baseline: 'items-baseline',
      },
      // 分布方式
      justify: {
        start: 'justify-start',
        center: 'justify-center',
        end: 'justify-end',
        between: 'justify-between',
        around: 'justify-around',
        evenly: 'justify-evenly',
      },
      // 换行
      wrap: {
        nowrap: 'flex-nowrap',
        wrap: 'flex-wrap',
        'wrap-reverse': 'flex-wrap-reverse',
      },
    },
    defaultVariants: {
      direction: 'vertical',
      spacing: 'md',
      align: 'stretch',
      justify: 'start',
      wrap: 'nowrap',
    },
  }
);

export interface StackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stackVariants> {
  // 是否为内联元素
  inline?: boolean;
  // 分隔符
  divider?: React.ReactNode;
}

const Stack = forwardRef<HTMLDivElement, StackProps>(
  (
    {
      className,
      direction,
      spacing,
      align,
      justify,
      wrap,
      inline = false,
      divider,
      children,
      ...props
    },
    ref
  ) => {
    const childrenArray = React.Children.toArray(children);
    
    const content = divider ? (
      childrenArray.map((child, index) => (
        <React.Fragment key={index}>
          {child}
          {index < childrenArray.length - 1 && (
            <div className="flex-shrink-0">
              {divider}
            </div>
          )}
        </React.Fragment>
      ))
    ) : (
      children
    );

    return (
      <div
        ref={ref}
        className={cn(
          stackVariants({ 
            direction, 
            spacing: divider ? 'none' : spacing, 
            align, 
            justify, 
            wrap, 
            className 
          }),
          inline && 'inline-flex'
        )}
        {...props}
      >
        {content}
      </div>
    );
  }
);

Stack.displayName = 'Stack';

// 垂直堆叠组件（VStack）
export interface VStackProps extends Omit<StackProps, 'direction'> {}

const VStack = forwardRef<HTMLDivElement, VStackProps>(
  ({ ...props }, ref) => (
    <Stack ref={ref} direction="vertical" {...props} />
  )
);

VStack.displayName = 'VStack';

// 水平堆叠组件（HStack）
export interface HStackProps extends Omit<StackProps, 'direction'> {}

const HStack = forwardRef<HTMLDivElement, HStackProps>(
  ({ ...props }, ref) => (
    <Stack ref={ref} direction="horizontal" {...props} />
  )
);

HStack.displayName = 'HStack';

export { Stack, VStack, HStack, stackVariants };
export default Stack;
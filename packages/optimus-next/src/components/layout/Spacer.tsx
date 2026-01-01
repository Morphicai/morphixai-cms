import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// Spacer 变体配置
const spacerVariants = cva(
  'flex-shrink-0',
  {
    variants: {
      // 方向
      axis: {
        vertical: 'w-full',
        horizontal: 'h-full',
        both: 'w-full h-full',
      },
      // 尺寸
      size: {
        xs: '',
        sm: '',
        md: '',
        lg: '',
        xl: '',
        '2xl': '',
        auto: 'flex-1',
      },
    },
    compoundVariants: [
      // 垂直间距
      { axis: 'vertical', size: 'xs', class: 'h-1' },
      { axis: 'vertical', size: 'sm', class: 'h-2' },
      { axis: 'vertical', size: 'md', class: 'h-4' },
      { axis: 'vertical', size: 'lg', class: 'h-6' },
      { axis: 'vertical', size: 'xl', class: 'h-8' },
      { axis: 'vertical', size: '2xl', class: 'h-12' },
      
      // 水平间距
      { axis: 'horizontal', size: 'xs', class: 'w-1' },
      { axis: 'horizontal', size: 'sm', class: 'w-2' },
      { axis: 'horizontal', size: 'md', class: 'w-4' },
      { axis: 'horizontal', size: 'lg', class: 'w-6' },
      { axis: 'horizontal', size: 'xl', class: 'w-8' },
      { axis: 'horizontal', size: '2xl', class: 'w-12' },
      
      // 双向间距
      { axis: 'both', size: 'xs', class: 'w-1 h-1' },
      { axis: 'both', size: 'sm', class: 'w-2 h-2' },
      { axis: 'both', size: 'md', class: 'w-4 h-4' },
      { axis: 'both', size: 'lg', class: 'w-6 h-6' },
      { axis: 'both', size: 'xl', class: 'w-8 h-8' },
      { axis: 'both', size: '2xl', class: 'w-12 h-12' },
    ],
    defaultVariants: {
      axis: 'vertical',
      size: 'md',
    },
  }
);

export interface SpacerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spacerVariants> {
  // 自定义尺寸
  width?: string | number;
  height?: string | number;
}

const Spacer = forwardRef<HTMLDivElement, SpacerProps>(
  (
    {
      className,
      axis,
      size,
      width,
      height,
      style,
      ...props
    },
    ref
  ) => {
    const customStyle = {
      ...style,
      ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
      ...(height && { height: typeof height === 'number' ? `${height}px` : height }),
    };

    return (
      <div
        ref={ref}
        className={cn(spacerVariants({ axis, size, className }))}
        style={customStyle}
        {...props}
      />
    );
  }
);

Spacer.displayName = 'Spacer';

export { Spacer, spacerVariants };
export default Spacer;
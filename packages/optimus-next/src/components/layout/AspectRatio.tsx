import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement> {
  // 宽高比 (width / height)
  ratio?: number;
  // 预设比例
  preset?: '1:1' | '4:3' | '16:9' | '21:9' | '3:2' | '2:3' | '9:16';
}

// 预设比例映射
const presetRatios = {
  '1:1': 1,
  '4:3': 4 / 3,
  '16:9': 16 / 9,
  '21:9': 21 / 9,
  '3:2': 3 / 2,
  '2:3': 2 / 3,
  '9:16': 9 / 16,
};

const AspectRatio = forwardRef<HTMLDivElement, AspectRatioProps>(
  (
    {
      className,
      ratio,
      preset,
      children,
      style,
      ...props
    },
    ref
  ) => {
    // 计算最终比例
    const finalRatio = ratio || (preset ? presetRatios[preset] : 1);
    
    // 计算 padding-bottom 百分比
    const paddingBottom = `${(1 / finalRatio) * 100}%`;

    return (
      <div
        ref={ref}
        className={cn('relative w-full', className)}
        style={{
          paddingBottom,
          ...style,
        }}
        {...props}
      >
        <div className="absolute inset-0">
          {children}
        </div>
      </div>
    );
  }
);

AspectRatio.displayName = 'AspectRatio';

export { AspectRatio };
export default AspectRatio;
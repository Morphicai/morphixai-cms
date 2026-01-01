import React from 'react';
import { useTheme } from './ThemeProvider';

// 响应式断点类型
type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

// 网格容器属性
interface ContainerProps {
  children: React.ReactNode;
  maxWidth?: ResponsiveValue<string>;
  padding?: ResponsiveValue<string>;
  className?: string;
}

// 网格行属性
interface RowProps {
  children: React.ReactNode;
  gap?: ResponsiveValue<string>;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  className?: string;
}

// 网格列属性
interface ColProps {
  children: React.ReactNode;
  span?: ResponsiveValue<number>;
  offset?: ResponsiveValue<number>;
  order?: ResponsiveValue<number>;
  className?: string;
}

// 网格系统属性
interface GridProps {
  children: React.ReactNode;
  cols?: ResponsiveValue<number>;
  gap?: ResponsiveValue<string>;
  className?: string;
}

// 响应式值转换为 CSS 类
function getResponsiveClasses<T>(
  value: ResponsiveValue<T>,
  prefix: string,
  transform?: (val: T) => string
): string {
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value)
      .map(([breakpoint, val]) => {
        const transformedVal = transform ? transform(val as T) : val;
        return breakpoint === 'sm' 
          ? `${prefix}-${transformedVal}`
          : `${breakpoint}:${prefix}-${transformedVal}`;
      })
      .join(' ');
  }
  
  const transformedVal = transform ? transform(value as T) : value;
  return `${prefix}-${transformedVal}`;
}

// 容器组件
export function Container({ 
  children, 
  maxWidth = { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px' },
  padding = { sm: '1.5rem', md: '2rem', lg: '3rem', xl: '4rem', '2xl': '5rem' },
  className = '' 
}: ContainerProps) {
  const maxWidthClasses = typeof maxWidth === 'string' 
    ? `max-w-[${maxWidth}]`
    : Object.entries(maxWidth)
        .map(([breakpoint, width]) => 
          breakpoint === 'sm' ? `max-w-[${width}]` : `${breakpoint}:max-w-[${width}]`
        )
        .join(' ');

  const paddingClasses = typeof padding === 'string'
    ? `px-[${padding}]`
    : Object.entries(padding)
        .map(([breakpoint, pad]) => 
          breakpoint === 'sm' ? `px-[${pad}]` : `${breakpoint}:px-[${pad}]`
        )
        .join(' ');

  return (
    <div className={`mx-auto w-full ${maxWidthClasses} ${paddingClasses} ${className}`}>
      {children}
    </div>
  );
}

// 行组件
export function Row({ 
  children, 
  gap = '1rem',
  align = 'stretch',
  justify = 'start',
  className = '' 
}: RowProps) {
  const gapClasses = typeof gap === 'string'
    ? `gap-[${gap}]`
    : Object.entries(gap)
        .map(([breakpoint, gapVal]) => 
          breakpoint === 'sm' ? `gap-[${gapVal}]` : `${breakpoint}:gap-[${gapVal}]`
        )
        .join(' ');

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  return (
    <div className={`flex flex-wrap ${gapClasses} ${alignClasses[align]} ${justifyClasses[justify]} ${className}`}>
      {children}
    </div>
  );
}

// 列组件
export function Col({ 
  children, 
  span = 12,
  offset = 0,
  order,
  className = '' 
}: ColProps) {
  const spanClasses = getResponsiveClasses(span, 'col-span', (val) => val.toString());
  const offsetClasses = typeof offset === 'number' && offset > 0
    ? getResponsiveClasses(offset, 'col-start', (val) => (val + 1).toString())
    : '';
  const orderClasses = order 
    ? getResponsiveClasses(order, 'order', (val) => val.toString())
    : '';

  return (
    <div className={`${spanClasses} ${offsetClasses} ${orderClasses} ${className}`}>
      {children}
    </div>
  );
}

// CSS Grid 组件
export function Grid({ 
  children, 
  cols = 12,
  gap = '1rem',
  className = '' 
}: GridProps) {
  const colsClasses = getResponsiveClasses(cols, 'grid-cols', (val) => val.toString());
  const gapClasses = typeof gap === 'string'
    ? `gap-[${gap}]`
    : Object.entries(gap)
        .map(([breakpoint, gapVal]) => 
          breakpoint === 'sm' ? `gap-[${gapVal}]` : `${breakpoint}:gap-[${gapVal}]`
        )
        .join(' ');

  return (
    <div className={`grid ${colsClasses} ${gapClasses} ${className}`}>
      {children}
    </div>
  );
}

// Flexbox 布局组件
interface FlexProps {
  children: React.ReactNode;
  direction?: ResponsiveValue<'row' | 'col' | 'row-reverse' | 'col-reverse'>;
  wrap?: ResponsiveValue<'wrap' | 'nowrap' | 'wrap-reverse'>;
  align?: ResponsiveValue<'start' | 'center' | 'end' | 'stretch' | 'baseline'>;
  justify?: ResponsiveValue<'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'>;
  gap?: ResponsiveValue<string>;
  className?: string;
}

export function Flex({ 
  children, 
  direction = 'row',
  wrap = 'wrap',
  align = 'stretch',
  justify = 'start',
  gap = '0',
  className = '' 
}: FlexProps) {
  const directionClasses = getResponsiveClasses(direction, 'flex', (val) => {
    const dirMap = {
      'row': 'row',
      'col': 'col',
      'row-reverse': 'row-reverse',
      'col-reverse': 'col-reverse',
    };
    return dirMap[val];
  });

  const wrapClasses = getResponsiveClasses(wrap, 'flex', (val) => {
    const wrapMap = {
      'wrap': 'wrap',
      'nowrap': 'nowrap',
      'wrap-reverse': 'wrap-reverse',
    };
    return wrapMap[val];
  });

  const alignClasses = getResponsiveClasses(align, 'items', (val) => {
    const alignMap = {
      'start': 'start',
      'center': 'center',
      'end': 'end',
      'stretch': 'stretch',
      'baseline': 'baseline',
    };
    return alignMap[val];
  });

  const justifyClasses = getResponsiveClasses(justify, 'justify', (val) => {
    const justifyMap = {
      'start': 'start',
      'center': 'center',
      'end': 'end',
      'between': 'between',
      'around': 'around',
      'evenly': 'evenly',
    };
    return justifyMap[val];
  });

  const gapClasses = typeof gap === 'string'
    ? gap !== '0' ? `gap-[${gap}]` : ''
    : Object.entries(gap)
        .map(([breakpoint, gapVal]) => 
          gapVal !== '0' 
            ? (breakpoint === 'sm' ? `gap-[${gapVal}]` : `${breakpoint}:gap-[${gapVal}]`)
            : ''
        )
        .filter(Boolean)
        .join(' ');

  return (
    <div className={`flex ${directionClasses} ${wrapClasses} ${alignClasses} ${justifyClasses} ${gapClasses} ${className}`}>
      {children}
    </div>
  );
}

// 响应式工具 Hook
export function useBreakpoint() {
  const { tokens } = useTheme();
  const [currentBreakpoint, setCurrentBreakpoint] = React.useState<Breakpoint>('sm');

  React.useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width >= parseInt(tokens.breakpoints['2xl'])) {
        setCurrentBreakpoint('2xl');
      } else if (width >= parseInt(tokens.breakpoints.xl)) {
        setCurrentBreakpoint('xl');
      } else if (width >= parseInt(tokens.breakpoints.lg)) {
        setCurrentBreakpoint('lg');
      } else if (width >= parseInt(tokens.breakpoints.md)) {
        setCurrentBreakpoint('md');
      } else {
        setCurrentBreakpoint('sm');
      }
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, [tokens.breakpoints]);

  return currentBreakpoint;
}

// 响应式值解析 Hook
export function useResponsiveValue<T>(value: ResponsiveValue<T>): T {
  const breakpoint = useBreakpoint();
  
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const responsiveValue = value as Partial<Record<Breakpoint, T>>;
    // 按优先级查找匹配的断点值
    const breakpoints: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm'];
    const currentIndex = breakpoints.indexOf(breakpoint);
    
    for (let i = currentIndex; i < breakpoints.length; i++) {
      const bp = breakpoints[i];
      if (responsiveValue[bp] !== undefined) {
        return responsiveValue[bp] as T;
      }
    }
    
    // 如果没有找到匹配的断点，返回第一个可用值
    const firstValue = Object.values(responsiveValue)[0];
    return firstValue as T;
  }
  
  return value as T;
}
import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 40, className = '' }: LogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 背景圆环 */}
      <circle cx="100" cy="100" r="90" stroke="url(#gradient1)" strokeWidth="8" fill="none"/>
      
      {/* 内部装饰圆环 */}
      <circle cx="100" cy="100" r="70" stroke="url(#gradient2)" strokeWidth="6" fill="none" opacity="0.6"/>
      
      {/* 中心圆点 */}
      <circle cx="100" cy="100" r="35" fill="url(#gradient3)"/>
      
      {/* 动态弧线装饰 */}
      <path d="M 100 10 A 90 90 0 0 1 190 100" stroke="url(#gradient4)" strokeWidth="10" fill="none" strokeLinecap="round"/>
      <path d="M 190 100 A 90 90 0 0 1 100 190" stroke="url(#gradient5)" strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.8"/>
      
      {/* 渐变定义 */}
      <defs>
        {/* 主渐变 - 蓝色到绿色 */}
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#3576f6', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
        </linearGradient>
        
        {/* 内环渐变 - 紫色到蓝色 */}
        <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#3576f6', stopOpacity: 1 }} />
        </linearGradient>
        
        {/* 中心圆渐变 */}
        <radialGradient id="gradient3" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={{ stopColor: '#5c8df7', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#3576f6', stopOpacity: 1 }} />
        </radialGradient>
        
        {/* 弧线渐变1 */}
        <linearGradient id="gradient4" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#3576f6', stopOpacity: 1 }} />
        </linearGradient>
        
        {/* 弧线渐变2 */}
        <linearGradient id="gradient5" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#3576f6', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
    </svg>
  );
}

interface LogoIconProps {
  size?: number;
  className?: string;
}

// 简化版Logo用于小尺寸显示（如favicon）
export function LogoIcon({ size = 32, className = '' }: LogoIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 简化版logo用于favicon */}
      <circle cx="16" cy="16" r="14" fill="url(#iconGradient1)"/>
      <circle cx="16" cy="16" r="6" fill="white"/>
      <circle cx="16" cy="16" r="4" fill="url(#iconGradient2)"/>
      
      <defs>
        <linearGradient id="iconGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#3576f6', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
        </linearGradient>
        
        <linearGradient id="iconGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#5c8df7', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#3576f6', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
    </svg>
  );
}


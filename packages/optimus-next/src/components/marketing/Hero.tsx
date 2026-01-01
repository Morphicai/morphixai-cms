/**
 * Hero - 英雄区组件
 * 用于首页顶部的主要宣传区域
 */

'use client';

import { Button } from '../Button';
import { DynamicText, DynamicImage } from '../dynamic-content';

export interface HeroProps {
  titleKey?: string;
  subtitleKey?: string;
  ctaPrimaryText?: string;
  ctaPrimaryHref?: string;
  ctaSecondaryText?: string;
  ctaSecondaryHref?: string;
  backgroundImageKey?: string;
  variant?: 'default' | 'centered' | 'split';
  className?: string;
}

export function Hero({
  titleKey,
  subtitleKey,
  ctaPrimaryText = '立即开始',
  ctaPrimaryHref = '/docs/getting-started',
  ctaSecondaryText = '了解更多',
  ctaSecondaryHref = '/docs',
  backgroundImageKey,
  variant = 'centered',
  className = '',
}: HeroProps) {
  const variantClasses = {
    default: 'text-left',
    centered: 'text-center mx-auto max-w-4xl',
    split: 'grid grid-cols-1 lg:grid-cols-2 gap-12 items-center',
  };

  return (
    <section className={`relative overflow-hidden bg-gradient-to-br from-[#f5f7ff] via-[#faf6ff] to-[#fff8f5] py-20 lg:py-32 ${className}`}>
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100/40 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-100/30 rounded-full blur-3xl" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-pink-100/20 rounded-full blur-3xl" style={{animationDelay: '3s'}}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className={variantClasses[variant]}>
          {/* 内容区 */}
          <div className={variant === 'split' ? 'lg:pr-12' : ''}>
            {/* 标题 */}
            {titleKey ? (
              <DynamicText
                contentKey={titleKey}
                as="h1"
                className="mb-6 text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-black leading-tight"
                defaultValue="Build Something Amazing"
              />
            ) : (
              <h1 className="mb-6 text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-black leading-tight">
                Build Something Amazing
              </h1>
            )}

            {/* 副标题 */}
            {subtitleKey ? (
              <DynamicText
                contentKey={subtitleKey}
                as="p"
                className="mb-8 text-xl sm:text-2xl text-gray-700 leading-relaxed font-light"
                defaultValue="The best way to build modern web applications"
              />
            ) : (
              <p className="mb-8 text-xl sm:text-2xl text-gray-700 leading-relaxed font-light">
                The best way to build modern web applications
              </p>
            )}

            {/* CTA 按钮 */}
            <div className={`flex flex-col sm:flex-row gap-4 ${variant === 'centered' ? 'justify-center' : ''}`}>
              <Button
                size="lg"
                href={ctaPrimaryHref}
                className="min-w-[200px] h-14 bg-black hover:bg-gray-800 text-white border-0 shadow-xl text-lg font-medium rounded-full transition-all"
              >
                {ctaPrimaryText}
              </Button>
              <Button
                variant="outline"
                size="lg"
                href={ctaSecondaryHref}
                className="min-w-[200px] h-14 bg-white hover:bg-gray-50 text-black border-2 border-gray-200 text-lg font-medium rounded-full transition-all"
              >
                {ctaSecondaryText}
              </Button>
            </div>
          </div>

          {/* 图片区（仅在 split 模式下显示） */}
          {variant === 'split' && backgroundImageKey && (
            <div className="relative aspect-video lg:aspect-square">
              <DynamicImage
                contentKey={backgroundImageKey}
                alt="Hero image"
                fill
                className="object-contain"
                priority
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}


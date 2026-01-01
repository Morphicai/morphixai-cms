/**
 * CTASection - 行动号召区组件
 * 用于引导用户进行特定操作
 */

'use client';

import { Button } from '../Button';
import { DynamicText } from '../dynamic-content';

export interface CTASectionProps {
  titleKey?: string;
  descriptionKey?: string;
  title?: string;
  description?: string;
  primaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
  variant?: 'default' | 'gradient' | 'bordered';
  className?: string;
}

export function CTASection({
  titleKey,
  descriptionKey,
  title = '准备开始了吗？',
  description = '立即开始使用 Optimus CMS，构建您的下一个项目',
  primaryButtonText = '立即开始',
  primaryButtonHref = '/docs/getting-started',
  secondaryButtonText,
  secondaryButtonHref,
  variant = 'gradient',
  className = '',
}: CTASectionProps) {
  const variantClasses = {
    default: 'bg-white',
    gradient: 'bg-gradient-to-br from-[#1e3a8a] via-[#1e40af] to-[#3730a3]',
    bordered: 'bg-white border-2 border-primary-600',
  };

  const isGradient = variant === 'gradient';

  return (
    <section className={`py-16 lg:py-20 bg-gradient-to-b from-gray-50 to-gray-100 ${className}`}>
      <div
        className={`max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 rounded-3xl shadow-2xl ${variantClasses[variant]} ${
          variant !== 'default' ? 'py-16 lg:py-20' : ''
        }`}
      >
        <div className="text-center">
          {/* 标题 */}
          {titleKey ? (
            <DynamicText
              contentKey={titleKey}
              as="h2"
              className={`mb-6 text-4xl lg:text-5xl font-extrabold tracking-tight ${
                isGradient ? 'text-white' : 'text-neutral-900'
              }`}
              defaultValue={title}
            />
          ) : (
            <h2
              className={`mb-6 text-4xl lg:text-5xl font-extrabold tracking-tight ${
                isGradient ? 'text-white' : 'text-neutral-900'
              }`}
            >
              {title}
            </h2>
          )}

          {/* 描述 */}
          {descriptionKey ? (
            <DynamicText
              contentKey={descriptionKey}
              as="p"
              className={`mb-10 text-xl lg:text-2xl leading-relaxed font-medium ${
                isGradient ? 'text-white/95' : 'text-neutral-600'
              }`}
              defaultValue={description}
            />
          ) : (
            <p
              className={`mb-10 text-xl lg:text-2xl leading-relaxed font-medium ${
                isGradient ? 'text-white/95' : 'text-neutral-600'
              }`}
            >
              {description}
            </p>
          )}

          {/* 按钮组 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              href={primaryButtonHref}
              className={`min-w-[200px] h-14 text-lg font-bold rounded-full transition-all shadow-xl ${
                isGradient
                  ? 'bg-white text-primary-700 hover:bg-gray-50 hover:shadow-2xl hover:scale-105 hover:-translate-y-1'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {primaryButtonText}
            </Button>

            {secondaryButtonText && secondaryButtonHref && (
              <Button
                variant="outline"
                size="lg"
                href={secondaryButtonHref}
                className={`min-w-[200px] h-14 text-lg font-bold rounded-full transition-all ${
                  isGradient
                    ? 'bg-white/10 backdrop-blur-sm border-2 border-white/80 text-white hover:bg-white hover:text-primary-700 hover:shadow-xl hover:-translate-y-1'
                    : 'bg-white border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {secondaryButtonText}
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}


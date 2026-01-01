/**
 * FeatureGrid - 功能特性网格组件
 * 用于展示产品的核心功能特性
 */

'use client';

import { ReactNode } from 'react';

export interface Feature {
  id: string;
  icon?: ReactNode;
  title: string;
  description: string;
}

export interface FeatureGridProps {
  features: Feature[];
  columns?: 2 | 3 | 4;
  variant?: 'default' | 'card' | 'minimal';
  className?: string;
}

export function FeatureGrid({
  features,
  columns = 3,
  variant = 'default',
  className = '',
}: FeatureGridProps) {
  const gridClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  const variantClasses = {
    default: 'p-6',
    card: 'p-8 bg-white rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow',
    minimal: 'p-4',
  };

  return (
    <div className={`grid ${gridClasses[columns]} gap-8 ${className}`}>
      {features.map((feature) => (
        <div key={feature.id} className={variantClasses[variant]}>
          {/* 图标 */}
          {feature.icon && (
            <div className="mb-4 text-primary-600">
              {feature.icon}
            </div>
          )}

          {/* 标题 */}
          <h3 className="mb-2 text-xl font-bold text-neutral-900">
            {feature.title}
          </h3>

          {/* 描述 */}
          <p className="text-neutral-600 leading-relaxed">
            {feature.description}
          </p>
        </div>
      ))}
    </div>
  );
}


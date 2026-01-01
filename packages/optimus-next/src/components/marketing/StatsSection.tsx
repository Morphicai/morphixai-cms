/**
 * StatsSection - 统计数据展示组件
 * 用于展示关键数据指标
 */

'use client';

export interface Stat {
  id: string;
  value: string | number;
  label: string;
  suffix?: string;
  prefix?: string;
}

export interface StatsSectionProps {
  stats: Stat[];
  columns?: 2 | 3 | 4;
  variant?: 'default' | 'bordered' | 'background';
  className?: string;
}

export function StatsSection({
  stats,
  columns = 4,
  variant = 'default',
  className = '',
}: StatsSectionProps) {
  const gridClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
  };

  const variantClasses = {
    default: 'py-16 bg-white border-y border-gray-100',
    bordered: 'py-16 bg-white',
    background: 'py-16 bg-neutral-50',
  };

  return (
    <section className={`${variantClasses[variant]} ${className}`}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className={`grid ${gridClasses[columns]} gap-8 lg:gap-12`}>
          {stats.map((stat) => (
            <div
              key={stat.id}
              className={`text-center ${
                variant === 'bordered'
                  ? 'p-6 border border-neutral-200 rounded-lg'
                  : ''
              }`}
            >
              <div className="mb-2 text-5xl font-bold text-black">
                {stat.prefix}
                {stat.value}
                {stat.suffix}
              </div>
              <div className="text-sm text-gray-600 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '../../lib/utils';
import { BreadcrumbItem } from './types';

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  separator?: React.ReactNode;
}

/**
 * 面包屑导航组件
 * 显示当前页面在文档结构中的位置
 */
export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  className,
  separator = (
    <svg
      className="h-4 w-4 text-muted-foreground"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  ),
}) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav
      className={cn('flex items-center space-x-2 text-sm', className)}
      aria-label="面包屑导航"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={item.path}>
            {index > 0 && (
              <span className="flex items-center" aria-hidden="true">
                {separator}
              </span>
            )}
            
            {isLast ? (
              <span className="font-medium text-foreground truncate">
                {item.title}
              </span>
            ) : (
              <Link
                href={item.path}
                className="text-muted-foreground hover:text-foreground transition-colors truncate"
              >
                {item.title}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
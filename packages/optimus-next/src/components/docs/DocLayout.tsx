'use client';

import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { DocNavigation } from './DocNavigation';
import { Breadcrumb } from './Breadcrumb';
import { DocSearch } from './DocSearch';
import { DocSection, BreadcrumbItem, DocSearchResult } from './types';

export interface DocLayoutProps {
  sections: DocSection[];
  breadcrumbs: BreadcrumbItem[];
  currentPath: string;
  children: React.ReactNode;
  className?: string;
  onSearch?: (query: string) => Promise<DocSearchResult[]>;
}

/**
 * 文档布局组件
 * 提供完整的文档页面布局，包含导航、搜索、面包屑等功能
 */
export const DocLayout: React.FC<DocLayoutProps> = ({
  sections,
  breadcrumbs,
  currentPath,
  children,
  className,
  onSearch,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 默认搜索实现
  const defaultSearch = async (query: string): Promise<DocSearchResult[]> => {
    // 这里应该实现真实的搜索逻辑
    // 目前返回模拟数据
    const mockResults: DocSearchResult[] = [
      {
        id: '1',
        title: '快速开始',
        path: '/docs/getting-started',
        type: 'guide',
        excerpt: '了解如何快速开始使用我们的平台...',
        section: '入门指南',
      },
      {
        id: '2',
        title: 'API 认证',
        path: '/docs/api/auth',
        type: 'api',
        excerpt: '用户注册、登录和认证相关接口...',
        section: 'API 参考',
      },
    ];

    return mockResults.filter(result =>
      result.title.toLowerCase().includes(query.toLowerCase()) ||
      result.excerpt.toLowerCase().includes(query.toLowerCase())
    );
  };

  const handleSearch = onSearch || defaultSearch;

  const handleSearchSelect = (result: DocSearchResult) => {
    // 这里可以添加搜索选择的处理逻辑
    window.location.href = result.path;
  };

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* 移动端顶部栏 */}
      <div className="lg:hidden sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-md hover:bg-accent"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          
          <div className="flex-1 max-w-sm mx-4">
            <DocSearch
              onSearch={handleSearch}
              onSelect={handleSearchSelect}
              placeholder="搜索文档..."
            />
          </div>
        </div>
      </div>

      <div className="flex">
        {/* 侧边栏 */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-30 w-64 bg-background border-r border-border',
            'transform transition-transform duration-200 ease-in-out',
            'lg:translate-x-0 lg:static lg:inset-0',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex flex-col h-full">
            {/* 侧边栏头部 */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">文档</h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-1 rounded-md hover:bg-accent"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* 桌面端搜索 */}
            <div className="hidden lg:block p-4 border-b border-border">
              <DocSearch
                onSearch={handleSearch}
                onSelect={handleSearchSelect}
                placeholder="搜索文档..."
              />
            </div>

            {/* 导航 */}
            <div className="flex-1 overflow-y-auto p-4">
              <DocNavigation
                sections={sections}
                currentPath={currentPath}
              />
            </div>
          </div>
        </aside>

        {/* 遮罩层 */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* 主内容区域 */}
        <main className="flex-1 lg:ml-0">
          <div className="max-w-4xl mx-auto px-4 py-8 lg:px-8">
            {/* 面包屑导航 */}
            {breadcrumbs.length > 0 && (
              <div className="mb-8">
                <Breadcrumb items={breadcrumbs} />
              </div>
            )}

            {/* 页面内容 */}
            <div className="prose prose-lg dark:prose-invert max-w-none">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DocLayout;
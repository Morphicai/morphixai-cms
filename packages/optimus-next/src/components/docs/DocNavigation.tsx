'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../../lib/utils';
import { DocSection, DocPage, DocNavigationProps } from './types';

/**
 * 文档导航组件
 * 实现侧边栏导航树结构，支持展开/折叠和当前页面高亮
 */
export const DocNavigation: React.FC<DocNavigationProps> = ({
  sections,
  currentPath,
  onNavigate,
  className,
}) => {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());

  // 当前路径，优先使用 pathname，其次使用 currentPath
  const activePath = pathname || currentPath;

  // 自动展开包含当前页面的节点
  useMemo(() => {
    const newExpandedSections = new Set<string>();
    const newExpandedPages = new Set<string>();

    sections.forEach((section) => {
      // 检查当前路径是否在此节点下
      if (activePath.startsWith(section.path)) {
        newExpandedSections.add(section.id);
      }

      // 递归检查子页面
      const checkPages = (pages: DocPage[], parentPath: string) => {
        pages.forEach((page) => {
          if (activePath.startsWith(page.path)) {
            newExpandedSections.add(section.id);
            if (page.children && page.children.length > 0) {
              newExpandedPages.add(page.id);
            }
          }
          if (page.children) {
            checkPages(page.children, page.path);
          }
        });
      };

      if (section.children) {
        checkPages(section.children, section.path);
      }
    });

    setExpandedSections(newExpandedSections);
    setExpandedPages(newExpandedPages);
  }, [activePath, sections]);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const togglePage = (pageId: string) => {
    const newExpanded = new Set(expandedPages);
    if (newExpanded.has(pageId)) {
      newExpanded.delete(pageId);
    } else {
      newExpanded.add(pageId);
    }
    setExpandedPages(newExpanded);
  };

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    }
  };

  const renderPage = (page: DocPage, level: number = 0) => {
    const isActive = activePath === page.path;
    const hasChildren = page.children && page.children.length > 0;
    const isExpanded = expandedPages.has(page.id);

    return (
      <div key={page.id} className="relative">
        <div
          className={cn(
            'flex items-center group relative',
            level > 0 && 'ml-4 border-l border-border'
          )}
        >
          {level > 0 && (
            <div className="absolute -left-px top-0 h-6 w-px bg-border" />
          )}
          
          <div className={cn(
            'flex items-center flex-1 py-2 px-3 rounded-md text-sm transition-colors',
            level > 0 && 'ml-4',
            isActive
              ? 'bg-primary-100 text-primary-900 font-medium dark:bg-primary-900/50 dark:text-primary-100'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          )}>
            {hasChildren && (
              <button
                onClick={() => togglePage(page.id)}
                className="mr-2 p-0.5 rounded hover:bg-accent"
              >
                <svg
                  className={cn(
                    'h-3 w-3 transition-transform',
                    isExpanded ? 'rotate-90' : 'rotate-0'
                  )}
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
              </button>
            )}

            <Link
              href={page.path}
              onClick={() => handleNavigate(page.path)}
              className="flex-1 flex items-center"
            >
              <span className="truncate">{page.title}</span>
              
              {/* 页面类型标识 */}
              {page.type === 'api' && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded dark:bg-blue-900/50 dark:text-blue-300">
                  API
                </span>
              )}
              {page.type === 'tutorial' && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded dark:bg-green-900/50 dark:text-green-300">
                  教程
                </span>
              )}
              {page.type === 'example' && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded dark:bg-purple-900/50 dark:text-purple-300">
                  示例
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* 子页面 */}
        {hasChildren && isExpanded && (
          <div className="ml-2">
            {page.children!.map((childPage) => renderPage(childPage, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderSection = (section: DocSection) => {
    const isExpanded = expandedSections.has(section.id);
    const hasPages = section.children && section.children.length > 0;

    return (
      <div key={section.id} className="mb-4">
        <div
          className="flex items-center justify-between py-2 px-3 rounded-md cursor-pointer hover:bg-accent group"
          onClick={() => toggleSection(section.id)}
        >
          <div className="flex items-center flex-1">
            {section.icon && (
              <span className="mr-3 text-lg">{section.icon}</span>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-sm">
                {section.title}
              </h3>
              {section.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {section.description}
                </p>
              )}
            </div>
          </div>

          {hasPages && (
            <svg
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform',
                isExpanded ? 'rotate-90' : 'rotate-0'
              )}
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
          )}
        </div>

        {/* 节点页面列表 */}
        {hasPages && isExpanded && (
          <div className="mt-2 space-y-1">
            {section.children!
              .sort((a, b) => a.order - b.order)
              .map((page) => renderPage(page))}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className={cn('space-y-2', className)}>
      {sections
        .sort((a, b) => a.order - b.order)
        .map((section) => renderSection(section))}
    </nav>
  );
};

export default DocNavigation;
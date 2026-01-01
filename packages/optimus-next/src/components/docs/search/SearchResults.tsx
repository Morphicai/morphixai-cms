'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '../../../lib/utils';
import { SearchResultsProps, SearchResult } from './types';

/**
 * 搜索结果组件
 * 显示搜索结果列表，支持高亮和过滤
 */
export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  stats,
  query,
  onResultClick,
  onFilterChange,
  className,
}) => {
  // 高亮搜索关键词
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 text-foreground font-medium">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // 获取类型图标
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'api':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'example':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        );
      case 'section':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  // 获取类型标签颜色
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'api':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'example':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
      case 'section':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300';
    }
  };

  // 获取匹配类型标签
  const getMatchTypeLabel = (matchType: string) => {
    switch (matchType) {
      case 'title':
        return '标题匹配';
      case 'content':
        return '内容匹配';
      case 'tag':
        return '标签匹配';
      case 'path':
        return '路径匹配';
      default:
        return '匹配';
    }
  };

  const renderResult = (result: SearchResult) => (
    <div
      key={result.id}
      className="border border-border rounded-lg p-6 hover:shadow-md transition-shadow bg-background"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1">
          <span className="text-muted-foreground">
            {getTypeIcon(result.type)}
          </span>
          
          <Link
            href={result.path}
            onClick={() => onResultClick(result)}
            className="flex-1"
          >
            <h3 className="text-lg font-semibold text-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              {highlightText(result.title, query)}
            </h3>
          </Link>
        </div>

        <div className="flex items-center space-x-2">
          <span className={cn(
            'px-2 py-1 text-xs font-medium rounded',
            getTypeColor(result.type)
          )}>
            {result.type}
          </span>
          
          <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
            {getMatchTypeLabel(result.matchType)}
          </span>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-sm text-muted-foreground mb-1">
          {result.section} • {result.path}
        </p>
        <p className="text-foreground leading-relaxed">
          {highlightText(result.excerpt, query)}
        </p>
      </div>

      {/* 高亮片段 */}
      {result.highlights && result.highlights.length > 0 && (
        <div className="space-y-2">
          {result.highlights.slice(0, 2).map((highlight, index) => (
            <div key={index} className="bg-muted rounded-md p-3">
              <div className="text-xs text-muted-foreground mb-1">
                {highlight.field === 'title' ? '标题' : '内容'}匹配:
              </div>
              <div className="text-sm text-foreground">
                {highlightText(highlight.text, query)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <Link
          href={result.path}
          onClick={() => onResultClick(result)}
          className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
        >
          查看详情 →
        </Link>
        
        <div className="text-xs text-muted-foreground">
          相关性: {Math.round(result.score)}%
        </div>
      </div>
    </div>
  );

  if (results.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <svg
          className="mx-auto h-12 w-12 text-muted-foreground mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0120 12a8 8 0 00-16 0 8 8 0 006.291 7.836z"
          />
        </svg>
        <h3 className="text-lg font-medium text-foreground mb-2">
          未找到相关结果
        </h3>
        <p className="text-muted-foreground mb-4">
          尝试使用不同的关键词或调整搜索条件
        </p>
        
        <div className="text-sm text-muted-foreground">
          <p>搜索建议:</p>
          <ul className="mt-2 space-y-1">
            <li>• 检查拼写是否正确</li>
            <li>• 尝试使用更通用的关键词</li>
            <li>• 减少搜索词的数量</li>
            <li>• 使用同义词或相关术语</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* 搜索统计 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          找到 <span className="font-medium text-foreground">{stats.totalResults}</span> 个结果
          <span className="ml-2">
            (用时 {stats.searchTime}ms)
          </span>
        </div>

        {/* 快速过滤器 */}
        {stats.filters && stats.filters.length > 0 && (
          <div className="flex items-center space-x-4">
            {stats.filters.map(filter => (
              <div key={filter.key} className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">{filter.label}:</span>
                <div className="flex items-center space-x-1">
                  {filter.options.slice(0, 3).map(option => (
                    <button
                      key={option.value}
                      onClick={() => onFilterChange({ [filter.key]: [option.value] })}
                      className="px-2 py-1 text-xs bg-muted hover:bg-accent text-muted-foreground hover:text-foreground rounded transition-colors"
                    >
                      {option.label} ({option.count})
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 搜索结果列表 */}
      <div className="space-y-4">
        {results.map(renderResult)}
      </div>

      {/* 分页提示 */}
      {results.length >= 20 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            显示前 {results.length} 个结果
          </p>
          <button className="px-4 py-2 text-sm border border-input rounded-md hover:bg-accent transition-colors">
            加载更多结果
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { DocSearchProps, DocSearchResult } from './types';

/**
 * 文档搜索组件
 * 支持实时搜索、结果高亮和键盘导航
 */
export const DocSearch: React.FC<DocSearchProps> = ({
  onSearch,
  onSelect,
  placeholder = '搜索文档...',
  className,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DocSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 防抖搜索
  const debouncedSearch = useCallback(
    async (searchQuery: string) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(async () => {
        if (searchQuery.trim().length > 0) {
          setIsLoading(true);
          try {
            const searchResults = await onSearch(searchQuery);
            setResults(searchResults);
            setSelectedIndex(-1);
          } catch (error) {
            console.error('搜索失败:', error);
            setResults([]);
          } finally {
            setIsLoading(false);
          }
        } else {
          setResults([]);
        }
      }, 300);
    },
    [onSearch]
  );

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
    debouncedSearch(value);
  };

  // 处理键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // 处理选择结果
  const handleSelect = (result: DocSearchResult) => {
    onSelect(result);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  // 高亮搜索关键词
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 text-foreground">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={cn('relative', className)}>
      {/* 搜索输入框 */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            'w-full pl-10 pr-4 py-2 text-sm',
            'border border-input rounded-md',
            'bg-background text-foreground',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'transition-colors'
          )}
        />

        {/* 加载指示器 */}
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <svg
              className="h-4 w-4 text-muted-foreground animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* 搜索结果 */}
      {isOpen && query.trim().length > 0 && (
        <div
          ref={resultsRef}
          className={cn(
            'absolute top-full left-0 right-0 mt-1 z-50',
            'bg-background border border-border rounded-md shadow-lg',
            'max-h-96 overflow-y-auto'
          )}
        >
          {results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  className={cn(
                    'w-full px-4 py-3 text-left hover:bg-accent',
                    'focus:outline-none focus:bg-accent',
                    'transition-colors',
                    selectedIndex === index && 'bg-accent'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground truncate">
                        {highlightText(result.title, query)}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {highlightText(result.excerpt, query)}
                      </p>
                      <div className="flex items-center mt-2 space-x-2">
                        <span className="text-xs text-muted-foreground">
                          {result.section}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded">
                          {result.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : !isLoading ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              <svg
                className="mx-auto h-8 w-8 mb-2"
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
              <p className="text-sm">未找到相关结果</p>
              <p className="text-xs mt-1">尝试使用不同的关键词</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default DocSearch;
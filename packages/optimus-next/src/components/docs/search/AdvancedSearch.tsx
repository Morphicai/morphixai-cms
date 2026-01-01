'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '../../../lib/utils';
import { AdvancedSearchProps, SearchOptions, SearchSuggestion } from './types';

/**
 * 高级搜索组件
 * 支持过滤器、搜索建议和高级搜索选项
 */
export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  onSuggestion,
  className,
}) => {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  // 高级搜索选项
  const [filters, setFilters] = useState({
    type: [] as string[],
    section: [] as string[],
    tags: [] as string[],
  });

  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'title'>('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 防抖获取建议
  const debouncedGetSuggestions = useCallback(
    async (searchQuery: string) => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }

      suggestionTimeoutRef.current = setTimeout(async () => {
        if (searchQuery.trim().length > 0 && onSuggestion) {
          try {
            const newSuggestions = await onSuggestion(searchQuery);
            setSuggestions(newSuggestions);
            setSelectedSuggestion(-1);
          } catch (error) {
            console.error('获取搜索建议失败:', error);
            setSuggestions([]);
          }
        } else {
          setSuggestions([]);
        }
      }, 300);
    },
    [onSuggestion]
  );

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(true);
    debouncedGetSuggestions(value);
  };

  // 处理键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestion(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestion(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestion >= 0 && selectedSuggestion < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedSuggestion]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestion(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // 处理建议选择
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    setSelectedSuggestion(-1);
    
    // 如果是过滤器建议，添加到对应过滤器
    if (suggestion.type === 'filter') {
      // 这里可以根据建议类型添加到相应的过滤器
      // 暂时直接搜索
      setTimeout(() => handleSearch(suggestion.text), 100);
    } else {
      setTimeout(() => handleSearch(suggestion.text), 100);
    }
  };

  // 执行搜索
  const handleSearch = async (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (finalQuery.trim().length === 0) return;

    setIsLoading(true);
    setShowSuggestions(false);

    try {
      const searchOptions: SearchOptions = {
        query: finalQuery,
        type: filters.type.length > 0 ? filters.type : undefined,
        section: filters.section.length > 0 ? filters.section : undefined,
        tags: filters.tags.length > 0 ? filters.tags : undefined,
        sortBy,
        sortOrder,
        limit: 20,
      };

      await onSearch(searchOptions);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 更新过滤器
  const updateFilter = (filterType: keyof typeof filters, value: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: checked
        ? [...prev[filterType], value]
        : prev[filterType].filter(v => v !== value),
    }));
  };

  // 清除所有过滤器
  const clearFilters = () => {
    setFilters({
      type: [],
      section: [],
      tags: [],
    });
  };

  // 点击外部关闭建议
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
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
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
    };
  }, []);

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'recent':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'filter':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        );
      default:
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* 搜索输入框 */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-muted-foreground"
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
          onFocus={() => setShowSuggestions(true)}
          placeholder="搜索文档、API、示例..."
          className={cn(
            'w-full pl-10 pr-20 py-3 text-sm',
            'border border-input rounded-lg',
            'bg-background text-foreground',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'transition-colors'
          )}
        />

        <div className="absolute inset-y-0 right-0 flex items-center space-x-2 pr-3">
          {/* 高级搜索切换 */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'p-1 rounded hover:bg-accent',
              isExpanded && 'text-primary-600 dark:text-primary-400'
            )}
            title="高级搜索"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          </button>

          {/* 搜索按钮 */}
          <button
            onClick={() => handleSearch()}
            disabled={isLoading}
            className={cn(
              'px-3 py-1 rounded-md text-sm font-medium transition-colors',
              'bg-primary-600 text-white hover:bg-primary-700',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isLoading ? '搜索中...' : '搜索'}
          </button>
        </div>
      </div>

      {/* 搜索建议 */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className={cn(
            'absolute top-full left-0 right-0 mt-1 z-50',
            'bg-background border border-border rounded-lg shadow-lg',
            'max-h-80 overflow-y-auto'
          )}
        >
          <div className="py-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.type}-${suggestion.text}`}
                onClick={() => handleSuggestionSelect(suggestion)}
                className={cn(
                  'w-full px-4 py-2 text-left hover:bg-accent',
                  'focus:outline-none focus:bg-accent',
                  'transition-colors flex items-center space-x-3',
                  selectedSuggestion === index && 'bg-accent'
                )}
              >
                <span className="text-muted-foreground">
                  {getSuggestionIcon(suggestion.type)}
                </span>
                <span className="flex-1 text-sm text-foreground">
                  {suggestion.text}
                </span>
                {suggestion.count && (
                  <span className="text-xs text-muted-foreground">
                    {suggestion.count} 个结果
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 高级搜索选项 */}
      {isExpanded && (
        <div className="mt-4 p-4 border border-border rounded-lg bg-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 内容类型过滤 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                内容类型
              </label>
              <div className="space-y-2">
                {[
                  { value: 'page', label: '页面' },
                  { value: 'api', label: 'API' },
                  { value: 'example', label: '示例' },
                  { value: 'section', label: '章节' },
                ].map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.type.includes(option.value)}
                      onChange={(e) => updateFilter('type', option.value, e.target.checked)}
                      className="mr-2 rounded border-input"
                    />
                    <span className="text-sm text-foreground">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 文档分类过滤 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                文档分类
              </label>
              <div className="space-y-2">
                {[
                  { value: '快速开始', label: '快速开始' },
                  { value: 'API 参考', label: 'API 参考' },
                  { value: '开发指南', label: '开发指南' },
                  { value: '示例教程', label: '示例教程' },
                ].map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.section.includes(option.value)}
                      onChange={(e) => updateFilter('section', option.value, e.target.checked)}
                      className="mr-2 rounded border-input"
                    />
                    <span className="text-sm text-foreground">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 排序选项 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                排序方式
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground mb-2"
              >
                <option value="relevance">相关性</option>
                <option value="date">更新时间</option>
                <option value="title">标题</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground"
              >
                <option value="desc">降序</option>
                <option value="asc">升序</option>
              </select>
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-col justify-end space-y-2">
              <button
                onClick={() => handleSearch()}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium"
              >
                应用搜索
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 border border-input text-foreground rounded-md hover:bg-accent text-sm"
              >
                清除过滤器
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
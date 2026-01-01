/**
 * Documentation Search Types
 * 文档搜索相关的类型定义
 */

export interface SearchIndex {
  id: string;
  title: string;
  content: string;
  path: string;
  type: 'page' | 'section' | 'api' | 'example';
  section: string;
  tags: string[];
  lastUpdated: Date;
  weight: number; // 搜索权重
}

export interface SearchResult {
  id: string;
  title: string;
  path: string;
  type: string;
  section: string;
  excerpt: string;
  highlights: SearchHighlight[];
  score: number;
  matchType: 'title' | 'content' | 'tag' | 'path';
}

export interface SearchHighlight {
  field: 'title' | 'content';
  text: string;
  start: number;
  end: number;
}

export interface SearchOptions {
  query: string;
  type?: string[];
  section?: string[];
  tags?: string[];
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'date' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchSuggestion {
  text: string;
  type: 'query' | 'filter' | 'recent';
  count?: number;
}

export interface SearchStats {
  totalResults: number;
  searchTime: number;
  suggestions: SearchSuggestion[];
  filters: SearchFilter[];
}

export interface SearchFilter {
  key: string;
  label: string;
  options: SearchFilterOption[];
}

export interface SearchFilterOption {
  value: string;
  label: string;
  count: number;
  selected?: boolean;
}

export interface AdvancedSearchProps {
  onSearch: (options: SearchOptions) => Promise<{
    results: SearchResult[];
    stats: SearchStats;
  }>;
  onSuggestion?: (query: string) => Promise<SearchSuggestion[]>;
  className?: string;
}

export interface SearchResultsProps {
  results: SearchResult[];
  stats: SearchStats;
  query: string;
  onResultClick: (result: SearchResult) => void;
  onFilterChange: (filters: Record<string, string[]>) => void;
  className?: string;
}
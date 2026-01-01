/**
 * Documentation Search Components
 * 文档搜索组件导出
 */

// 组件导出
export { AdvancedSearch } from './AdvancedSearch';
export { SearchResults } from './SearchResults';

// 服务导出
export { SearchService } from './SearchService';

// 类型导出
export type {
  SearchIndex,
  SearchResult,
  SearchOptions,
  SearchStats,
  SearchSuggestion,
  SearchHighlight,
  SearchFilter,
  SearchFilterOption,
  AdvancedSearchProps,
  SearchResultsProps,
} from './types';

// 默认导出
export { AdvancedSearch as default } from './AdvancedSearch';
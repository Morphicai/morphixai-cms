/**
 * Documentation Components
 * 文档中心组件导出
 */

// 组件导出
export { DocNavigation } from './DocNavigation';
export { Breadcrumb } from './Breadcrumb';
export { DocSearch } from './DocSearch';
export { DocLayout } from './DocLayout';

// API 组件导出
export { ApiEndpoint, ApiTester, ApiGroup } from './api';

// 搜索组件导出
export { AdvancedSearch, SearchResults, SearchService } from './search';

// 类型导出
export type {
  DocSection,
  DocPage,
  DocMetadata,
  DocNavigationProps,
  BreadcrumbItem,
  DocSearchResult,
  DocSearchProps,
} from './types';

// API 类型导出
export type {
  ApiEndpointType,
  ApiParameter,
  ApiRequestBody,
  ApiResponse,
  ApiSchema,
  ApiProperty,
  ApiHeader,
  ApiExample,
  ApiDocProps,
  ApiTestRequest,
  ApiTestResponse,
  CodeExample,
} from './api';

// 搜索类型导出
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
} from './search';

// 默认导出
export { DocNavigation as default } from './DocNavigation';
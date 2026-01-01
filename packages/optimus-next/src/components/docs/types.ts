/**
 * Documentation Types
 * 文档系统相关的类型定义
 */

export interface DocSection {
  id: string;
  title: string;
  description?: string;
  path: string;
  icon?: string;
  order: number;
  children?: DocPage[];
}

export interface DocPage {
  id: string;
  title: string;
  slug: string;
  path: string;
  content?: string;
  type: 'guide' | 'api' | 'tutorial' | 'reference' | 'example';
  order: number;
  metadata: DocMetadata;
  children?: DocPage[];
}

export interface DocMetadata {
  lastUpdated: Date;
  contributors: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime?: number;
  prerequisites?: string[];
  tags?: string[];
}

export interface DocNavigationProps {
  sections: DocSection[];
  currentPath: string;
  onNavigate?: (path: string) => void;
  className?: string;
}

export interface BreadcrumbItem {
  title: string;
  path: string;
}

export interface DocSearchResult {
  id: string;
  title: string;
  path: string;
  type: string;
  excerpt: string;
  section: string;
}

export interface DocSearchProps {
  onSearch: (query: string) => Promise<DocSearchResult[]>;
  onSelect: (result: DocSearchResult) => void;
  placeholder?: string;
  className?: string;
}
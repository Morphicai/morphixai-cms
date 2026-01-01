import { SearchIndex, SearchResult, SearchOptions, SearchStats, SearchSuggestion, SearchHighlight } from './types';

/**
 * 文档搜索服务
 * 实现全文搜索、结果高亮和搜索建议功能
 */
export class SearchService {
  private index: SearchIndex[] = [];
  private recentQueries: string[] = [];

  constructor(initialIndex: SearchIndex[] = []) {
    this.index = initialIndex;
    this.loadRecentQueries();
  }

  /**
   * 更新搜索索引
   */
  updateIndex(newIndex: SearchIndex[]) {
    this.index = newIndex;
  }

  /**
   * 添加文档到索引
   */
  addToIndex(doc: SearchIndex) {
    const existingIndex = this.index.findIndex(item => item.id === doc.id);
    if (existingIndex >= 0) {
      this.index[existingIndex] = doc;
    } else {
      this.index.push(doc);
    }
  }

  /**
   * 执行搜索
   */
  async search(options: SearchOptions): Promise<{ results: SearchResult[]; stats: SearchStats }> {
    const startTime = Date.now();
    const { query, type, section, tags, limit = 20, offset = 0, sortBy = 'relevance', sortOrder = 'desc' } = options;

    // 保存查询历史
    this.saveQuery(query);

    // 预处理查询
    const normalizedQuery = this.normalizeQuery(query);
    const queryTerms = this.tokenize(normalizedQuery);

    if (queryTerms.length === 0) {
      return {
        results: [],
        stats: {
          totalResults: 0,
          searchTime: Date.now() - startTime,
          suggestions: await this.getSuggestions(query),
          filters: this.generateFilters([]),
        },
      };
    }

    // 过滤索引
    let filteredIndex = this.index;

    if (type && type.length > 0) {
      filteredIndex = filteredIndex.filter(item => type.includes(item.type));
    }

    if (section && section.length > 0) {
      filteredIndex = filteredIndex.filter(item => section.includes(item.section));
    }

    if (tags && tags.length > 0) {
      filteredIndex = filteredIndex.filter(item => 
        tags.some(tag => item.tags.includes(tag))
      );
    }

    // 搜索匹配
    const matches = filteredIndex
      .map(item => this.scoreDocument(item, queryTerms, normalizedQuery))
      .filter(match => match.score > 0);

    // 排序
    matches.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          // For date sorting, we need to find the original document
          const docA = filteredIndex.find(doc => doc.id === a.result.id);
          const docB = filteredIndex.find(doc => doc.id === b.result.id);
          const dateA = docA ? new Date(docA.lastUpdated).getTime() : 0;
          const dateB = docB ? new Date(docB.lastUpdated).getTime() : 0;
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        case 'title':
          const titleA = a.result.title.toLowerCase();
          const titleB = b.result.title.toLowerCase();
          return sortOrder === 'asc' 
            ? titleA.localeCompare(titleB)
            : titleB.localeCompare(titleA);
        case 'relevance':
        default:
          return sortOrder === 'asc' ? a.score - b.score : b.score - a.score;
      }
    });

    // 分页
    const paginatedResults = matches.slice(offset, offset + limit);
    const results = paginatedResults.map(match => match.result);

    const searchTime = Date.now() - startTime;

    return {
      results,
      stats: {
        totalResults: matches.length,
        searchTime,
        suggestions: await this.getSuggestions(query),
        filters: this.generateFilters(matches.map(m => m.result)),
      },
    };
  }

  /**
   * 获取搜索建议
   */
  async getSuggestions(query: string): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];
    const normalizedQuery = query.toLowerCase().trim();

    // 最近查询建议
    const recentSuggestions = this.recentQueries
      .filter(q => q.toLowerCase().includes(normalizedQuery) && q !== query)
      .slice(0, 3)
      .map(q => ({
        text: q,
        type: 'recent' as const,
      }));

    suggestions.push(...recentSuggestions);

    // 标题匹配建议
    const titleSuggestions = this.index
      .filter(item => item.title.toLowerCase().includes(normalizedQuery))
      .slice(0, 5)
      .map(item => ({
        text: item.title,
        type: 'query' as const,
      }));

    suggestions.push(...titleSuggestions);

    // 标签建议
    const tagSuggestions = Array.from(
      new Set(
        this.index
          .flatMap(item => item.tags)
          .filter(tag => tag.toLowerCase().includes(normalizedQuery))
      )
    )
      .slice(0, 3)
      .map(tag => ({
        text: tag,
        type: 'filter' as const,
      }));

    suggestions.push(...tagSuggestions);

    // 去重并限制数量
    const uniqueSuggestions = suggestions
      .filter((suggestion, index, self) => 
        self.findIndex(s => s.text === suggestion.text) === index
      )
      .slice(0, 8);

    return uniqueSuggestions;
  }

  /**
   * 为文档评分
   */
  private scoreDocument(doc: SearchIndex, queryTerms: string[], fullQuery: string): { result: SearchResult; score: number } {
    let score = 0;
    let matchType: 'title' | 'content' | 'tag' | 'path' = 'content';
    const highlights: SearchHighlight[] = [];

    const normalizedTitle = this.normalizeQuery(doc.title);
    const normalizedContent = this.normalizeQuery(doc.content);
    const normalizedPath = this.normalizeQuery(doc.path);

    // 完全匹配标题 (最高权重)
    if (normalizedTitle.includes(fullQuery)) {
      score += 100 * doc.weight;
      matchType = 'title';
      highlights.push({
        field: 'title',
        text: doc.title,
        start: normalizedTitle.indexOf(fullQuery),
        end: normalizedTitle.indexOf(fullQuery) + fullQuery.length,
      });
    }

    // 标题词汇匹配
    queryTerms.forEach(term => {
      if (normalizedTitle.includes(term)) {
        score += 50 * doc.weight;
        if (matchType === 'content') matchType = 'title';
      }
    });

    // 路径匹配
    if (normalizedPath.includes(fullQuery)) {
      score += 30 * doc.weight;
      if (matchType === 'content') matchType = 'path';
    }

    // 标签匹配
    doc.tags.forEach(tag => {
      const normalizedTag = this.normalizeQuery(tag);
      if (normalizedTag.includes(fullQuery) || queryTerms.some(term => normalizedTag.includes(term))) {
        score += 40 * doc.weight;
        if (matchType === 'content') matchType = 'tag';
      }
    });

    // 内容匹配
    queryTerms.forEach(term => {
      const contentMatches = this.findMatches(normalizedContent, term);
      score += contentMatches.length * 10 * doc.weight;

      // 添加内容高亮
      contentMatches.slice(0, 3).forEach(match => {
        highlights.push({
          field: 'content',
          text: doc.content.substring(Math.max(0, match.start - 50), match.end + 50),
          start: Math.max(0, match.start - 50),
          end: match.end + 50,
        });
      });
    });

    if (score === 0) {
      return { result: {} as SearchResult, score: 0 };
    }

    // 生成摘要
    const excerpt = this.generateExcerpt(doc.content, queryTerms);

    const result: SearchResult = {
      id: doc.id,
      title: doc.title,
      path: doc.path,
      type: doc.type,
      section: doc.section,
      excerpt,
      highlights,
      score,
      matchType,
    };

    return { result, score };
  }

  /**
   * 查找匹配位置
   */
  private findMatches(text: string, term: string): Array<{ start: number; end: number }> {
    const matches: Array<{ start: number; end: number }> = [];
    let index = 0;

    while (index < text.length) {
      const found = text.indexOf(term, index);
      if (found === -1) break;

      matches.push({
        start: found,
        end: found + term.length,
      });

      index = found + 1;
    }

    return matches;
  }

  /**
   * 生成摘要
   */
  private generateExcerpt(content: string, queryTerms: string[], maxLength: number = 200): string {
    const normalizedContent = this.normalizeQuery(content);
    
    // 找到第一个匹配的位置
    let bestStart = 0;
    let bestScore = 0;

    queryTerms.forEach(term => {
      const index = normalizedContent.indexOf(term);
      if (index !== -1) {
        const score = queryTerms.filter(t => 
          normalizedContent.substring(Math.max(0, index - 100), index + 100).includes(t)
        ).length;

        if (score > bestScore) {
          bestScore = score;
          bestStart = Math.max(0, index - 50);
        }
      }
    });

    const excerpt = content.substring(bestStart, bestStart + maxLength);
    return bestStart > 0 ? '...' + excerpt + '...' : excerpt + '...';
  }

  /**
   * 生成过滤器选项
   */
  private generateFilters(results: SearchResult[]) {
    const typeCount: Record<string, number> = {};
    const sectionCount: Record<string, number> = {};

    results.forEach(result => {
      typeCount[result.type] = (typeCount[result.type] || 0) + 1;
      sectionCount[result.section] = (sectionCount[result.section] || 0) + 1;
    });

    return [
      {
        key: 'type',
        label: '内容类型',
        options: Object.entries(typeCount).map(([value, count]) => ({
          value,
          label: this.getTypeLabel(value),
          count,
        })),
      },
      {
        key: 'section',
        label: '文档分类',
        options: Object.entries(sectionCount).map(([value, count]) => ({
          value,
          label: value,
          count,
        })),
      },
    ];
  }

  /**
   * 获取类型标签
   */
  private getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      page: '页面',
      section: '章节',
      api: 'API',
      example: '示例',
    };
    return labels[type] || type;
  }

  /**
   * 标准化查询
   */
  private normalizeQuery(text: string): string {
    return text.toLowerCase().trim();
  }

  /**
   * 分词
   */
  private tokenize(text: string): string[] {
    return text
      .split(/\s+/)
      .filter(term => term.length > 0)
      .map(term => term.replace(/[^\w\u4e00-\u9fff]/g, ''))
      .filter(term => term.length > 0);
  }

  /**
   * 保存查询历史
   */
  private saveQuery(query: string) {
    if (query.trim().length === 0) return;

    this.recentQueries = [
      query,
      ...this.recentQueries.filter(q => q !== query)
    ].slice(0, 10);

    // 保存到本地存储
    if (typeof window !== 'undefined') {
      localStorage.setItem('doc-search-recent', JSON.stringify(this.recentQueries));
    }
  }

  /**
   * 加载查询历史
   */
  private loadRecentQueries() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('doc-search-recent');
        if (saved) {
          this.recentQueries = JSON.parse(saved);
        }
      } catch (error) {
        console.warn('Failed to load recent queries:', error);
      }
    }
  }
}
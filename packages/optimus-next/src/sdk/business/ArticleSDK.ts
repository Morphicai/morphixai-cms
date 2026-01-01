/**
 * ArticleSDK - 文章 SDK（公开接口）
 * 用于获取和管理文章内容
 * 注意：所有接口均为公开接口，自动只返回已发布的文章，无需手动指定 status
 */

import { BaseHttpService } from '../http/BaseHttpService';

export interface Article {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  content?: string; // 列表接口中可能没有 content
  coverImages?: string[]; // 注意：后端返回的是数组
  coverImage?: string; // 兼容性字段（通常取 coverImages[0]）
  author?: {
    id: string;
    name: string;
    avatar?: string;
  };
  category?: {
    id: string;
    name: string;
    code: string; // 后端返回包含 code 字段
    description?: string;
    config?: any;
    isBuiltIn?: boolean;
    sortWeight?: number;
    parentId?: number | null;
    createDate?: string;
    updateDate?: string;
  };
  tags?: string[];
  status: 'draft' | 'published' | 'archived';
  viewCount?: number;
  publishedAt?: string;
  createDate: string; // 注意：后端返回的是 createDate，不是 createdAt
  updateDate: string; // 注意：后端返回的是 updateDate，不是 updatedAt
  sortWeight?: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

export interface ArticleListQuery {
  page?: number;
  pageSize?: number;
  categoryId?: number; // 已废弃，推荐使用 categoryCode
  categoryCode?: string; // 分类标识符，支持查询子分类
  tag?: string;
  status?: Article['status']; // 注意：公开接口会自动过滤为 published，此参数通常无需设置
  keyword?: string;
  sortBy?: 'publishedAt' | 'updateDate' | 'sortWeight'; // 注意：后端支持这三个字段
  sortOrder?: 'ASC' | 'DESC'; // 注意：必须使用大写
}

export interface ArticleListResponse {
  items: Article[]; // 注意：后端返回的数组在 items 字段中
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 文章 SDK
 */
export class ArticleSDK {
  private httpService: BaseHttpService;

  constructor(httpService?: BaseHttpService) {
    this.httpService = httpService || new BaseHttpService();
  }

  /**
   * 获取文章列表（公开接口）
   * 注意：自动只返回已发布的文章，无需手动指定 status='published'
   * @param query 查询条件
   */
  async list(query: ArticleListQuery = {}): Promise<ArticleListResponse> {
    try {
      const response = await this.httpService.get<{ data: ArticleListResponse }>(
        '/public/articles',
        { params: query }
      );

      return response.data || {
        items: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      };
    } catch (error) {
      console.error('Failed to get article list:', error);
      return {
        items: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      };
    }
  }

  /**
   * 获取单篇文章（通过 ID）
   * @param id 文章 ID
   */
  async getById(id: string): Promise<Article | null> {
    try {
      const response = await this.httpService.get<{ data: Article }>(
        `/public/articles/${id}`
      );

      return response.data || null;
    } catch (error) {
      console.error(`Failed to get article by id: ${id}`, error);
      return null;
    }
  }

  /**
   * 获取单篇文章（通过 slug）
   * @param slug 文章 slug
   */
  async getBySlug(slug: string): Promise<Article | null> {
    try {
      const response = await this.httpService.get<{ data: Article }>(
        `/public/articles/slug/${slug}`
      );

      return response.data || null;
    } catch (error) {
      console.error(`Failed to get article by slug: ${slug}`, error);
      return null;
    }
  }

  /**
   * 获取推荐文章
   * @param articleId 当前文章 ID（用于排除）
   * @param limit 返回数量
   */
  async getRecommended(articleId?: string, limit = 5): Promise<Article[]> {
    try {
      const response = await this.httpService.get<{ data: Article[] }>(
        '/public/articles/recommended',
        {
          params: {
            exclude: articleId,
            limit,
          },
        }
      );

      return response.data || [];
    } catch (error) {
      console.error('Failed to get recommended articles:', error);
      return [];
    }
  }

  /**
   * 获取热门文章
   * @param limit 返回数量
   * @param days 统计天数
   */
  async getPopular(limit = 10, days = 7): Promise<Article[]> {
    try {
      const response = await this.httpService.get<{ data: Article[] }>(
        '/public/articles/popular',
        {
          params: { limit, days },
        }
      );

      return response.data || [];
    } catch (error) {
      console.error('Failed to get popular articles:', error);
      return [];
    }
  }

  /**
   * 获取最新文章
   * @param limit 返回数量
   */
  async getLatest(limit = 10): Promise<Article[]> {
    try {
      const response = await this.httpService.get<{ data: Article[] }>(
        '/public/articles/latest',
        {
          params: { limit },
        }
      );

      return response.data || [];
    } catch (error) {
      console.error('Failed to get latest articles:', error);
      return [];
    }
  }

  /**
   * 搜索文章
   * @param keyword 搜索关键词
   * @param options 搜索选项
   */
  async search(
    keyword: string,
    options: Partial<ArticleListQuery> = {}
  ): Promise<ArticleListResponse> {
    return this.list({
      ...options,
      keyword,
    });
  }

  /**
   * 增加文章浏览量
   * @param id 文章 ID
   */
  async incrementView(id: string): Promise<boolean> {
    try {
      await this.httpService.post(`/public/articles/${id}/view`);
      return true;
    } catch (error) {
      console.error(`Failed to increment view for article: ${id}`, error);
      return false;
    }
  }
}

// 导出默认实例
export const articleSDK = new ArticleSDK();


'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { articleSDK, Article } from '../../../sdk/business/ArticleSDK';
import { ArticleContent } from '../../../components/article';

export default function BlogDetailPage() {
  const params = useParams();
  const slugOrId = params.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (slugOrId) {
      fetchArticle();
    }
  }, [slugOrId]);

  async function fetchArticle() {
    setIsLoading(true);
    try {
      let articleData: Article | null = null;
      
      // 判断是否为纯数字 ID
      const isNumericId = /^\d+$/.test(slugOrId);
      
      if (isNumericId) {
        // 如果是纯数字，直接通过 ID 获取
        articleData = await articleSDK.getById(slugOrId);
      } else {
        // 否则优先尝试通过 slug 获取文章
        articleData = await articleSDK.getBySlug(slugOrId);
        
        // 如果通过 slug 未找到，再尝试通过 id 获取（兜底）
        if (!articleData) {
          articleData = await articleSDK.getById(slugOrId);
        }
      }
      
      if (articleData) {
        setArticle(articleData);
      }
    } catch (error) {
      console.error('Failed to fetch article:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">Article Not Found</h1>
          <p className="text-neutral-600 mb-8">Sorry, the article you are looking for does not exist or has been removed</p>
          <a
            href="/blog"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Back to Blog
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 文章内容 */}
      <article className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <ArticleContent article={article} showMeta showTags />
        </div>
      </article>

      {/* 返回按钮 */}
      <div className="py-8 border-t border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <a
            href="/blog"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Blog
          </a>
        </div>
      </div>
    </div>
  );
}

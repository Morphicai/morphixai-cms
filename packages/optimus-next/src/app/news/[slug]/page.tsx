'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMount } from '../../../hooks/useMount';
import { articleService } from '../../../services/ApiService';

interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  summary?: string;
  publishedAt: string;
  categoryCode?: string;
  author?: string;
}

export default function NewsDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useMount(() => {
    loadArticle();
  });

  const loadArticle = async () => {
    setLoading(true);
    setError(null);

    try {
      let response;
      
      // 尝试通过 slug 获取文章
      if (isNaN(Number(slug))) {
        response = await articleService.getArticleBySlug(slug);
      } else {
        // 如果是数字，通过 ID 获取
        response = await articleService.getArticleById(slug);
      }

      if (response.code === 200) {
        setArticle(response.data);
      } else {
        setError('文章不存在或已被删除');
      }
    } catch (err) {
      setError('加载文章失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryName = (categoryCode?: string) => {
    const categories: Record<string, string> = {
      'tech': '技术',
      'product': '产品',
      'company': '公司',
      'industry': '行业',
    };
    return categories[categoryCode || ''] || '资讯';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="bg-white dark:bg-gray-900 min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              文章未找到
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {error || '抱歉，您访问的文章不存在或已被删除'}
            </p>
            <div className="space-x-4">
              <Link
                href="/news"
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                返回新闻列表
              </Link>
              <button
                onClick={loadArticle}
                className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors"
              >
                重试
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-8">
            <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">
              首页
            </Link>
            <span>/</span>
            <Link href="/news" className="hover:text-blue-600 dark:hover:text-blue-400">
              新闻资讯
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-white">
              {article.title}
            </span>
          </nav>

          {/* Article Header */}
          <header className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                {getCategoryName(article.categoryCode)}
              </span>
              <time className="text-gray-500 dark:text-gray-400">
                {formatDate(article.publishedAt)}
              </time>
              {article.author && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {article.author}
                  </span>
                </>
              )}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {article.title}
            </h1>
            
            {article.summary && (
              <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                {article.summary}
              </p>
            )}
          </header>

          {/* Article Content */}
          <article className="prose prose-lg dark:prose-invert max-w-none">
            <div 
              className="text-gray-900 dark:text-gray-100 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: article.content || '文章内容加载中...' }}
            />
          </article>

          {/* Article Footer */}
          <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <span className="text-gray-500 dark:text-gray-400">分享到:</span>
                <div className="flex space-x-3">
                  <button className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                    </svg>
                  </button>
                  <button className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </button>
                  <button className="text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                  </button>
                </div>
              </div>
              
              <Link
                href="/news"
                className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                返回新闻列表
              </Link>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
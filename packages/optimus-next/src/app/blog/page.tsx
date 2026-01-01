'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { articleSDK, Article, ArticleListResponse } from '../../sdk/business/ArticleSDK';
import { ArticleList } from '../../components/article';
import { Button } from '../../components/Button';

export default function BlogPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchArticles();
  }, [pagination.page]);

  async function fetchArticles() {
    setIsLoading(true);
    try {
      const response: ArticleListResponse = await articleSDK.list({
        page: pagination.page,
        pageSize: pagination.pageSize,
        sortBy: 'publishedAt',
        sortOrder: 'DESC',
      });

      setArticles(response.items);
      setPagination({
        page: response.page,
        pageSize: response.pageSize,
        total: response.total,
        totalPages: response.totalPages,
      });
    } catch (error) {
      console.error('Failed to fetch articles:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#f5f7ff] via-[#faf6ff] to-[#fff8f5] py-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-100/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="mb-6 text-5xl lg:text-6xl font-bold text-black leading-tight">
              Blog & News
            </h1>
            <p className="text-xl text-gray-700 leading-relaxed">
              Latest technical insights, product updates, and industry trends
            </p>
          </div>
        </div>
      </section>

      {/* Article List */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              <ArticleList
                articles={articles}
                layout="grid"
                columns={3}
                showImage
                showAuthor
                showCategory
                showDate
                emptyMessage="No articles yet, stay tuned"
              />

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-16 flex items-center justify-center gap-2">
                  {/* Previous */}
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        page === pagination.page
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  {/* Next */}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#3576f6]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Want to Learn More?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Check out our documentation or start using Optimus CMS today
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/docs">
              <Button size="lg" className="min-w-[180px] bg-white text-[#3576f6] hover:bg-gray-50 rounded-full shadow-xl">
                View Documentation
              </Button>
            </Link>
            <Link href="/docs/getting-started">
              <Button variant="outline" size="lg" className="min-w-[180px] bg-transparent border-2 border-white text-white hover:bg-white/10 rounded-full">
                Quick Start
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

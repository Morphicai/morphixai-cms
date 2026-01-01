/**
 * ArticleList - 文章列表组件
 * 支持网格和列表两种布局
 */

'use client';

import { Article } from '../../sdk/business/ArticleSDK';
import { ArticleCard } from './ArticleCard';

export interface ArticleListProps {
  articles: Article[];
  layout?: 'grid' | 'list';
  columns?: 1 | 2 | 3 | 4;
  showImage?: boolean;
  showAuthor?: boolean;
  showCategory?: boolean;
  showDate?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function ArticleList({
  articles,
  layout = 'grid',
  columns = 3,
  showImage = true,
  showAuthor = true,
  showCategory = true,
  showDate = true,
  emptyMessage = '暂无文章',
  className = '',
}: ArticleListProps) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500">
        <p className="text-lg">{emptyMessage}</p>
      </div>
    );
  }

  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  if (layout === 'list') {
    return (
      <div className={`flex flex-col gap-6 ${className}`}>
        {articles.map(article => (
          <ArticleCard
            key={article.id}
            article={article}
            variant="compact"
            showImage={showImage}
            showAuthor={showAuthor}
            showCategory={showCategory}
            showDate={showDate}
            className="p-4 bg-white rounded-lg border border-neutral-200 hover:border-primary-300 hover:shadow-md transition-all"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid ${gridClasses[columns]} gap-6 ${className}`}>
      {articles.map(article => (
        <ArticleCard
          key={article.id}
          article={article}
          showImage={showImage}
          showAuthor={showAuthor}
          showCategory={showCategory}
          showDate={showDate}
          className="p-4 bg-white rounded-lg border border-neutral-200 hover:border-primary-300 hover:shadow-md transition-all"
        />
      ))}
    </div>
  );
}


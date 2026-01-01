/**
 * ArticleCard - 文章卡片组件
 * 用于在列表中展示文章摘要
 */

'use client';

import Link from 'next/link';
import { Article } from '../../sdk/business/ArticleSDK';
import { OssImage } from '../oss';

export interface ArticleCardProps {
  article: Article;
  variant?: 'default' | 'compact' | 'featured';
  showImage?: boolean;
  showAuthor?: boolean;
  showCategory?: boolean;
  showDate?: boolean;
  className?: string;
  imageAspectRatio?: 'video' | 'square' | 'wide';
}

export function ArticleCard({
  article,
  variant = 'default',
  showImage = true,
  showAuthor = true,
  showCategory = true,
  showDate = true,
  className = '',
  imageAspectRatio = 'video',
}: ArticleCardProps) {
  const aspectRatioClasses = {
    video: 'aspect-video',
    square: 'aspect-square',
    wide: 'aspect-[21/9]',
  };

  const variantClasses = {
    default: 'flex flex-col',
    compact: 'flex flex-row gap-4',
    featured: 'flex flex-col lg:flex-row gap-6',
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 获取封面图片（优先使用 coverImages 数组的第一张，兼容 coverImage 单个字段）
  const coverImageUrl = article.coverImages?.[0] || article.coverImage;

  // 优先使用 slug，如果不存在则使用 id
  const articleUrl = `/blog/${article.slug || article.id}`;

  return (
    <article className={`group ${variantClasses[variant]} ${className}`}>
      {/* 封面图 */}
      {showImage && coverImageUrl && (
        <Link
          href={articleUrl}
          className={`relative overflow-hidden rounded-lg bg-neutral-100 ${
            variant === 'compact' ? 'w-32 h-32 flex-shrink-0' : ''
          } ${variant === 'featured' ? 'lg:w-1/2' : ''}`}
        >
          <div className={variant !== 'compact' ? aspectRatioClasses[imageAspectRatio] : 'w-full h-full'}>
            <OssImage
              src={coverImageUrl}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              showLoading={true}
              fallbackSrc="/placeholder-article.jpg"
            />
          </div>
        </Link>
      )}

      {/* 内容区 */}
      <div className={`flex flex-col ${variant === 'featured' ? 'lg:w-1/2' : ''} ${variant === 'compact' ? 'flex-1 min-w-0' : 'mt-4'}`}>
        {/* 分类标签 */}
        {showCategory && article.category && (
          <Link
            href={`/blog?category=${article.category.code}`}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 mb-2 inline-block w-fit"
          >
            {article.category.name}
          </Link>
        )}

        {/* 标题 */}
        <Link href={articleUrl}>
          <h3
            className={`font-bold text-neutral-900 group-hover:text-primary-600 transition-colors line-clamp-2 ${
              variant === 'featured' ? 'text-2xl lg:text-3xl mb-3' : 'text-lg mb-2'
            } ${variant === 'compact' ? 'text-base mb-1' : ''}`}
          >
            {article.title}
          </h3>
        </Link>

        {/* 摘要 */}
        {article.summary && variant !== 'compact' && (
          <p
            className={`text-neutral-600 line-clamp-3 ${
              variant === 'featured' ? 'text-lg mb-4' : 'text-sm mb-3'
            }`}
          >
            {article.summary}
          </p>
        )}

        {/* 元信息 */}
        <div className="flex items-center gap-4 text-sm text-neutral-500 mt-auto">
          {showAuthor && article.author && (
            <div className="flex items-center gap-2">
              {article.author.avatar && (
                <OssImage
                  src={article.author.avatar}
                  alt={article.author.name}
                  className="w-6 h-6 rounded-full"
                  fallbackSrc="/default-avatar.png"
                />
              )}
              <span>{article.author.name}</span>
            </div>
          )}

          {showDate && article.publishedAt && (
            <time dateTime={article.publishedAt}>
              {formatDate(article.publishedAt)}
            </time>
          )}

          {article.viewCount !== undefined && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {article.viewCount}
            </span>
          )}
        </div>

        {/* 标签 */}
        {article.tags && article.tags.length > 0 && variant === 'featured' && (
          <div className="flex flex-wrap gap-2 mt-4">
            {article.tags.slice(0, 5).map(tag => (
              <Link
                key={tag}
                href={`/blog?tag=${tag}`}
                className="text-xs px-3 py-1 bg-neutral-100 hover:bg-neutral-200 rounded-full text-neutral-700 transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}


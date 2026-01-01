/**
 * ArticleContent - 文章内容组件
 * 用于渲染文章详情页的内容
 */

'use client';

import Link from 'next/link';
import { Article } from '../../sdk/business/ArticleSDK';
import { OssImage, RichTextContent } from '../oss';

export interface ArticleContentProps {
  article: Article;
  showMeta?: boolean;
  showTags?: boolean;
  className?: string;
}

export function ArticleContent({
  article,
  showMeta = true,
  showTags = true,
  className = '',
}: ArticleContentProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 获取封面图片（优先使用 coverImages 数组的第一张，兼容 coverImage 单个字段）
  const coverImageUrl = article.coverImages?.[0] || article.coverImage;

  return (
    <article className={`max-w-4xl mx-auto ${className}`}>
      {/* 标题区 */}
      <header className="mb-8">
        {/* 分类 */}
        {article.category && (
          <Link
            href={`/blog?category=${article.category.code}`}
            className="inline-block text-sm font-medium text-primary-600 hover:text-primary-700 mb-4"
          >
            {article.category.name}
          </Link>
        )}

        {/* 标题 */}
        <h1 className="text-4xl lg:text-5xl font-bold text-neutral-900 mb-4 leading-tight">
          {article.title}
        </h1>

        {/* 摘要 */}
        {article.summary && (
          <p className="text-xl text-neutral-600 mb-6 leading-relaxed">
            {article.summary}
          </p>
        )}

        {/* 元信息 */}
        {showMeta && (
          <div className="flex flex-wrap items-center gap-6 text-neutral-600 pt-6 border-t border-neutral-200">
            {/* 作者 */}
            {article.author && (
              <div className="flex items-center gap-3">
                {article.author.avatar && (
                  <OssImage
                    src={article.author.avatar}
                    alt={article.author.name}
                    className="w-10 h-10 rounded-full"
                    fallbackSrc="/default-avatar.png"
                  />
                )}
                <div>
                  <div className="text-sm text-neutral-500">Author</div>
                  <div className="font-medium text-neutral-900">{article.author.name}</div>
                </div>
              </div>
            )}

            {/* 发布时间 */}
            {article.publishedAt && (
              <div>
                <div className="text-sm text-neutral-500">Published</div>
                <time dateTime={article.publishedAt} className="font-medium text-neutral-900">
                  {formatDate(article.publishedAt)}
                </time>
              </div>
            )}

            {/* 浏览量 */}
            {article.viewCount !== undefined && (
              <div>
                <div className="text-sm text-neutral-500">Views</div>
                <div className="font-medium text-neutral-900">{article.viewCount}</div>
              </div>
            )}
          </div>
        )}
      </header>

      {/* 封面图 */}
      {coverImageUrl && (
        <div className="relative w-full aspect-video mb-8 rounded-lg overflow-hidden">
          <OssImage
            src={coverImageUrl}
            alt={article.title}
            className="w-full h-full object-cover"
            showLoading={true}
            fallbackSrc="/placeholder-article.jpg"
          />
        </div>
      )}

      {/* 文章内容 */}
      <RichTextContent
        content={article.content || ''}
        className="prose prose-lg prose-neutral max-w-none
          prose-headings:font-bold prose-headings:text-neutral-900
          prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl
          prose-p:text-neutral-700 prose-p:leading-relaxed
          prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline
          prose-strong:text-neutral-900 prose-strong:font-semibold
          prose-code:text-primary-600 prose-code:bg-primary-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
          prose-pre:bg-neutral-900 prose-pre:text-neutral-100
          prose-img:rounded-lg prose-img:shadow-md
          prose-blockquote:border-l-4 prose-blockquote:border-primary-500 prose-blockquote:pl-4 prose-blockquote:italic
          prose-ul:list-disc prose-ol:list-decimal
          prose-li:text-neutral-700"
        transformAllUrls={true}
      />

      {/* 标签 */}
      {showTags && article.tags && article.tags.length > 0 && (
        <div className="mt-12 pt-8 border-t border-neutral-200">
          <h3 className="text-sm font-medium text-neutral-500 mb-4">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {article.tags.map(tag => (
              <Link
                key={tag}
                href={`/blog?tag=${tag}`}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-full text-neutral-700 text-sm transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}


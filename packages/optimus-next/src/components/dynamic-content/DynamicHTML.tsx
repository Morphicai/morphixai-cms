/**
 * DynamicHTML - 动态 HTML 组件
 * 从后台配置自动获取并渲染 HTML 内容
 */

'use client';

import { useEffect, useState } from 'react';
import { dynamicContentSDK } from '../../sdk/business/DynamicContentSDK';

export interface DynamicHTMLProps {
  contentKey: string;
  defaultValue?: string;
  className?: string;
  loading?: React.ReactNode;
  sanitize?: boolean;
  onLoad?: (value: string) => void;
}

export function DynamicHTML({
  contentKey,
  defaultValue = '',
  className = '',
  loading,
  sanitize = true,
  onLoad,
}: DynamicHTMLProps) {
  const [html, setHtml] = useState<string>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchHTML() {
      try {
        setIsLoading(true);
        const value = await dynamicContentSDK.getHTML(contentKey, defaultValue);
        
        if (isMounted) {
          // 简单的 HTML 清理（生产环境应使用 DOMPurify）
          const cleanedHTML = sanitize ? sanitizeHTML(value) : value;
          setHtml(cleanedHTML);
          onLoad?.(value);
        }
      } catch (error) {
        console.error(`Failed to load dynamic HTML: ${contentKey}`, error);
        if (isMounted) {
          setHtml(defaultValue);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchHTML();

    return () => {
      isMounted = false;
    };
  }, [contentKey, defaultValue, sanitize, onLoad]);

  if (isLoading && loading) {
    return <>{loading}</>;
  }

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * 简单的 HTML 清理函数
 * 注意：生产环境应使用 DOMPurify 等专业库
 */
function sanitizeHTML(html: string): string {
  // 移除潜在危险的标签和属性
  const dangerous = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /on\w+\s*=\s*["'][^"']*["']/gi,
    /javascript:/gi,
  ];

  let cleaned = html;
  dangerous.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });

  return cleaned;
}


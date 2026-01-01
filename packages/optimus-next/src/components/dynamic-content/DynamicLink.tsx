/**
 * DynamicLink - 动态链接组件
 * 从后台配置自动获取并渲染链接
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { dynamicContentSDK } from '../../sdk/business/DynamicContentSDK';

export interface DynamicLinkProps {
  contentKey: string;
  defaultHref?: string;
  className?: string;
  children: React.ReactNode;
  target?: '_self' | '_blank' | '_parent' | '_top';
  rel?: string;
  prefetch?: boolean;
  onLoad?: (href: string) => void;
}

export function DynamicLink({
  contentKey,
  defaultHref = '#',
  className = '',
  children,
  target,
  rel,
  prefetch = true,
  onLoad,
}: DynamicLinkProps) {
  const [href, setHref] = useState<string>(defaultHref);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchURL() {
      try {
        setIsLoading(true);
        const url = await dynamicContentSDK.getURL(contentKey, defaultHref);
        
        if (isMounted) {
          setHref(url);
          onLoad?.(url);
        }
      } catch (error) {
        console.error(`Failed to load dynamic link: ${contentKey}`, error);
        if (isMounted) {
          setHref(defaultHref);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchURL();

    return () => {
      isMounted = false;
    };
  }, [contentKey, defaultHref, onLoad]);

  // 判断是否是外部链接
  const isExternal = href.startsWith('http://') || href.startsWith('https://');

  if (isExternal) {
    return (
      <a
        href={href}
        className={className}
        target={target || '_blank'}
        rel={rel || 'noopener noreferrer'}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={className}
      target={target}
      rel={rel}
      prefetch={prefetch}
    >
      {children}
    </Link>
  );
}


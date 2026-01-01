/**
 * DynamicText - 动态文本组件
 * 从后台配置自动获取并渲染文本内容
 */

'use client';

import { useEffect, useState } from 'react';
import { dynamicContentSDK } from '../../sdk/business/DynamicContentSDK';

export interface DynamicTextProps {
  contentKey: string;
  defaultValue?: string;
  className?: string;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';
  loading?: React.ReactNode;
  onLoad?: (value: string) => void;
}

export function DynamicText({
  contentKey,
  defaultValue = '',
  className = '',
  as: Component = 'span',
  loading,
  onLoad,
}: DynamicTextProps) {
  const [text, setText] = useState<string>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchText() {
      try {
        setIsLoading(true);
        const value = await dynamicContentSDK.getText(contentKey, defaultValue);
        
        if (isMounted) {
          setText(value);
          onLoad?.(value);
        }
      } catch (error) {
        console.error(`Failed to load dynamic text: ${contentKey}`, error);
        if (isMounted) {
          setText(defaultValue);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchText();

    return () => {
      isMounted = false;
    };
  }, [contentKey, defaultValue, onLoad]);

  if (isLoading && loading) {
    return <>{loading}</>;
  }

  return <Component className={className}>{text}</Component>;
}


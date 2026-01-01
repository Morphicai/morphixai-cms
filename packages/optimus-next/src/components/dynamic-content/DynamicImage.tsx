/**
 * DynamicImage - 动态图片组件
 * 从后台配置自动获取并渲染图片
 */

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { dynamicContentSDK } from '../../sdk/business/DynamicContentSDK';

export interface DynamicImageProps {
  contentKey: string;
  alt?: string;
  defaultSrc?: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  quality?: number;
  placeholder?: React.ReactNode;
  onLoad?: (src: string) => void;
  onError?: (error: Error) => void;
}

export function DynamicImage({
  contentKey,
  alt = '',
  defaultSrc = '/placeholder.png',
  className = '',
  width,
  height,
  fill = false,
  loading = 'lazy',
  priority = false,
  quality = 75,
  placeholder,
  onLoad,
  onError,
}: DynamicImageProps) {
  const [src, setSrc] = useState<string>(defaultSrc);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchImage() {
      try {
        setIsLoading(true);
        setHasError(false);
        
        const imageSrc = await dynamicContentSDK.getImage(contentKey, defaultSrc);
        
        if (isMounted) {
          setSrc(imageSrc);
          onLoad?.(imageSrc);
        }
      } catch (error) {
        console.error(`Failed to load dynamic image: ${contentKey}`, error);
        if (isMounted) {
          setHasError(true);
          setSrc(defaultSrc);
          onError?.(error as Error);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchImage();

    return () => {
      isMounted = false;
    };
  }, [contentKey, defaultSrc, onLoad, onError]);

  if (isLoading && placeholder) {
    return <>{placeholder}</>;
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        loading={loading}
        priority={priority}
        quality={quality}
        onError={() => setHasError(true)}
      />
    );
  }

  if (!width || !height) {
    console.warn(`DynamicImage: width and height are required when fill is false`);
    return null;
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={loading}
      priority={priority}
      quality={quality}
      onError={() => setHasError(true)}
    />
  );
}


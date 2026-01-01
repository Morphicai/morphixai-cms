import { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteUrl;

  // 静态页面
  const staticPages = [
    '',
    '/products',
    '/docs',
    '/docs/getting-started',
    '/docs/installation',
    '/docs/concepts',
    '/docs/api/auth',
    '/docs/api/users',
    '/docs/api/data',
    '/docs/api/errors',
    '/docs/guides/security',
    '/docs/guides/performance',
    '/docs/guides/deployment',
    '/docs/guides/best-practices',
    '/docs/examples/basic',
    '/docs/examples/advanced',
    '/docs/examples/integrations',
    '/blog',
    '/news',
    '/pricing',
    '/use-cases',
    '/components',
  ];

  return staticPages.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1.0 : path.startsWith('/docs') ? 0.8 : 0.7,
  }));
}


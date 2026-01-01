# OSS Component Usage Guide

## Overview

OSS components provide React components for handling OSS (Object Storage Service) file paths, automatically replacing `/OSS_FILE_PROXY/` prefix with CDN address configured in environment variables.

## Environment Variable Configuration

### Configuration Method

In Next.js project, configure `NEXT_PUBLIC_FILE_API_PREFIX` environment variable:

```bash
# .env.local or .env.development
NEXT_PUBLIC_FILE_API_PREFIX=https://cdn.example.com
```

## OssImage Component

### Features

- ✅ Automatic OSS proxy path conversion
- ✅ Loading state display support
- ✅ Loading failure placeholder support
- ✅ Support for all standard HTML img attributes
- ✅ Smooth loading transition effects

### Basic Usage

```tsx
import { OssImage } from '@/components/oss';

// Use OSS proxy path
<OssImage 
  src="/OSS_FILE_PROXY/images/logo.png" 
  alt="Logo"
  width={200}
  height={100}
/>

// Use regular URL
<OssImage 
  src="https://example.com/image.jpg" 
  alt="Example"
/>
```

### Props

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `src` | `string` | - | Image path (required) |
| `alt` | `string` | - | Image description (required) |
| `showLoading` | `boolean` | `false` | Whether to show loading state |
| `fallbackSrc` | `string` | `'/placeholder.jpg'` | Placeholder when loading fails |
| `className` | `string` | `''` | Custom class name |
| `...props` | `ImgHTMLAttributes` | - | Other HTML img attributes |

## RichTextContent Component

### Features

- ✅ Automatic OSS path conversion in rich text
- ✅ Support for images, videos, audio, links and other resources
- ✅ CSS background image path conversion support
- ✅ Performance optimization (uses useMemo caching)
- ✅ Safe HTML rendering

### Basic Usage

```tsx
import { RichTextContent } from '@/components/oss';

const htmlContent = `
  <div>
    <h1>Article Title</h1>
    <p>This is rich text content</p>
    <img src="/OSS_FILE_PROXY/images/article-1.jpg" alt="Article image" />
    <video src="/OSS_FILE_PROXY/videos/demo.mp4" controls></video>
  </div>
`;

<RichTextContent content={htmlContent} />
```

### Props

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `content` | `string` | - | Rich text HTML content (required) |
| `className` | `string` | `''` | Custom class name |
| `transformAllUrls` | `boolean` | `true` | Whether to transform all URLs |
| `style` | `CSSProperties` | - | Custom styles |

## Utility Functions

### transformOssUrl

Convert single OSS URL path.

```tsx
import { transformOssUrl } from '@/components/oss';

const originalUrl = '/OSS_FILE_PROXY/images/logo.png';
const transformedUrl = transformOssUrl(originalUrl);
// Result: 'https://cdn.example.com/images/logo.png'
```

### transformOssHtml

Convert all OSS paths in HTML content.

```tsx
import { transformOssHtml } from '@/components/oss';

const html = '<img src="/OSS_FILE_PROXY/image.jpg" />';
const transformedHtml = transformOssHtml(html, true);
// Result: '<img src="https://cdn.example.com/image.jpg" />'
```

## Notes

1. **Environment Variable Prefix**: In Next.js, all client-used environment variables must start with `NEXT_PUBLIC_`
2. **Path Format**: OSS proxy paths must start with `/OSS_FILE_PROXY/`
3. **Performance Optimization**: `RichTextContent` uses `useMemo` to cache conversion results, avoiding unnecessary repeated calculations
4. **Security**: When using `dangerouslySetInnerHTML`, ensure HTML content source is trusted
5. **Placeholder Images**: Recommend preparing default placeholder images in `public` directory

## Troubleshooting

### Images Not Displaying

1. Check if `NEXT_PUBLIC_FILE_API_PREFIX` environment variable is correctly configured
2. Confirm image path starts with `/OSS_FILE_PROXY/`
3. Check browser console for CORS errors

### Environment Variables Not Taking Effect

1. Restart development server (environment variables need restart after changes)
2. Confirm environment variable file name is correct (`.env.local`, `.env.development`, etc.)
3. Check if environment variable starts with `NEXT_PUBLIC_`

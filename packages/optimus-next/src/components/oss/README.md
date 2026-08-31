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

> 结尾斜杠：`transformOssUrl`（`OssImage` / `RichTextContent` 走的那条）会自己补，
> 有没有都对；但 `batchTransformUrls` 不补。如果要用批量版，配成
> `https://cdn.example.com/` 更稳妥，详见下方 [batchTransformUrls](#batchtransformurls--批量转换)。

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

## 常见场景（Common Scenarios）

### 场景 1: 用户头像

```tsx
import { OssImage } from '@/components/oss';

function UserAvatar({ user }) {
  return (
    <OssImage
      src={user.avatar}
      alt={user.name}
      className="w-12 h-12 rounded-full"
      fallbackSrc="/default-avatar.png"
    />
  );
}
```

### 场景 2: 文章列表

```tsx
import { OssImage } from '@/components/oss';

function ArticleCard({ article }) {
  return (
    <div className="card">
      <OssImage
        src={article.coverImage}
        alt={article.title}
        className="w-full h-48 object-cover"
        showLoading={true}
      />
      <h3>{article.title}</h3>
    </div>
  );
}
```

### 场景 3: 文章详情

```tsx
import { RichTextContent } from '@/components/oss';

function ArticleDetail({ article }) {
  return (
    <article>
      <h1>{article.title}</h1>
      <RichTextContent
        content={article.content}
        className="prose prose-lg max-w-none"
      />
    </article>
  );
}
```

### 样式定制

组件把 `className` 原样透传下去，直接用 Tailwind 就行：

```tsx
<OssImage
  src="/OSS_FILE_PROXY/image.jpg"
  alt="Example"
  className="rounded-lg shadow-lg hover:shadow-xl transition-shadow"
/>

<RichTextContent
  content={htmlContent}
  className="prose prose-lg prose-slate max-w-none"
/>
```

可运行的例子在 `src/app/examples/oss-components/page.tsx`（开发环境访问
`/examples/oss-components`）。

## Utility Functions

全部工具函数都从 `@/components/oss` 直接导出（见 `index.ts`），类型定义在 `types.ts`。

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

### 文件类型判断

```tsx
import { isImageFile, isVideoFile, isAudioFile, isDocumentFile, getFileType } from '@/components/oss';

isImageFile('photo.jpg');    // true
isVideoFile('video.mp4');    // true
getFileType('document.pdf'); // 'document'
```

`getFileType` 依次按 image / video / audio / document 判定，都不匹配返回 `'unknown'`。
各类支持的扩展名在 `utils.ts` 的 `IMAGE_FORMATS` / `VIDEO_FORMATS` / `AUDIO_FORMATS` /
`DOCUMENT_FORMATS` 四个常量里，也一并导出了。

### buildOssPath — 反向构造 OSS 路径

```tsx
import { buildOssPath } from '@/components/oss';

buildOssPath('/images/logo.png');            // '/OSS_FILE_PROXY/images/logo.png'
buildOssPath('/OSS_FILE_PROXY/a.png');       // 原样返回，不会套两层
```

### batchTransformUrls — 批量转换

```tsx
import { batchTransformUrls } from '@/components/oss';

const cdnUrls = batchTransformUrls([
  '/OSS_FILE_PROXY/img1.jpg',
  '/OSS_FILE_PROXY/img2.jpg',
]);
```

> ⚠️ 这个函数和 `transformOssUrl` 的斜杠处理**不一致**：`transformOssUrl` 会给
> `NEXT_PUBLIC_FILE_API_PREFIX` 补上结尾斜杠再拼，`batchTransformUrls` 直接
> `replace`，不补。所以环境变量写成 `https://cdn.example.com`（无结尾斜杠）时，
> 批量版会拼出 `https://cdn.example.comimg1.jpg`。**要用批量版就把环境变量配成带结尾
> 斜杠的形式**（`https://cdn.example.com/`），两条路径都能出正确结果。

### 其他

`hasCdnConfig()` / `getCdnPrefix(throwIfMissing?)` 判断与读取 CDN 配置，
`isOssPath` / `isHttpUrl` / `isValidUrl` 做路径判定，
`getFileExtension` / `getFilename` / `extractFilePath` / `formatFileSize` / `getMimeType`
是一组路径与文件信息的小工具。

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

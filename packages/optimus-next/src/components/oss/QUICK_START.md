# OSS 组件快速开始

## 🚀 5 分钟快速上手

### 步骤 1: 配置环境变量

在项目根目录创建 `.env.local` 文件：

```bash
# 复制示例文件
cp .env.example .env.local
```

添加以下配置：

```bash
NEXT_PUBLIC_FILE_API_PREFIX=https://cdn.example.com
```

### 步骤 2: 重启开发服务器

```bash
# 停止当前服务器 (Ctrl+C)
# 重新启动
pnpm dev
```

### 步骤 3: 使用组件

```tsx
import { OssImage, RichTextContent } from '@/components/oss';

export default function MyPage() {
  return (
    <div>
      {/* 使用 OssImage 显示图片 */}
      <OssImage 
        src="/OSS_FILE_PROXY/images/banner.jpg" 
        alt="Banner"
        className="w-full h-64 object-cover"
      />
      
      {/* 使用 RichTextContent 显示富文本 */}
      <RichTextContent 
        content="<p>文章内容 <img src='/OSS_FILE_PROXY/img.jpg' /></p>"
        className="prose prose-lg"
      />
    </div>
  );
}
```

## 📝 常见场景

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

## 🔧 工具函数

### 检查文件类型

```tsx
import { isImageFile, isVideoFile, getFileType } from '@/components/oss';

// 检查是否为图片
if (isImageFile('photo.jpg')) {
  console.log('这是一张图片');
}

// 检查是否为视频
if (isVideoFile('video.mp4')) {
  console.log('这是一个视频');
}

// 获取文件类型
const type = getFileType('document.pdf'); // 'document'
```

### 路径转换

```tsx
import { transformOssUrl, buildOssPath } from '@/components/oss';

// 转换 OSS 路径为 CDN 地址
const cdnUrl = transformOssUrl('/OSS_FILE_PROXY/image.jpg');
// 结果: 'https://cdn.example.com/image.jpg'

// 构建 OSS 路径
const ossPath = buildOssPath('/images/logo.png');
// 结果: '/OSS_FILE_PROXY/images/logo.png'
```

### 批量转换

```tsx
import { batchTransformUrls } from '@/components/oss';

const images = [
  '/OSS_FILE_PROXY/img1.jpg',
  '/OSS_FILE_PROXY/img2.jpg',
  '/OSS_FILE_PROXY/img3.jpg',
];

const cdnUrls = batchTransformUrls(images);
// 所有路径都被转换为 CDN 地址
```

## 🎨 样式定制

### 使用 Tailwind CSS

```tsx
<OssImage
  src="/OSS_FILE_PROXY/image.jpg"
  alt="Example"
  className="rounded-lg shadow-lg hover:shadow-xl transition-shadow"
/>
```

### 使用 Tailwind Typography

```tsx
<RichTextContent
  content={htmlContent}
  className="prose prose-lg prose-slate max-w-none"
/>
```

## ⚠️ 注意事项

1. **环境变量前缀**: 必须使用 `NEXT_PUBLIC_` 前缀
2. **路径格式**: OSS 路径必须以 `/OSS_FILE_PROXY/` 开头
3. **服务器重启**: 修改环境变量后需要重启开发服务器
4. **文件访问**: 确保 CDN 地址可访问

## 🐛 故障排除

### 问题 1: 图片不显示

**解决方案:**
1. 检查环境变量是否配置
2. 重启开发服务器
3. 检查浏览器控制台错误

```bash
# 检查环境变量
echo $NEXT_PUBLIC_FILE_API_PREFIX

# 重启服务器
pnpm dev
```

### 问题 2: 路径转换不生效

**解决方案:**
确保路径以 `/OSS_FILE_PROXY/` 开头：

```tsx
// ✅ 正确
<OssImage src="/OSS_FILE_PROXY/image.jpg" alt="Good" />

// ❌ 错误
<OssImage src="OSS_FILE_PROXY/image.jpg" alt="Bad" />
<OssImage src="/oss_file_proxy/image.jpg" alt="Bad" />
```

## 📚 更多资源

- [完整文档](./README.md)
- [示例页面](http://localhost:3000/examples/oss-components)
- [API 参考](./types.ts)

## 🎯 下一步

1. ✅ 配置环境变量
2. ✅ 使用 OssImage 组件
3. ✅ 使用 RichTextContent 组件
4. 📖 阅读完整文档
5. 🧪 访问示例页面

---

**需要帮助?** 查看 [完整文档](./README.md) 或 [常见问题](./README.md#故障排除)




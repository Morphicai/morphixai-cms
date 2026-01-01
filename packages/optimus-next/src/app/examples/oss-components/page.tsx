'use client';

import React from 'react';
import { OssImage, RichTextContent } from '@/components/oss';

/**
 * OSS 组件示例页面
 */
export default function OssComponentsDemo() {
  // 示例数据
  const sampleImages = [
    '/OSS_FILE_PROXY/examples/image1.jpg',
    '/OSS_FILE_PROXY/examples/image2.jpg',
    '/OSS_FILE_PROXY/examples/image3.jpg',
  ];

  const sampleRichText = `
    <div>
      <h2 style="color: #333; margin-bottom: 16px;">富文本示例</h2>
      <p style="line-height: 1.8; margin-bottom: 12px;">
        这是一段包含 OSS 图片的富文本内容。下面是一张通过 OSS 代理路径加载的图片：
      </p>
      <img 
        src="/OSS_FILE_PROXY/examples/rich-text-image.jpg" 
        alt="富文本图片" 
        style="width: 100%; max-width: 600px; border-radius: 8px; margin: 20px 0;"
      />
      <p style="line-height: 1.8; margin-bottom: 12px;">
        图片会自动将 <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 4px;">/OSS_FILE_PROXY/</code> 
        前缀替换为环境变量配置的 CDN 地址。
      </p>
      <h3 style="color: #555; margin: 20px 0 12px;">支持的资源类型</h3>
      <ul style="line-height: 1.8; padding-left: 24px;">
        <li>图片 (img)</li>
        <li>视频 (video)</li>
        <li>音频 (audio)</li>
        <li>链接 (a)</li>
        <li>CSS 背景 (background-image)</li>
      </ul>
      <video 
        src="/OSS_FILE_PROXY/examples/demo-video.mp4" 
        controls 
        style="width: 100%; max-width: 600px; border-radius: 8px; margin: 20px 0;"
      >
        您的浏览器不支持视频播放
      </video>
      <p style="line-height: 1.8; margin-top: 12px;">
        访问 <a href="/OSS_FILE_PROXY/docs/guide.pdf" style="color: #0066cc;">用户指南</a> 了解更多信息。
      </p>
    </div>
  `;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            OSS 组件示例
          </h1>
          <p className="text-lg text-gray-600">
            展示 OssImage 和 RichTextContent 组件的使用方法
          </p>
        </div>

        {/* 环境变量配置说明 */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 rounded-r-lg">
          <h2 className="text-xl font-semibold text-blue-900 mb-2">
            🔧 环境变量配置
          </h2>
          <p className="text-blue-800 mb-2">
            当前配置的 CDN 地址：
            <code className="bg-blue-100 px-2 py-1 rounded ml-2">
              {process.env.NEXT_PUBLIC_FILE_API_PREFIX || '未配置'}
            </code>
          </p>
          <p className="text-blue-700 text-sm">
            所有以 <code className="bg-blue-100 px-2 py-1 rounded">/OSS_FILE_PROXY/</code> 
            开头的路径将自动替换为上述 CDN 地址
          </p>
        </div>

        <div className="space-y-12">
          {/* OssImage 组件示例 */}
          <section className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              1. OssImage 组件
            </h2>

            {/* 基本使用 */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                基本使用
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {sampleImages.map((src, index) => (
                  <div key={index} className="space-y-2">
                    <OssImage
                      src={src}
                      alt={`示例图片 ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <p className="text-sm text-gray-500 truncate">
                      {src}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 带加载状态 */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                带加载状态和占位图
              </h3>
              <OssImage
                src="/OSS_FILE_PROXY/examples/large-image.jpg"
                alt="大图示例"
                className="w-full max-w-2xl h-64 object-cover rounded-lg"
                showLoading={true}
                fallbackSrc="/placeholder.jpg"
              />
            </div>

            {/* 代码示例 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                代码示例：
              </h4>
              <pre className="text-sm text-gray-600 overflow-x-auto">
{`<OssImage
  src="/OSS_FILE_PROXY/examples/image.jpg"
  alt="示例图片"
  className="w-full h-48 object-cover rounded-lg"
  showLoading={true}
  fallbackSrc="/placeholder.jpg"
/>`}
              </pre>
            </div>
          </section>

          {/* RichTextContent 组件示例 */}
          <section className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              2. RichTextContent 组件
            </h2>

            {/* 富文本渲染 */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                富文本内容渲染
              </h3>
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <RichTextContent
                  content={sampleRichText}
                  className="rich-text-demo"
                />
              </div>
            </div>

            {/* 代码示例 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                代码示例：
              </h4>
              <pre className="text-sm text-gray-600 overflow-x-auto">
{`const htmlContent = \`
  <img src="/OSS_FILE_PROXY/image.jpg" alt="图片" />
  <video src="/OSS_FILE_PROXY/video.mp4" controls></video>
  <a href="/OSS_FILE_PROXY/doc.pdf">文档链接</a>
\`;

<RichTextContent
  content={htmlContent}
  className="prose prose-lg"
  transformAllUrls={true}
/>`}
              </pre>
            </div>
          </section>

          {/* 实际应用场景 */}
          <section className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              3. 实际应用场景
            </h2>

            {/* 用户头像示例 */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                用户头像
              </h3>
              <div className="flex items-center space-x-4">
                <OssImage
                  src="/OSS_FILE_PROXY/users/avatar1.jpg"
                  alt="用户头像"
                  className="w-16 h-16 rounded-full object-cover"
                  fallbackSrc="/default-avatar.png"
                />
                <div>
                  <p className="font-semibold text-gray-900">张三</p>
                  <p className="text-sm text-gray-500">产品经理</p>
                </div>
              </div>
            </div>

            {/* 文章卡片示例 */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                文章卡片
              </h3>
              <div className="max-w-sm bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <OssImage
                  src="/OSS_FILE_PROXY/articles/cover1.jpg"
                  alt="文章封面"
                  className="w-full h-48 object-cover"
                  showLoading={true}
                />
                <div className="p-6">
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    如何使用 OSS 组件
                  </h4>
                  <p className="text-gray-600 text-sm mb-4">
                    了解如何在 Next.js 项目中使用 OssImage 和 RichTextContent 组件...
                  </p>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    阅读更多 →
                  </button>
                </div>
              </div>
            </div>

            {/* 产品画廊示例 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                产品画廊
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <OssImage
                    key={i}
                    src={`/OSS_FILE_PROXY/products/product${i}.jpg`}
                    alt={`产品 ${i}`}
                    className="w-full h-32 object-cover rounded-lg hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ))}
              </div>
            </div>
          </section>

          {/* 使用说明 */}
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              📚 使用说明
            </h2>
            <div className="space-y-4 text-gray-700">
              <div className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold mr-4">
                  1
                </span>
                <div>
                  <h4 className="font-semibold mb-1">配置环境变量</h4>
                  <p className="text-sm">
                    在 <code className="bg-white px-2 py-1 rounded">.env.local</code> 或 
                    <code className="bg-white px-2 py-1 rounded ml-1">.env.development</code> 中配置
                    <code className="bg-white px-2 py-1 rounded ml-1">NEXT_PUBLIC_FILE_API_PREFIX</code>
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold mr-4">
                  2
                </span>
                <div>
                  <h4 className="font-semibold mb-1">导入组件</h4>
                  <p className="text-sm">
                    <code className="bg-white px-2 py-1 rounded">
                      import {'{ OssImage, RichTextContent }'} from '@/components/oss'
                    </code>
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold mr-4">
                  3
                </span>
                <div>
                  <h4 className="font-semibold mb-1">使用组件</h4>
                  <p className="text-sm">
                    使用 <code className="bg-white px-2 py-1 rounded">/OSS_FILE_PROXY/</code> 前缀标识 OSS 文件路径，
                    组件会自动替换为配置的 CDN 地址
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .rich-text-demo {
          line-height: 1.8;
        }
        .rich-text-demo h2,
        .rich-text-demo h3 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        .rich-text-demo p {
          margin-bottom: 1em;
        }
        .rich-text-demo img,
        .rich-text-demo video {
          display: block;
          margin: 1.5em auto;
        }
        .rich-text-demo ul {
          margin-bottom: 1em;
        }
        .rich-text-demo li {
          margin-bottom: 0.5em;
        }
        .rich-text-demo code {
          font-family: 'Courier New', monospace;
        }
      `}} />
    </div>
  );
}



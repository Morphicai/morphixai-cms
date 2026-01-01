import Link from 'next/link';

export default function BasicExamplesPage() {
  return (
    <>
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400 mb-8">
        <Link href="/" className="hover:text-slate-900 dark:hover:text-slate-200">首页</Link>
        <span>/</span>
        <Link href="/docs" className="hover:text-slate-900 dark:hover:text-slate-200">文档</Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-slate-200 font-medium">基础用法</span>
      </nav>

      {/* Header */}
      <header className="mb-12">
        <h1 className="text-4xl font-bold text-black dark:text-white mb-4">
          基础用法示例
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
          通过实际代码示例快速上手 Optimus CMS，学习常用功能的实现方法。
        </p>
      </header>

      {/* Content */}
      <div className="prose prose-lg dark:prose-invert max-w-none">
        {/* 用户注册与登录 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">用户注册与登录</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">注册新用户</h3>
              <div className="bg-gray-900 dark:bg-slate-900 rounded-lg p-4">
                <pre className="text-sm text-green-400 overflow-x-auto">
{`// 使用 fetch API
const response = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'john_doe',
    email: 'john@example.com',
    password: 'SecurePass123!',
    confirmPassword: 'SecurePass123!'
  })
});

const data = await response.json();
console.log('注册成功:', data);`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">用户登录</h3>
              <div className="bg-gray-900 dark:bg-slate-900 rounded-lg p-4">
                <pre className="text-sm text-green-400 overflow-x-auto">
{`const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'SecurePass123!'
  })
});

const { accessToken, refreshToken } = await response.json();

// 存储 token
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* 获取用户信息 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">获取用户信息</h2>
          
          <div className="bg-gray-900 dark:bg-slate-900 rounded-lg p-4 mb-4">
            <pre className="text-sm text-green-400 overflow-x-auto">
{`// 获取当前用户信息
const token = localStorage.getItem('accessToken');

const response = await fetch('http://localhost:3000/api/users/me', {
  headers: {
    'Authorization': \`Bearer \${token}\`
  }
});

const user = await response.json();
console.log('当前用户:', user);`}
            </pre>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>提示:</strong> 所有需要认证的请求都需要在 headers 中添加 Authorization 字段。
            </p>
          </div>
        </section>

        {/* 数据查询 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">数据查询</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">获取列表数据（分页）</h3>
              <div className="bg-gray-900 dark:bg-slate-900 rounded-lg p-4">
                <pre className="text-sm text-green-400 overflow-x-auto">
{`const response = await fetch(
  'http://localhost:3000/api/articles?page=1&limit=10&sort=-createdAt',
  {
    headers: {
      'Authorization': \`Bearer \${token}\`
    }
  }
);

const { data, total, page, limit } = await response.json();
console.log(\`共 \${total} 条记录，当前第 \${page} 页\`);`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">搜索和过滤</h3>
              <div className="bg-gray-900 dark:bg-slate-900 rounded-lg p-4">
                <pre className="text-sm text-green-400 overflow-x-auto">
{`const response = await fetch(
  'http://localhost:3000/api/articles?keyword=技术&status=published&category=tech',
  {
    headers: {
      'Authorization': \`Bearer \${token}\`
    }
  }
);

const articles = await response.json();`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* 创建和更新数据 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">创建和更新数据</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">创建文章</h3>
              <div className="bg-gray-900 dark:bg-slate-900 rounded-lg p-4">
                <pre className="text-sm text-green-400 overflow-x-auto">
{`const response = await fetch('http://localhost:3000/api/articles', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${token}\`
  },
  body: JSON.stringify({
    title: '我的第一篇文章',
    content: '这是文章内容...',
    category: 'tech',
    tags: ['JavaScript', 'Node.js'],
    status: 'draft'
  })
});

const article = await response.json();
console.log('文章创建成功:', article);`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">更新文章</h3>
              <div className="bg-gray-900 dark:bg-slate-900 rounded-lg p-4">
                <pre className="text-sm text-green-400 overflow-x-auto">
{`const articleId = '123';
const response = await fetch(\`http://localhost:3000/api/articles/\${articleId}\`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${token}\`
  },
  body: JSON.stringify({
    status: 'published',
    publishedAt: new Date().toISOString()
  })
});

const updatedArticle = await response.json();`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* 文件上传 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">文件上传</h2>
          
          <div>
            <h3 className="font-semibold mb-3">上传图片</h3>
            <div className="bg-gray-900 dark:bg-slate-900 rounded-lg p-4 mb-4">
              <pre className="text-sm text-green-400 overflow-x-auto">
{`// HTML
<input type="file" id="imageInput" accept="image/*" />

// JavaScript
const input = document.getElementById('imageInput');
const file = input.files[0];

const formData = new FormData();
formData.append('file', file);

const response = await fetch('http://localhost:3000/api/upload/image', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${token}\`
  },
  body: formData
});

const { url } = await response.json();
console.log('图片 URL:', url);`}
              </pre>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>注意:</strong> 上传文件时不要设置 Content-Type header，浏览器会自动设置为 multipart/form-data。
              </p>
            </div>
          </div>
        </section>

        {/* 错误处理 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">错误处理</h2>
          
          <div className="bg-gray-900 dark:bg-slate-900 rounded-lg p-4 mb-4">
            <pre className="text-sm text-green-400 overflow-x-auto">
{`try {
  const response = await fetch('http://localhost:3000/api/users/me', {
    headers: {
      'Authorization': \`Bearer \${token}\`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '请求失败');
  }

  const data = await response.json();
  return data;
} catch (error) {
  console.error('API 错误:', error.message);
  
  // 处理特定错误
  if (error.message.includes('token')) {
    // Token 过期，重新登录
    window.location.href = '/login';
  }
}`}
            </pre>
          </div>
        </section>

        {/* React Hook 示例 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">React Hook 示例</h2>
          
          <div>
            <h3 className="font-semibold mb-3">自定义 useFetch Hook</h3>
            <div className="bg-gray-900 dark:bg-slate-900 rounded-lg p-4">
              <pre className="text-sm text-green-400 overflow-x-auto">
{`import { useState, useEffect } from 'react';

function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(url, {
          headers: {
            'Authorization': \`Bearer \${token}\`
          }
        });

        if (!response.ok) throw new Error('请求失败');

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
}

// 使用示例
function UserProfile() {
  const { data: user, loading, error } = useFetch('/api/users/me');

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  return <div>欢迎, {user.username}!</div>;
}`}
              </pre>
            </div>
          </div>
        </section>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-16 pt-8 border-t border-gray-200 dark:border-slate-700">
        <Link href="/docs/guides/deployment" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-[#3576f6] font-medium">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          上一页：部署
        </Link>
        <Link href="/docs/examples/advanced" className="flex items-center gap-2 text-[#3576f6] hover:text-[#2d6ef5] font-medium">
          下一页：高级特性
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </>
  );
}


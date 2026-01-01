import Link from 'next/link';

export default function ApiAuthPage() {
  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-8">
            <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">
              首页
            </Link>
            <span>/</span>
            <Link href="/docs" className="hover:text-blue-600 dark:hover:text-blue-400">
              文档
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-white">API 参考</span>
          </nav>

          {/* Header */}
          <header className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              API 参考文档
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              完整的 Optimus CMS API 接口文档，包括认证方式、请求格式、响应示例等。
            </p>
          </header>

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            {/* Base URL */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Base URL
              </h2>
              
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <code className="text-blue-600 dark:text-blue-400">
                  {typeof window !== 'undefined' ? window.location.origin.replace(':8086', ':8084') : 'http://localhost:8084'}
                </code>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-4">
                所有 API 请求都基于此 Base URL。生产环境请使用实际的域名地址。
              </p>
            </section>

            {/* 认证方式 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                认证方式
              </h2>

              <div className="space-y-8">
                {/* ClientUserGuard */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-lg">
                    1. ClientUserGuard 认证 (C端用户)
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    用于 C 端用户认证，需要在请求头中包含以下字段：
                  </p>

                  <div className="bg-gray-900 rounded-lg p-4 mb-4">
                    <pre className="text-green-400 text-sm overflow-x-auto">
{`client-uid: user_id
client-sign: signature_hash
client-timestamp: unix_timestamp`}
                    </pre>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">签名算法</h4>
                    <div className="bg-gray-900 rounded p-3 text-sm">
                      <pre className="text-green-400">
{`const crypto = require('crypto');
const timestamp = Date.now();
const uid = 'user123';
const secret = 'your_client_secret_key';
const sign = crypto
  .createHash('md5')
  .update(uid + timestamp + secret)
  .digest('hex');`}
                      </pre>
                    </div>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                      <strong>适用场景:</strong> 客户端前台所有需要登录的接口 (合伙人、积分、任务等)
                    </p>
                  </div>
                </div>

                {/* JWT */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-lg">
                    2. JWT 认证 (管理后台)
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    用于管理后台认证，基于 JSON Web Token：
                  </p>

                  <div className="bg-gray-900 rounded-lg p-4 mb-4">
                    <pre className="text-green-400 text-sm overflow-x-auto">
{`Authorization: Bearer <jwt_token>`}
                    </pre>
                  </div>

                  <div className="bg-gray-100 dark:bg-gray-800 rounded p-4 mb-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2"><strong>获取 Token:</strong></p>
                    <pre className="text-gray-800 dark:text-gray-200 text-sm overflow-x-auto">
{`POST /api/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}

// 响应
{
  "code": 200,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}`}
                    </pre>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                      <strong>适用场景:</strong> 管理后台所有接口、文件上传、系统配置等
                    </p>
                  </div>
                </div>

                {/* 公开访问 */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-lg">
                    3. 公开访问 (无需认证)
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    部分公开接口无需任何认证即可访问：
                  </p>

                  <ul className="text-gray-600 dark:text-gray-400 text-sm space-y-2">
                    <li>• 用户注册 <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs">POST /api/client-user/register</code></li>
                    <li>• 用户登录 <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs">POST /api/client-user/login</code></li>
                    <li>• 公开文章列表 <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs">GET /public/articles</code></li>
                    <li>• 文章详情 <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs">GET /public/articles/:id</code></li>
                    <li>• 产品列表 <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs">GET /api/biz/order/products</code></li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 响应格式 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                统一响应格式
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">成功响应</h3>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded p-4">
                    <pre className="text-gray-800 dark:text-gray-200 text-sm overflow-x-auto">
{`{
  "code": 200,
  "message": "success",
  "data": {
    // 响应数据
  },
  "timestamp": 1703126400000
}`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">错误响应</h3>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded p-4">
                    <pre className="text-gray-800 dark:text-gray-200 text-sm overflow-x-auto">
{`{
  "code": 400,
  "message": "参数错误: username is required",
  "timestamp": 1703126400000
}`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">分页响应</h3>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded p-4">
                    <pre className="text-gray-800 dark:text-gray-200 text-sm overflow-x-auto">
{`{
  "code": 200,
  "message": "success",
  "data": {
    "items": [...],  // 数据列表
    "total": 100,    // 总数
    "page": 1,       // 当前页
    "pageSize": 10   // 每页数量
  },
  "timestamp": 1703126400000
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </section>

            {/* 错误码 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                常见错误码
              </h2>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        错误码
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        说明
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        常见原因
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">200</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">请求成功</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">-</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">400</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">请求参数错误</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">参数缺失、格式错误</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">401</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">未登录或 Token 无效</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">Token 过期、签名错误</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">403</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">无权限访问</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">角色权限不足</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">404</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">资源不存在</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">ID 不存在、接口路径错误</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">409</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">资源冲突</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">用户名已存在、重复操作</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">500</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">服务器内部错误</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">数据库错误、程序异常</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* API 列表概览 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                API 接口概览
              </h2>

              <div className="space-y-6">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    🔐 用户认证
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <code className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs mr-2">POST</code>
                      <code className="text-gray-800 dark:text-gray-200">/api/client-user/register</code>
                      <span className="text-gray-500 dark:text-gray-400 ml-2">- 用户注册</span>
                    </li>
                    <li className="flex items-start">
                      <code className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs mr-2">POST</code>
                      <code className="text-gray-800 dark:text-gray-200">/api/client-user/login</code>
                      <span className="text-gray-500 dark:text-gray-400 ml-2">- 用户登录</span>
                    </li>
                    <li className="flex items-start">
                      <code className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs mr-2">GET</code>
                      <code className="text-gray-800 dark:text-gray-200">/api/client-user/profile</code>
                      <span className="text-gray-500 dark:text-gray-400 ml-2">- 获取用户资料</span>
                    </li>
                  </ul>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    🤝 合伙人系统
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <code className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs mr-2">POST</code>
                      <code className="text-gray-800 dark:text-gray-200">/api/biz/partner/join</code>
                      <span className="text-gray-500 dark:text-gray-400 ml-2">- 加入合伙人</span>
                    </li>
                    <li className="flex items-start">
                      <code className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs mr-2">GET</code>
                      <code className="text-gray-800 dark:text-gray-200">/api/biz/partner/profile</code>
                      <span className="text-gray-500 dark:text-gray-400 ml-2">- 合伙人资料</span>
                    </li>
                    <li className="flex items-start">
                      <code className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs mr-2">GET</code>
                      <code className="text-gray-800 dark:text-gray-200">/api/biz/partner/team</code>
                      <span className="text-gray-500 dark:text-gray-400 ml-2">- 获取团队列表</span>
                    </li>
                  </ul>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    ⭐ 积分系统
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <code className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs mr-2">GET</code>
                      <code className="text-gray-800 dark:text-gray-200">/api/biz/points/me</code>
                      <span className="text-gray-500 dark:text-gray-400 ml-2">- 我的积分</span>
                    </li>
                    <li className="flex items-start">
                      <code className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs mr-2">GET</code>
                      <code className="text-gray-800 dark:text-gray-200">/api/biz/points/monthly-summary</code>
                      <span className="text-gray-500 dark:text-gray-400 ml-2">- 月度汇总</span>
                    </li>
                  </ul>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    📝 文章管理
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <code className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs mr-2">GET</code>
                      <code className="text-gray-800 dark:text-gray-200">/public/articles</code>
                      <span className="text-gray-500 dark:text-gray-400 ml-2">- 文章列表</span>
                    </li>
                    <li className="flex items-start">
                      <code className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs mr-2">GET</code>
                      <code className="text-gray-800 dark:text-gray-200">/public/articles/:id</code>
                      <span className="text-gray-500 dark:text-gray-400 ml-2">- 文章详情</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
                <p className="text-blue-800 dark:text-blue-200 text-sm">
                  💡 <strong>提示:</strong> 完整的 API 文档请访问 <Link href="/api-examples" className="underline">API 示例页面</Link>，
                  您可以在浏览器中直接测试所有接口。
                </p>
              </div>
            </section>

            {/* 下一步 */}
            <section>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  开始调用 API
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <Link
                    href="/api-examples"
                    className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">API 在线测试 →</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">在浏览器中直接调用 API</p>
                    </div>
                  </Link>

                  <Link
                    href="/docs/examples/basic"
                    className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">代码示例 →</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">查看完整代码示例</p>
                    </div>
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}


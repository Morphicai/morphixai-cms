import Link from 'next/link';

export default function BestPracticesPage() {
  return (
    <>
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400 mb-8">
        <Link href="/" className="hover:text-slate-900 dark:hover:text-slate-200">Home</Link>
        <span>/</span>
        <Link href="/docs" className="hover:text-slate-900 dark:hover:text-slate-200">Documentation</Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-slate-200 font-medium">Best Practices</span>
      </nav>

      {/* Header */}
      <header className="mb-12">
        <h1 className="text-4xl font-bold text-black dark:text-white mb-4">
          Best Practices
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
          Optimus CMS development best practices to help you build high-quality, maintainable applications.
        </p>
      </header>

      {/* Content */}
      <div className="prose prose-lg dark:prose-invert max-w-none">
        {/* Code Organization */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Code Organization</h2>
          
          <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-6 mb-6">
            <h3 className="font-semibold mb-4">模块化架构</h3>
            <ul className="space-y-3">
              <li>
                <strong>按功能组织:</strong> 将相关代码组织在同一目录下
                <div className="bg-gray-900 dark:bg-slate-900 rounded-lg p-4 mt-2">
                  <pre className="text-sm text-green-400">
{`src/
├── business/           # 业务模块
│   ├── partner/       # 合伙人模块
│   ├── points/        # 积分模块
│   └── tasks/         # 任务模块
├── shared/            # 共享代码
│   ├── decorators/    # 装饰器
│   ├── guards/        # 守卫
│   └── utils/         # 工具函数
└── system/            # 系统模块`}
                  </pre>
                </div>
              </li>
              <li>
                <strong>单一职责:</strong> 每个模块/类/函数只做一件事情
              </li>
              <li>
                <strong>依赖注入:</strong> 使用 NestJS 的依赖注入系统
              </li>
            </ul>
          </div>
        </section>

        {/* API 设计 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">API 设计</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">RESTful 规范</h3>
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-700">
                      <th className="text-left py-2">方法</th>
                      <th className="text-left py-2">路径示例</th>
                      <th className="text-left py-2">说明</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                    <tr>
                      <td className="py-2 font-mono text-sm">GET</td>
                      <td className="py-2 font-mono text-sm">/api/users</td>
                      <td className="py-2 text-sm">获取用户列表</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-sm">GET</td>
                      <td className="py-2 font-mono text-sm">/api/users/:id</td>
                      <td className="py-2 text-sm">获取单个用户</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-sm">POST</td>
                      <td className="py-2 font-mono text-sm">/api/users</td>
                      <td className="py-2 text-sm">创建用户</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-sm">PUT/PATCH</td>
                      <td className="py-2 font-mono text-sm">/api/users/:id</td>
                      <td className="py-2 text-sm">更新用户</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-sm">DELETE</td>
                      <td className="py-2 font-mono text-sm">/api/users/:id</td>
                      <td className="py-2 text-sm">删除用户</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">统一响应格式</h3>
              <div className="bg-gray-900 dark:bg-slate-900 rounded-lg p-4">
                <pre className="text-sm text-green-400">
{`// 成功响应
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}

// 错误响应
{
  "success": false,
  "code": "USER_NOT_FOUND",
  "message": "用户不存在"
}`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* 错误处理 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">错误处理</h2>
          
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                ✓ 使用自定义异常
              </h4>
              <div className="bg-gray-900 rounded-lg p-4 mt-3">
                <pre className="text-sm text-green-400">
{`throw new BusinessException('用户不存在', 'USER_NOT_FOUND');`}
                </pre>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                ✓ 记录详细日志
              </h4>
              <div className="bg-gray-900 rounded-lg p-4 mt-3">
                <pre className="text-sm text-green-400">
{`this.logger.error('创建用户失败', {
  error: error.message,
  userId: dto.id,
  timestamp: new Date().toISOString()
});`}
                </pre>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                ✓ 使用 try-catch 包装异步操作
              </h4>
              <div className="bg-gray-900 rounded-lg p-4 mt-3">
                <pre className="text-sm text-green-400">
{`try {
  const user = await this.userService.create(dto);
  return { success: true, data: user };
} catch (error) {
  this.logger.error('创建用户失败', error);
  throw error;
}`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* 数据验证 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">数据验证</h2>
          
          <div>
            <h3 className="font-semibold mb-3">使用 class-validator</h3>
            <div className="bg-gray-900 dark:bg-slate-900 rounded-lg p-4">
              <pre className="text-sm text-green-400">
{`import { IsString, IsEmail, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}`}
              </pre>
            </div>
          </div>
        </section>

        {/* 安全性 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">安全性</h2>
          
          <ul className="space-y-3">
            <li className="flex items-start">
              <span className="text-green-600 mr-3">✓</span>
              <div>
                <strong>密码加密:</strong> 使用 bcrypt 加密存储密码
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-3">✓</span>
              <div>
                <strong>JWT 认证:</strong> 使用短期 access token + 长期 refresh token
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-3">✓</span>
              <div>
                <strong>输入验证:</strong> 永远不要信任用户输入，进行严格验证
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-3">✓</span>
              <div>
                <strong>SQL 注入防护:</strong> 使用 ORM 参数化查询
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-3">✓</span>
              <div>
                <strong>CORS 配置:</strong> 只允许授权的域名访问
              </div>
            </li>
          </ul>
        </section>

        {/* 性能优化 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">性能优化</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-3">数据库查询优化</h3>
              <ul className="space-y-2">
                <li>• 使用索引提高查询速度</li>
                <li>• 避免 N+1 查询问题，使用 eager loading</li>
                <li>• 分页查询大量数据</li>
                <li>• 使用数据库缓存（Redis）</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3">API 性能</h3>
              <ul className="space-y-2">
                <li>• 使用 HTTP 缓存头</li>
                <li>• 实现请求限流（Rate Limiting）</li>
                <li>• 压缩响应数据（Gzip）</li>
                <li>• 异步处理耗时任务</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 测试 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">测试</h2>
          
          <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-6">
            <h3 className="font-semibold mb-4">测试金字塔</h3>
            <ul className="space-y-3">
              <li>
                <strong>单元测试 (70%):</strong> 测试单个函数/方法
              </li>
              <li>
                <strong>集成测试 (20%):</strong> 测试多个模块协作
              </li>
              <li>
                <strong>E2E 测试 (10%):</strong> 测试完整用户流程
              </li>
            </ul>
          </div>
        </section>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-16 pt-8 border-t border-gray-200 dark:border-slate-700">
        <Link href="/docs/guides/security" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-[#3576f6] font-medium">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          上一页：安全性
        </Link>
        <Link href="/docs/guides/performance" className="flex items-center gap-2 text-[#3576f6] hover:text-[#2d6ef5] font-medium">
          下一页：性能优化
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </>
  );
}


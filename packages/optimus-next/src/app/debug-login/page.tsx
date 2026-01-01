'use client';

import { useState } from 'react';
import { UniversalClientUserService } from '../../lib/universal-api';

export default function DebugLoginPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    console.log('🎯 [DEBUG] 开始登录测试...');
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🎯 [DEBUG] 调用 UniversalClientUserService.login...');
      
      const response = await UniversalClientUserService.login({
        username: 'test',
        password: 'test123'
      });

      console.log('🎯 [DEBUG] 登录响应:', response);
      setResult(response);
    } catch (err) {
      console.error('🎯 [DEBUG] 登录失败:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
      console.log('🎯 [DEBUG] 登录测试完成');
    }
  };

  const handleTestPublicApi = async () => {
    console.log('🎯 [DEBUG] 开始公开API测试...');
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { UniversalArticleService } = await import('../../lib/universal-api');
      
      console.log('🎯 [DEBUG] 调用 UniversalArticleService.getPublicArticles...');
      
      const response = await UniversalArticleService.getPublicArticles({
        page: 1,
        pageSize: 3
      });

      console.log('🎯 [DEBUG] 文章响应:', response);
      setResult(response);
    } catch (err) {
      console.error('🎯 [DEBUG] 文章获取失败:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
      console.log('🎯 [DEBUG] 公开API测试完成');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">🐛 登录调试页面</h1>

      <div className="space-y-4 mb-8">
        <button
          onClick={handleLogin}
          disabled={loading}
          className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 mr-4"
        >
          {loading ? '测试中...' : '🔐 测试登录'}
        </button>

        <button
          onClick={handleTestPublicApi}
          disabled={loading}
          className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
        >
          {loading ? '测试中...' : '📚 测试公开API'}
        </button>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="font-semibold text-red-800 mb-2">❌ 错误信息</h3>
          <pre className="text-sm text-red-700 whitespace-pre-wrap">{error}</pre>
        </div>
      )}

      {result && (
        <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded">
          <h3 className="font-semibold text-green-800 mb-2">✅ 响应结果</h3>
          <pre className="text-sm text-green-700 whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">📋 调试说明</h3>
        <ul className="text-sm space-y-1">
          <li>• 点击右下角的调试按钮查看详细请求日志</li>
          <li>• 检查浏览器控制台的详细日志输出</li>
          <li>• 观察是否有重复请求警告</li>
          <li>• 确认环境识别是否正确（客户端/服务端）</li>
        </ul>
      </div>
    </div>
  );
}
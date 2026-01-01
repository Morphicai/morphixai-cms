'use client'

import { useEffect, useState } from 'react'
import { get } from '@/lib/api'

interface HealthData {
  status: string
  info?: any
  error?: any
  details?: any
}

export default function ApiTestPage() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHealth()
  }, [])

  const fetchHealth = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await get<HealthData>('/health')
      setHealth(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health data')
      console.error('Failed to fetch health:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API 测试页面</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">健康检查</h2>
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 transition"
            >
              {loading ? '加载中...' : '刷新'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              <strong>错误：</strong> {error}
            </div>
          )}

          {health && (
            <div className="space-y-4">
              <div className="flex items-center">
                <span className="font-semibold mr-2">状态：</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    health.status === 'ok'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {health.status}
                </span>
              </div>

              {health.info && (
                <div>
                  <h3 className="font-semibold mb-2">详细信息：</h3>
                  <pre className="bg-gray-50 p-4 rounded overflow-auto text-sm">
                    {JSON.stringify(health.info, null, 2)}
                  </pre>
                </div>
              )}

              {health.details && (
                <div>
                  <h3 className="font-semibold mb-2">系统详情：</h3>
                  <pre className="bg-gray-50 p-4 rounded overflow-auto text-sm">
                    {JSON.stringify(health.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">说明</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>这是一个测试页面，用于验证与 optimus-api 的连接</li>
            <li>
              API 地址：
              <code className="bg-gray-100 px-2 py-1 rounded text-sm ml-1">
                {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}
              </code>
            </li>
            <li>确保 optimus-api 服务正在运行</li>
            <li>点击"刷新"按钮重新获取数据</li>
          </ul>
        </div>
      </div>
    </div>
  )
}


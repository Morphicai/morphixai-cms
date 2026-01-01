'use client';

import React, { useState } from 'react';
import { cn } from '../../../lib/utils';
import { ApiEndpoint, ApiTestRequest, ApiTestResponse } from './types';

export interface ApiTesterProps {
  endpoint: ApiEndpoint;
  baseUrl?: string;
  className?: string;
}

/**
 * API 交互式测试组件
 * 允许用户直接在文档中测试 API 端点
 */
export const ApiTester: React.FC<ApiTesterProps> = ({
  endpoint,
  baseUrl = 'https://api.optimus.com',
  className,
}) => {
  const [request, setRequest] = useState<ApiTestRequest>({
    method: endpoint.method,
    url: `${baseUrl}${endpoint.path}`,
    headers: {
      'Content-Type': 'application/json',
    },
    body: endpoint.requestBody?.schema.example || undefined,
  });

  const [response, setResponse] = useState<ApiTestResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 更新请求头
  const updateHeader = (key: string, value: string) => {
    setRequest(prev => ({
      ...prev,
      headers: {
        ...prev.headers,
        [key]: value,
      },
    }));
  };

  // 删除请求头
  const removeHeader = (key: string) => {
    setRequest(prev => {
      const newHeaders = { ...prev.headers };
      delete newHeaders[key];
      return {
        ...prev,
        headers: newHeaders,
      };
    });
  };

  // 添加新的请求头
  const addHeader = () => {
    const key = prompt('请输入请求头名称:');
    if (key && key.trim()) {
      const value = prompt('请输入请求头值:') || '';
      updateHeader(key.trim(), value);
    }
  };

  // 更新请求体
  const updateBody = (body: string) => {
    try {
      const parsedBody = body ? JSON.parse(body) : undefined;
      setRequest(prev => ({
        ...prev,
        body: parsedBody,
      }));
      setError(null);
    } catch (err) {
      setError('请求体 JSON 格式错误');
    }
  };

  // 发送请求
  const sendRequest = async () => {
    setIsLoading(true);
    setError(null);
    
    const startTime = Date.now();

    try {
      const fetchOptions: RequestInit = {
        method: request.method,
        headers: request.headers,
      };

      if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        fetchOptions.body = JSON.stringify(request.body);
      }

      const fetchResponse = await fetch(request.url, fetchOptions);
      const duration = Date.now() - startTime;
      
      let responseData;
      const contentType = fetchResponse.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await fetchResponse.json();
      } else {
        responseData = await fetchResponse.text();
      }

      const responseHeaders: Record<string, string> = {};
      fetchResponse.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      setResponse({
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        headers: responseHeaders,
        data: responseData,
        duration,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('bg-background border border-border rounded-lg', className)}>
      <div className="p-6">
        <h4 className="text-lg font-semibold text-foreground mb-6">API 测试工具</h4>

        {/* 请求配置 */}
        <div className="space-y-6">
          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              请求 URL
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 py-2 border border-r-0 border-input bg-muted text-muted-foreground text-sm rounded-l-md">
                {request.method}
              </span>
              <input
                type="text"
                value={request.url}
                onChange={(e) => setRequest(prev => ({ ...prev, url: e.target.value }))}
                className="flex-1 px-3 py-2 border border-input rounded-r-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* 请求头 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-foreground">
                请求头
              </label>
              <button
                onClick={addHeader}
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                + 添加请求头
              </button>
            </div>
            <div className="space-y-2">
              {Object.entries(request.headers).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => {
                      const newKey = e.target.value;
                      if (newKey !== key) {
                        removeHeader(key);
                        updateHeader(newKey, value);
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="请求头名称"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => updateHeader(key, e.target.value)}
                    className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="请求头值"
                  />
                  <button
                    onClick={() => removeHeader(key)}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 请求体 */}
          {['POST', 'PUT', 'PATCH'].includes(request.method) && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                请求体 (JSON)
              </label>
              <textarea
                value={request.body ? JSON.stringify(request.body, null, 2) : ''}
                onChange={(e) => updateBody(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="输入 JSON 格式的请求体..."
              />
              {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
              )}
            </div>
          )}

          {/* 发送按钮 */}
          <div>
            <button
              onClick={sendRequest}
              disabled={isLoading || !!error}
              className={cn(
                'px-6 py-2 rounded-md font-medium text-sm transition-colors',
                'bg-primary-600 text-white hover:bg-primary-700',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                isLoading && 'cursor-wait'
              )}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  发送中...
                </div>
              ) : (
                '发送请求'
              )}
            </button>
          </div>
        </div>

        {/* 响应结果 */}
        {response && (
          <div className="mt-8 border-t border-border pt-6">
            <h5 className="text-md font-semibold text-foreground mb-4">响应结果</h5>
            
            {/* 响应状态 */}
            <div className="flex items-center space-x-4 mb-4">
              <span className={cn(
                'px-3 py-1 text-sm font-medium rounded',
                response.status >= 200 && response.status < 300
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                  : response.status >= 400
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300'
              )}>
                {response.status} {response.statusText}
              </span>
              <span className="text-sm text-muted-foreground">
                响应时间: {response.duration}ms
              </span>
            </div>

            {/* 响应头 */}
            <div className="mb-4">
              <h6 className="text-sm font-medium text-foreground mb-2">响应头</h6>
              <div className="bg-muted rounded-md p-3 text-sm">
                <pre className="text-foreground">
                  {Object.entries(response.headers)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join('\n')}
                </pre>
              </div>
            </div>

            {/* 响应体 */}
            <div>
              <h6 className="text-sm font-medium text-foreground mb-2">响应体</h6>
              <div className="bg-gray-900 rounded-md p-4">
                <pre className="text-green-400 text-sm overflow-x-auto">
                  {typeof response.data === 'string' 
                    ? response.data 
                    : JSON.stringify(response.data, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiTester;
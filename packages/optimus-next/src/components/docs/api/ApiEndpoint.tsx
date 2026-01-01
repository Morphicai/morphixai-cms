'use client';

import React, { useState } from 'react';
import { cn } from '../../../lib/utils';
import { ApiDocProps, ApiParameter, ApiResponse, CodeExample } from './types';

/**
 * API 端点文档组件
 * 展示单个 API 端点的完整文档信息
 */
export const ApiEndpoint: React.FC<ApiDocProps> = ({
  endpoint,
  showExamples = true,
  interactive = false,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'examples' | 'test'>('overview');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');

  // HTTP 方法颜色映射
  const getMethodColor = (method: string) => {
    const colors = {
      GET: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
      POST: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      PUT: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
      DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
      PATCH: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    };
    return colors[method as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300';
  };

  // 生成代码示例
  const generateCodeExamples = (): CodeExample[] => {
    const baseUrl = 'https://api.optimus.com';
    const fullUrl = `${baseUrl}${endpoint.path}`;
    
    const examples: CodeExample[] = [
      {
        language: 'javascript',
        label: 'JavaScript (Fetch)',
        code: `// ${endpoint.summary}
const response = await fetch('${fullUrl}', {
  method: '${endpoint.method}',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  }${endpoint.requestBody ? `,
  body: JSON.stringify(${JSON.stringify(endpoint.requestBody.schema.example || {}, null, 2)})` : ''}
});

const data = await response.json();
console.log(data);`,
      },
      {
        language: 'curl',
        label: 'cURL',
        code: `# ${endpoint.summary}
curl -X ${endpoint.method} \\
  "${fullUrl}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN"${endpoint.requestBody ? ` \\
  -d '${JSON.stringify(endpoint.requestBody.schema.example || {}, null, 2)}'` : ''}`,
      },
      {
        language: 'python',
        label: 'Python (Requests)',
        code: `# ${endpoint.summary}
import requests

url = "${fullUrl}"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_TOKEN"
}${endpoint.requestBody ? `
data = ${JSON.stringify(endpoint.requestBody.schema.example || {}, null, 2)}

response = requests.${endpoint.method.toLowerCase()}(url, headers=headers, json=data)` : `

response = requests.${endpoint.method.toLowerCase()}(url, headers=headers)`}
print(response.json())`,
      },
    ];

    return examples;
  };

  const codeExamples = generateCodeExamples();

  const renderParameter = (param: ApiParameter) => (
    <tr key={param.name} className="border-b border-border">
      <td className="py-3 px-4 font-mono text-sm">
        <span className="text-foreground">{param.name}</span>
        {param.required && (
          <span className="ml-2 text-red-500 text-xs">*</span>
        )}
      </td>
      <td className="py-3 px-4">
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded">
          {param.type}
        </span>
      </td>
      <td className="py-3 px-4 text-sm text-muted-foreground">
        {param.description}
        {param.example && (
          <div className="mt-1 font-mono text-xs bg-muted px-2 py-1 rounded">
            例: {JSON.stringify(param.example)}
          </div>
        )}
      </td>
    </tr>
  );

  const renderResponse = (response: ApiResponse) => (
    <div key={response.statusCode} className="border border-border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className={cn(
            'px-3 py-1 text-sm font-medium rounded',
            response.statusCode >= 200 && response.statusCode < 300
              ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
              : response.statusCode >= 400
              ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300'
          )}>
            {response.statusCode}
          </span>
          <span className="text-sm text-muted-foreground">
            {response.description}
          </span>
        </div>
      </div>

      {response.schema && response.schema.example && (
        <div className="bg-muted rounded-md p-3">
          <pre className="text-sm text-foreground overflow-x-auto">
            {JSON.stringify(response.schema.example, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );

  return (
    <div className={cn('bg-background border border-border rounded-lg', className)}>
      {/* 头部 */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <span className={cn(
                'px-3 py-1 text-sm font-bold rounded',
                getMethodColor(endpoint.method)
              )}>
                {endpoint.method}
              </span>
              <code className="text-lg font-mono text-foreground">
                {endpoint.path}
              </code>
              {endpoint.deprecated && (
                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded dark:bg-yellow-900/50 dark:text-yellow-300">
                  已弃用
                </span>
              )}
            </div>
            
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {endpoint.summary}
            </h3>
            
            <p className="text-muted-foreground">
              {endpoint.description}
            </p>

            {endpoint.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {endpoint.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-accent text-accent-foreground rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 标签页 */}
      <div className="border-b border-border">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            概览
          </button>
          
          {showExamples && (
            <button
              onClick={() => setActiveTab('examples')}
              className={cn(
                'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === 'examples'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              代码示例
            </button>
          )}
          
          {interactive && (
            <button
              onClick={() => setActiveTab('test')}
              className={cn(
                'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === 'test'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              在线测试
            </button>
          )}
        </nav>
      </div>

      {/* 内容区域 */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* 请求参数 */}
            {endpoint.parameters && endpoint.parameters.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-4">请求参数</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium text-foreground">参数名</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">类型</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">说明</th>
                      </tr>
                    </thead>
                    <tbody>
                      {endpoint.parameters.map(renderParameter)}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 请求体 */}
            {endpoint.requestBody && (
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-4">请求体</h4>
                <p className="text-muted-foreground mb-3">{endpoint.requestBody.description}</p>
                {endpoint.requestBody.schema.example && (
                  <div className="bg-muted rounded-md p-4">
                    <pre className="text-sm text-foreground overflow-x-auto">
                      {JSON.stringify(endpoint.requestBody.schema.example, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* 响应 */}
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-4">响应</h4>
              {endpoint.responses.map(renderResponse)}
            </div>
          </div>
        )}

        {activeTab === 'examples' && showExamples && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-semibold text-foreground">代码示例</h4>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground"
              >
                {codeExamples.map((example) => (
                  <option key={example.language} value={example.language}>
                    {example.label}
                  </option>
                ))}
              </select>
            </div>

            {codeExamples
              .filter((example) => example.language === selectedLanguage)
              .map((example) => (
                <div key={example.language} className="bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-300 text-sm font-medium">
                      {example.label}
                    </span>
                    <button
                      onClick={() => navigator.clipboard.writeText(example.code)}
                      className="text-gray-400 hover:text-white text-sm"
                    >
                      复制代码
                    </button>
                  </div>
                  <pre className="text-green-400 text-sm overflow-x-auto">
                    <code>{example.code}</code>
                  </pre>
                </div>
              ))}
          </div>
        )}

        {activeTab === 'test' && interactive && (
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-4">在线测试</h4>
            <div className="bg-muted rounded-lg p-4">
              <p className="text-muted-foreground text-center">
                交互式 API 测试功能即将推出...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiEndpoint;
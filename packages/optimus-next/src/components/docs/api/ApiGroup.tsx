'use client';

import React, { useState } from 'react';
import { cn } from '../../../lib/utils';
import { ApiEndpoint } from './ApiEndpoint';
import { ApiEndpoint as ApiEndpointType } from './types';

export interface ApiGroupProps {
  title: string;
  description?: string;
  endpoints: ApiEndpointType[];
  defaultExpanded?: boolean;
  showExamples?: boolean;
  interactive?: boolean;
  className?: string;
}

/**
 * API 端点组组件
 * 用于展示一组相关的 API 端点
 */
export const ApiGroup: React.FC<ApiGroupProps> = ({
  title,
  description,
  endpoints,
  defaultExpanded = true,
  showExamples = true,
  interactive = false,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(
    endpoints.length > 0 ? endpoints[0].id : null
  );

  const currentEndpoint = endpoints.find(ep => ep.id === selectedEndpoint);

  return (
    <div className={cn('bg-background border border-border rounded-lg', className)}>
      {/* 组头部 */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-md hover:bg-accent"
          >
            <svg
              className={cn(
                'h-5 w-5 text-muted-foreground transition-transform',
                isExpanded ? 'rotate-180' : 'rotate-0'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {/* 端点统计 */}
        {isExpanded && (
          <div className="flex items-center space-x-4 mt-4">
            <span className="text-sm text-muted-foreground">
              {endpoints.length} 个端点
            </span>
            
            {/* 方法统计 */}
            <div className="flex items-center space-x-2">
              {['GET', 'POST', 'PUT', 'DELETE'].map(method => {
                const count = endpoints.filter(ep => ep.method === method).length;
                if (count === 0) return null;
                
                const colors = {
                  GET: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
                  POST: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
                  PUT: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
                  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
                };
                
                return (
                  <span
                    key={method}
                    className={cn(
                      'px-2 py-1 text-xs font-medium rounded',
                      colors[method as keyof typeof colors]
                    )}
                  >
                    {method} ({count})
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 内容区域 */}
      {isExpanded && (
        <div className="flex">
          {/* 端点列表 */}
          <div className="w-80 border-r border-border bg-muted/30">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">端点列表</h3>
              <div className="space-y-2">
                {endpoints.map((endpoint) => (
                  <button
                    key={endpoint.id}
                    onClick={() => setSelectedEndpoint(endpoint.id)}
                    className={cn(
                      'w-full text-left p-3 rounded-md transition-colors',
                      selectedEndpoint === endpoint.id
                        ? 'bg-primary-100 text-primary-900 dark:bg-primary-900/50 dark:text-primary-100'
                        : 'hover:bg-accent'
                    )}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={cn(
                        'px-2 py-1 text-xs font-bold rounded',
                        endpoint.method === 'GET' && 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
                        endpoint.method === 'POST' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
                        endpoint.method === 'PUT' && 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
                        endpoint.method === 'DELETE' && 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
                        endpoint.method === 'PATCH' && 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
                      )}>
                        {endpoint.method}
                      </span>
                      {endpoint.deprecated && (
                        <span className="px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded dark:bg-yellow-900/50 dark:text-yellow-300">
                          已弃用
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm font-medium text-foreground mb-1">
                      {endpoint.summary}
                    </div>
                    
                    <code className="text-xs text-muted-foreground font-mono">
                      {endpoint.path}
                    </code>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 端点详情 */}
          <div className="flex-1">
            {currentEndpoint ? (
              <ApiEndpoint
                endpoint={currentEndpoint}
                showExamples={showExamples}
                interactive={interactive}
                className="border-0 rounded-none"
              />
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <svg
                  className="mx-auto h-12 w-12 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p>选择一个端点查看详细信息</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiGroup;
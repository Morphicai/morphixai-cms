'use client';

import { useState } from 'react';
import { useMount } from '../../hooks/useMount';
import { 
  clientUserService, 
  partnerService, 
  orderService, 
  pointsService, 
  externalTaskService, 
  articleService,
  fileService,
  type ApiResponse 
} from '../../services/ApiService';

export default function ApiExamplesPage() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useMount(() => {
    // 检查是否已登录
    const token = localStorage.getItem('clientUserToken');
    setIsLoggedIn(!!token);
  });

  const executeApi = async (key: string, apiCall: () => Promise<ApiResponse>) => {
    setLoading(prev => ({ ...prev, [key]: true }));
    try {
      const result = await apiCall();
      setResults(prev => ({ ...prev, [key]: result }));
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        [key]: { 
          error: error instanceof Error ? error.message : '请求失败' 
        } 
      }));
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleLogin = async () => {
    const username = prompt('请输入用户名:');
    const password = prompt('请输入密码:');
    
    if (username && password) {
      await executeApi('login', () => 
        clientUserService.login({ username, password })
      );
      
      // 检查登录是否成功
      const token = localStorage.getItem('clientUserToken');
      setIsLoggedIn(!!token);
    }
  };

  const handleRegister = async () => {
    const username = prompt('请输入用户名:');
    const email = prompt('请输入邮箱:');
    const password = prompt('请输入密码:');
    
    if (username && email && password) {
      await executeApi('register', () => 
        clientUserService.register({ username, email, password })
      );
    }
  };

  const handleLogout = () => {
    clientUserService.logout();
    setIsLoggedIn(false);
    setResults({});
  };

  const renderResult = (key: string) => {
    const result = results[key];
    const isLoading = loading[key];

    if (isLoading) {
      return <div className="text-blue-600">加载中...</div>;
    }

    if (!result) {
      return <div className="text-gray-500">暂无数据</div>;
    }

    return (
      <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-auto max-h-40">
        {JSON.stringify(result, null, 2)}
      </pre>
    );
  };

  const ApiSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{title}</h2>
      {children}
    </div>
  );

  const ApiButton = ({ 
    onClick, 
    children, 
    disabled = false,
    variant = 'primary' 
  }: { 
    onClick: () => void; 
    children: React.ReactNode; 
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  }) => {
    const baseClasses = "px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
    const variantClasses = {
      primary: "bg-primary-500 hover:bg-primary-600 text-white",
      secondary: "bg-secondary-500 hover:bg-secondary-600 text-white", 
      outline: "border border-border bg-background hover:bg-muted text-foreground",
      ghost: "hover:bg-muted text-foreground"
    };

    return (
      <button 
        onClick={onClick}
        disabled={disabled}
        className={`${baseClasses} ${variantClasses[variant]}`}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              客户端 API 调用案例
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              展示 optimus-next 客户端可以调用的所有 API 接口
            </p>
            <div className="mt-4">
              <span className={`px-3 py-1 rounded-full text-sm ${
                isLoggedIn 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {isLoggedIn ? '已登录' : '未登录'}
              </span>
            </div>
          </div>

          {/* 用户认证 API */}
          <ApiSection title="🔐 用户认证 API (公开接口)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="font-medium mb-2">用户注册</h3>
                <ApiButton onClick={handleRegister}>
                  注册新用户
                </ApiButton>
                {results.register && (
                  <div className="mt-2">
                    {renderResult('register')}
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-medium mb-2">用户登录</h3>
                <div className="space-x-2">
                  <ApiButton onClick={handleLogin}>
                    用户登录
                  </ApiButton>
                  {isLoggedIn && (
                    <ApiButton onClick={handleLogout} variant="outline">
                      退出登录
                    </ApiButton>
                  )}
                </div>
                {results.login && (
                  <div className="mt-2">
                    {renderResult('login')}
                  </div>
                )}
              </div>
            </div>
          </ApiSection>

          {/* 用户信息 API */}
          <ApiSection title="👤 用户信息 API (需要 ClientUserGuard 认证)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="font-medium mb-2">获取用户资料</h3>
                <ApiButton 
                  onClick={() => executeApi('profile', () => clientUserService.getProfile())}
                  disabled={!isLoggedIn}
                >
                  获取我的资料
                </ApiButton>
                {results.profile && (
                  <div className="mt-2">
                    {renderResult('profile')}
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-medium mb-2">外部账号绑定</h3>
                <ApiButton 
                  onClick={() => executeApi('externalAccounts', () => clientUserService.getExternalAccounts())}
                  disabled={!isLoggedIn}
                >
                  获取绑定账号
                </ApiButton>
                {results.externalAccounts && (
                  <div className="mt-2">
                    {renderResult('externalAccounts')}
                  </div>
                )}
              </div>
            </div>
          </ApiSection>

          {/* 公开文章 API */}
          <ApiSection title="📝 公开文章 API (无需认证)">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <h3 className="font-medium mb-2">文章列表</h3>
                <ApiButton 
                  onClick={() => executeApi('articles', () => 
                    articleService.getPublicArticles({ page: 1, pageSize: 5 })
                  )}
                >
                  获取文章列表
                </ApiButton>
                {results.articles && (
                  <div className="mt-2">
                    {renderResult('articles')}
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-medium mb-2">搜索文章</h3>
                <ApiButton 
                  onClick={() => {
                    const keyword = prompt('请输入搜索关键词:') || 'test';
                    executeApi('searchArticles', () => 
                      articleService.searchArticles({ keyword, page: 1, pageSize: 5 })
                    );
                  }}
                >
                  搜索文章
                </ApiButton>
                {results.searchArticles && (
                  <div className="mt-2">
                    {renderResult('searchArticles')}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-medium mb-2">文章详情</h3>
                <ApiButton 
                  onClick={() => {
                    const id = prompt('请输入文章ID:') || '1';
                    executeApi('articleDetail', () => 
                      articleService.getArticleById(id)
                    );
                  }}
                >
                  获取文章详情
                </ApiButton>
                {results.articleDetail && (
                  <div className="mt-2">
                    {renderResult('articleDetail')}
                  </div>
                )}
              </div>
            </div>
          </ApiSection>

          {/* 合伙人 API */}
          <ApiSection title="🤝 合伙人 API (需要 ClientUserGuard 认证)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="font-medium mb-2">加入合伙人</h3>
                <ApiButton 
                  onClick={() => {
                    const username = prompt('请输入用户名:') || 'testuser';
                    executeApi('joinPartner', () => 
                      partnerService.join({
                        username,
                        userRegisterTime: Date.now(),
                        teamName: '我的团队'
                      })
                    );
                  }}
                  disabled={!isLoggedIn}
                >
                  加入合伙人计划
                </ApiButton>
                {results.joinPartner && (
                  <div className="mt-2">
                    {renderResult('joinPartner')}
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-medium mb-2">合伙人资料</h3>
                <ApiButton 
                  onClick={() => executeApi('partnerProfile', () => partnerService.getProfile())}
                  disabled={!isLoggedIn}
                >
                  获取合伙人资料
                </ApiButton>
                {results.partnerProfile && (
                  <div className="mt-2">
                    {renderResult('partnerProfile')}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-medium mb-2">团队信息</h3>
                <ApiButton 
                  onClick={() => executeApi('team', () => 
                    partnerService.getTeam({ page: 1, pageSize: 10 })
                  )}
                  disabled={!isLoggedIn}
                >
                  获取我的团队
                </ApiButton>
                {results.team && (
                  <div className="mt-2">
                    {renderResult('team')}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-medium mb-2">团队概览</h3>
                <ApiButton 
                  onClick={() => executeApi('overview', () => partnerService.getOverview())}
                  disabled={!isLoggedIn}
                >
                  获取团队概览
                </ApiButton>
                {results.overview && (
                  <div className="mt-2">
                    {renderResult('overview')}
                  </div>
                )}
              </div>
            </div>
          </ApiSection>

          {/* 订单 API */}
          <ApiSection title="🛒 订单 API">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="font-medium mb-2">产品列表 (公开)</h3>
                <ApiButton 
                  onClick={() => executeApi('products', () => orderService.getProducts())}
                >
                  获取产品列表
                </ApiButton>
                {results.products && (
                  <div className="mt-2">
                    {renderResult('products')}
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-medium mb-2">产品参数 (公开)</h3>
                <ApiButton 
                  onClick={() => {
                    const productId = prompt('请输入产品ID:') || 'test-product';
                    executeApi('productParams', () => 
                      orderService.getProductParams(productId)
                    );
                  }}
                >
                  获取产品参数
                </ApiButton>
                {results.productParams && (
                  <div className="mt-2">
                    {renderResult('productParams')}
                  </div>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              注意: 创建订单和查询订单需要特殊的 uid 和 authToken 认证方式
            </div>
          </ApiSection>

          {/* 积分 API */}
          <ApiSection title="⭐ 积分 API (需要 ClientUserGuard 认证)">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <h3 className="font-medium mb-2">我的积分</h3>
                <ApiButton 
                  onClick={() => executeApi('myPoints', () => pointsService.getMyPoints(true))}
                  disabled={!isLoggedIn}
                >
                  获取我的积分
                </ApiButton>
                {results.myPoints && (
                  <div className="mt-2">
                    {renderResult('myPoints')}
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-medium mb-2">月度汇总</h3>
                <ApiButton 
                  onClick={() => executeApi('monthlySummary', () => pointsService.getMonthlySummary())}
                  disabled={!isLoggedIn}
                >
                  获取月度汇总
                </ApiButton>
                {results.monthlySummary && (
                  <div className="mt-2">
                    {renderResult('monthlySummary')}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-medium mb-2">任务完成通知</h3>
                <ApiButton 
                  onClick={() => {
                    const taskCode = prompt('请输入任务代码:') || 'daily_login';
                    executeApi('notifyTask', () => 
                      pointsService.notifyTaskCompletion({ taskCode })
                    );
                  }}
                  disabled={!isLoggedIn}
                >
                  通知任务完成
                </ApiButton>
                {results.notifyTask && (
                  <div className="mt-2">
                    {renderResult('notifyTask')}
                  </div>
                )}
              </div>
            </div>
          </ApiSection>

          {/* 外部任务 API */}
          <ApiSection title="📋 外部任务 API (需要 ClientUserGuard 认证)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="font-medium mb-2">任务列表</h3>
                <ApiButton 
                  onClick={() => executeApi('taskList', () => externalTaskService.getTaskList())}
                  disabled={!isLoggedIn}
                >
                  获取任务列表
                </ApiButton>
                {results.taskList && (
                  <div className="mt-2">
                    {renderResult('taskList')}
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-medium mb-2">任务类型</h3>
                <ApiButton 
                  onClick={() => executeApi('taskTypes', () => externalTaskService.getTaskTypes())}
                  disabled={!isLoggedIn}
                >
                  获取任务类型
                </ApiButton>
                {results.taskTypes && (
                  <div className="mt-2">
                    {renderResult('taskTypes')}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-medium mb-2">我的提交</h3>
                <ApiButton 
                  onClick={() => executeApi('mySubmissions', () => 
                    externalTaskService.getMySubmissions({ page: 1, pageSize: 10 })
                  )}
                  disabled={!isLoggedIn}
                >
                  获取我的提交
                </ApiButton>
                {results.mySubmissions && (
                  <div className="mt-2">
                    {renderResult('mySubmissions')}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-medium mb-2">提交任务</h3>
                <ApiButton 
                  onClick={() => {
                    const taskType = prompt('请输入任务类型:') || 'social_media';
                    const taskLink = prompt('请输入任务链接:') || 'https://example.com';
                    executeApi('submitTask', () => 
                      externalTaskService.submitTask({
                        taskType,
                        taskLink,
                        remark: '测试提交'
                      })
                    );
                  }}
                  disabled={!isLoggedIn}
                >
                  提交任务
                </ApiButton>
                {results.submitTask && (
                  <div className="mt-2">
                    {renderResult('submitTask')}
                  </div>
                )}
              </div>
            </div>
          </ApiSection>

          {/* 文件服务 API */}
          <ApiSection title="📁 文件服务 API">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="font-medium mb-2">健康检查 (公开)</h3>
                <ApiButton 
                  onClick={() => executeApi('fileHealth', () => fileService.getHealthStatus())}
                >
                  检查文件服务状态
                </ApiButton>
                {results.fileHealth && (
                  <div className="mt-2">
                    {renderResult('fileHealth')}
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-medium mb-2">文件列表 (需要JWT认证)</h3>
                <ApiButton 
                  onClick={() => executeApi('fileList', () => 
                    fileService.getFileList({ page: 1, pageSize: 10 })
                  )}
                >
                  获取文件列表
                </ApiButton>
                {results.fileList && (
                  <div className="mt-2">
                    {renderResult('fileList')}
                  </div>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              注意: 文件上传和删除需要 JWT 认证 (管理后台认证)
            </div>
          </ApiSection>

          {/* API 说明 */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-3">
              📖 API 认证说明
            </h2>
            <div className="space-y-2 text-sm text-yellow-700 dark:text-yellow-300">
              <p><strong>公开接口:</strong> 无需任何认证，可直接调用</p>
              <p><strong>ClientUserGuard 认证:</strong> 需要客户端用户登录，使用 clientUserToken</p>
              <p><strong>JWT 认证:</strong> 需要管理后台登录，使用 jwtToken (管理员功能)</p>
              <p><strong>特殊认证:</strong> 订单相关接口需要 uid 和 authToken 头部认证</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
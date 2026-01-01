'use client';

import { useState } from 'react';
import { useMount } from '../../hooks/useMount';
import { 
  UniversalClientUserService,
  UniversalPartnerService,
  UniversalPointsService,
  UniversalArticleService,
} from '../../lib/universal-api';
import { TokenService } from '../../services/TokenService';

interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
}

interface Partner {
  id: number;
  partnerNo: string;
  starLevel: number;
  totalPoints: number;
  teamName?: string;
}

interface Article {
  id: number;
  title: string;
  slug: string;
  summary?: string;
  publishedAt: string;
}

export default function BusinessDemoPage() {
  const [user, setUser] = useState<User | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [points, setPoints] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useMount(() => {
    loadPublicData();
    checkUserStatus();
  });

  const loadPublicData = async () => {
    try {
      // 加载公开文章
      const articlesResponse = await UniversalArticleService.getPublicArticles({
        page: 1,
        pageSize: 5,
        sortBy: 'publishedAt',
        sortOrder: 'DESC'
      });
      
      if (articlesResponse.code === 200) {
        setArticles(articlesResponse.data?.items || []);
      }
    } catch (err) {
      console.error('加载公开数据失败:', err);
    }
  };

  const checkUserStatus = async () => {
    if (!TokenService.isLoggedIn()) return;

    try {
      // 获取用户信息
      const userResponse = await UniversalClientUserService.getProfile();
      if (userResponse.code === 200) {
        setUser(userResponse.data);
        
        // 尝试获取合伙人信息
        try {
          const partnerResponse = await UniversalPartnerService.getProfile();
          if (partnerResponse.code === 200) {
            setPartner(partnerResponse.data);
            
            // 获取积分信息
            const pointsResponse = await UniversalPointsService.getMyPoints(true);
            if (pointsResponse.code === 200) {
              setPoints(pointsResponse.data);
            }
          }
        } catch (partnerErr) {
          // 用户可能还不是合伙人
          console.log('用户还不是合伙人');
        }
      }
    } catch (err) {
      console.error('检查用户状态失败:', err);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const username = prompt('请输入用户名:');
      const password = prompt('请输入密码:');
      
      if (!username || !password) {
        setLoading(false);
        return;
      }

      console.log('🔐 开始登录请求...');
      const response = await UniversalClientUserService.login({ username, password });
      
      if (response.code === 200) {
        console.log('✅ 登录成功');
        await checkUserStatus();
      } else {
        setError(response.message || '登录失败');
      }
    } catch (err) {
      console.error('❌ 登录失败:', err);
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const username = prompt('请输入用户名:');
      const email = prompt('请输入邮箱:');
      const password = prompt('请输入密码:');
      
      if (!username || !email || !password) {
        setLoading(false);
        return;
      }

      const response = await UniversalClientUserService.register({ username, email, password });
      
      if (response.code === 200) {
        alert('注册成功！请登录');
      } else {
        setError(response.message || '注册失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinPartner = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const teamName = prompt('请输入团队名称:') || '我的团队';
      const inviterCode = prompt('请输入邀请码 (可选):') || undefined;
      
      const response = await UniversalPartnerService.join({
        username: user.username,
        userRegisterTime: new Date(user.createdAt).getTime(),
        teamName,
        inviterCode
      });
      
      if (response.code === 200) {
        setPartner(response.data);
        alert('成功加入合伙人计划！');
        
        // 重新加载积分信息
        const pointsResponse = await UniversalPointsService.getMyPoints(true);
        if (pointsResponse.code === 200) {
          setPoints(pointsResponse.data);
        }
      } else {
        setError(response.message || '加入合伙人计划失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加入合伙人计划失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await UniversalClientUserService.logout();
      TokenService.clearTokens();
      setUser(null);
      setPartner(null);
      setPoints(null);
    } catch (err) {
      console.error('退出登录失败:', err);
      // 即使服务器端退出失败，也清除本地状态
      TokenService.clearTokens();
      setUser(null);
      setPartner(null);
      setPoints(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              业务场景演示
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              完整的用户注册、登录、合伙人加入流程演示
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* User Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              用户状态
            </h2>
            
            {!user ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  您还未登录，请先注册或登录
                </p>
                <div className="space-x-4">
                  <button
                    onClick={handleRegister}
                    disabled={loading}
                    className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? '处理中...' : '注册新用户'}
                  </button>
                  <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? '处理中...' : '用户登录'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* User Info */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      👤 用户信息
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">用户名:</span> {user.username}</p>
                      <p><span className="font-medium">邮箱:</span> {user.email}</p>
                      <p><span className="font-medium">注册时间:</span> {formatDate(user.createdAt)}</p>
                    </div>
                  </div>

                  {/* Partner Info */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      🤝 合伙人信息
                    </h3>
                    {partner ? (
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">合伙人编号:</span> {partner.partnerNo}</p>
                        <p><span className="font-medium">星级:</span> {partner.starLevel} 星</p>
                        <p><span className="font-medium">总积分:</span> {partner.totalPoints}</p>
                        {partner.teamName && (
                          <p><span className="font-medium">团队名称:</span> {partner.teamName}</p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          您还不是合伙人
                        </p>
                        <button
                          onClick={handleJoinPartner}
                          disabled={loading}
                          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {loading ? '处理中...' : '加入合伙人计划'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Points Info */}
                {points && (
                  <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      ⭐ 积分信息
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="font-medium">当前积分</p>
                        <p className="text-lg text-blue-600 dark:text-blue-400">
                          {points.currentPoints || 0}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">累计积分</p>
                        <p className="text-lg text-green-600 dark:text-green-400">
                          {points.totalEarned || 0}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">已使用积分</p>
                        <p className="text-lg text-red-600 dark:text-red-400">
                          {points.totalSpent || 0}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">冻结积分</p>
                        <p className="text-lg text-yellow-600 dark:text-yellow-400">
                          {points.frozenPoints || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 text-center">
                  <button
                    onClick={handleLogout}
                    className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded font-medium transition-colors"
                  >
                    退出登录
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Public Articles */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              📝 最新文章 (公开内容)
            </h2>
            
            {articles.length > 0 ? (
              <div className="space-y-4">
                {articles.map((article) => (
                  <div
                    key={article.id}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {article.title}
                    </h3>
                    {article.summary && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                        {article.summary}
                      </p>
                    )}
                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-500">
                      <span>发布时间: {formatDate(article.publishedAt)}</span>
                      <span>Slug: {article.slug}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                暂无文章数据
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
              💡 使用说明
            </h2>
            <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
              <p>1. <strong>注册用户:</strong> 创建新的客户端用户账号</p>
              <p>2. <strong>用户登录:</strong> 使用用户名和密码登录</p>
              <p>3. <strong>加入合伙人:</strong> 登录后可以加入合伙人计划</p>
              <p>4. <strong>查看积分:</strong> 合伙人可以查看积分详情</p>
              <p>5. <strong>公开内容:</strong> 无需登录即可查看文章等公开内容</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
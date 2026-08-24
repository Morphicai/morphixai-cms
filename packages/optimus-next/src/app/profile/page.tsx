'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMount } from '../../hooks/useMount';
import { clientUserService, partnerService, pointsService } from '../../services/ApiService';

interface User {
  userId: string;
  username: string;
  email: string;
  createdAt: string;
}

// 字段名对齐 partner-service 的 PartnerProfileEntity 真实返回(GET /biz/partner/profile),
// 不是历史上假设的形状——currentStar 是字符串枚举(NEW/S1.../LEGEND),不是数字星数
interface Partner {
  partnerCode: string;
  currentStar: string;
  teamName?: string;
}

const STAR_LEVEL_LABELS: Record<string, string> = {
  NEW: '新人',
  S1: '一星',
  S2: '二星',
  S3: '三星',
  S4: '四星',
  S5: '五星',
  LEGEND: '传奇',
};

// 字段名对齐 points-engine 真实返回(GET /biz/points/me):只有 totalPoints 一个汇总值,
// 没有 totalEarned/totalSpent/frozenPoints——积分消耗/冻结这套概念在后端从未实现过
// (points-engine/README.md 明确把 "Points consumption / deduction" 列为未实现项)
interface Points {
  totalPoints: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [points, setPoints] = useState<Points | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useMount(() => {
    checkAuthAndLoadData();
  });

  const checkAuthAndLoadData = async () => {
    // 不做前置 token 检查——token 在 httpOnly cookie 里，前端本来就读不到，
    // 登录与否只有接口说了算：直接请求，401 再跳登录。
    // 这里原先查的 localStorage 'clientUserToken' 是个从来没人写过的键，
    // 结果所有人（包括已登录的）都被它拦在门外
    setLoading(true);
    setError(null);

    try {
      // 获取用户信息
      const userResponse = await clientUserService.getProfile();
      if (userResponse.code === 200) {
        setUser(userResponse.data);

        // 尝试获取合伙人信息
        try {
          const partnerResponse = await partnerService.getProfile();
          if (partnerResponse.code === 200) {
            setPartner(partnerResponse.data);

            // 获取积分信息
            const pointsResponse = await pointsService.getMyPoints(true);
            if (pointsResponse.code === 200) {
              setPoints(pointsResponse.data);
            }
          }
        } catch (partnerErr) {
          // 用户可能还不是合伙人，这是正常的
          console.log('用户还不是合伙人');
        }
      } else {
        setError('获取用户信息失败');
        if (userResponse.code === 401) {
          router.push('/auth');
        }
      }
    } catch (err: any) {
      if (err?.status === 401) {
        router.push('/auth');
        return;
      }
      setError('加载数据失败，请稍后重试');
      console.error('Profile load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinPartner = () => {
    router.push('/business-demo');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64"></div>
                <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="bg-white dark:bg-gray-900 min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              加载失败
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {error || '无法加载用户信息'}
            </p>
            <button
              onClick={checkAuthAndLoadData}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              个人资料
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              管理您的账号信息和设置
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* User Info Card */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-6">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {(user.username || user.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {user.username || user.email?.split('@')[0]}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      用户名
                    </label>
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white">
                      {user.username || user.email?.split('@')[0]}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      邮箱地址
                    </label>
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white">
                      {user.email}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      注册时间
                    </label>
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white">
                      {formatDate(user.createdAt)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      用户ID
                    </label>
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white">
                      #{user.userId}
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    账号操作
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                      修改密码
                    </button>
                    <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors">
                      更新邮箱
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Partner Status */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  合伙人状态
                </h3>
                
                {partner ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">合伙人编号</span>
                      <span className="font-medium text-gray-900 dark:text-white">{partner.partnerCode}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">星级</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {STAR_LEVEL_LABELS[partner.currentStar] || partner.currentStar}
                      </span>
                    </div>
                    {partner.teamName && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">团队名称</span>
                        <span className="font-medium text-gray-900 dark:text-white">{partner.teamName}</span>
                      </div>
                    )}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => router.push('/business-demo')}
                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                      >
                        管理团队
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                      您还不是合伙人
                    </p>
                    <button
                      onClick={handleJoinPartner}
                      className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                    >
                      加入合伙人计划
                    </button>
                  </div>
                )}
              </div>

              {/* Points Summary */}
              {points && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    积分概览
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">当前积分</span>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {points.totalPoints}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  快速操作
                </h3>
                
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/api-examples')}
                    className="w-full flex items-center px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 mr-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    API 演示
                  </button>
                  
                  <button
                    onClick={() => router.push('/business-demo')}
                    className="w-full flex items-center px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 mr-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    业务演示
                  </button>
                  
                  <button
                    onClick={() => router.push('/docs')}
                    className="w-full flex items-center px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 mr-3 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    查看文档
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
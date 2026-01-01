/**
 * 公开路由组件
 * 
 * 功能：
 * 1. 处理不需要登录的公开页面
 * 2. 支持从公开页面跳转到登录页面
 */

import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Spin } from 'antd';
import { getFlatRoutes, COMPONENT_MAP } from '../constants/routes.js';

// 路由加载中组件
const RouteLoading = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px'
  }}>
    <Spin size="large" tip="页面加载中..." />
  </div>
);

/**
 * 公开路由管理器
 */
export default function PublicRoutes() {
  // 获取所有标记为公开的路由
  const publicRoutes = React.useMemo(() => {
    const allRoutes = getFlatRoutes();
    return allRoutes.filter(route => route.public && route.path && route.component);
  }, []);

  return (
    <Routes>
      {publicRoutes.map(route => {
        const Component = COMPONENT_MAP[route.component];

        if (!Component) {
          console.warn(`公开路由 ${route.id} 缺少组件配置`);
          return null;
        }

        return (
          <Route
            key={route.id}
            path={route.path}
            element={
              <Suspense fallback={<RouteLoading />}>
                <Component />
              </Suspense>
            }
          />
        );
      })}
    </Routes>
  );
}
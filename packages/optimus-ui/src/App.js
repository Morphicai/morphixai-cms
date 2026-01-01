import React, { useState, useEffect, useCallback, Suspense } from "react";
import { HashRouter as Router } from "react-router-dom";
import { Ability } from "@casl/ability";
import { Spin } from "antd";

import Panel from "./shared/components/Panel";
import Login from "./shared/components/Login";
import useAuth from "./shared/hooks/useAuth";
import { ThemeProvider } from "./theme/ThemeProvider";
// 传统路由相关导入已移除，现在只使用常量路由

import {
  GlobalProvider,
  GlobalConsumer,
} from "./shared/contexts/useGlobalContext";
import { CategoryProvider } from "./shared/contexts/CategoryContext";

// 导入新的基于常量的组件
import { FunctionalRouteManager } from "./router/RouteManager";
import PublicRoutes from "./router/PublicRoutes";
import { generateCASLRules, getMenuTree } from "./constants/routes.js";
import { globalPermissionManager } from "./utils/PermissionManager";

// 导入权限API
import { getUserPermissionCodes } from "./apis/permission";

const ability = new Ability();

// 系统现在默认使用常量路由方案

// 获取用户权限的函数
const getUserPermissions = async (userId, userType) => {
  try {
    // 如果用户信息不完整，返回空权限
    if (!userId && userType === undefined) {
      return [];
    }

    // 超级管理员直接返回所有权限
    if (userType === 0) {
      return ['*'];
    }

    // 从API获取用户权限
    const permissions = await getUserPermissionCodes();
    return permissions;
  } catch (error) {
    console.error('获取用户权限失败:', error);
    // 降级处理：返回基础权限
    return ['Dashboard'];
  }
};

const Routers = ({ shouldUpdate }) => {
  const [routes, setRoutes] = useState([]);
  const [userPermissions, setUserPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isLogin, userInfo } = useAuth();
  const location = window.location;

  // 新的基于常量的路由初始化
  const initConstantRoutes = useCallback(async () => {
    try {
      setIsLoading(true);

      // 获取用户权限
      const permissions = await getUserPermissions(userInfo?.id, userInfo?.type);

      // 生成CASL规则
      const calsRules = generateCASLRules(permissions);

      // 更新权限管理器
      globalPermissionManager.setUserPermissions(permissions);
      ability.update(calsRules);

      // 生成菜单树（包含动态文档路由）
      const menuTree = await getMenuTree(permissions);

      setUserPermissions(permissions);
      setRoutes(menuTree);
    } catch (error) {
      console.error('常量路由初始化失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userInfo]);

  // 传统路由初始化函数已移除，现在只使用常量路由

  // 使用useEffect来初始化路由
  useEffect(() => {
    // 同时检查 isLogin 和 userInfo 确保用户已登录且有有效的用户信息
    if (isLogin && userInfo && userInfo.username) {
      initConstantRoutes();
    }
  }, [isLogin, userInfo, shouldUpdate, initConstantRoutes]);

  // 如果访问的是公开页面，直接显示公开路由
  if (!isLogin) {
    // 检查当前路径是否为公开页面
    const currentPath = location.hash.replace('#', '') || '/';
    if (currentPath === '/help') {
      return <PublicRoutes />;
    }
    return <Login />;
  }

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <Spin size="large" tip="系统初始化中..." />
      </div>
    );
  }

  return (
    <Panel
      routes={routes}
      useConstantRoutes={true}
      userPermissions={userPermissions}
    >
      <Suspense fallback={<Spin size="large" tip="页面加载中..." />}>
        <FunctionalRouteManager userPermissions={userPermissions} />
      </Suspense>
    </Panel>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <GlobalProvider>
        <CategoryProvider>
          <Router>
            <GlobalConsumer>
              {(value) => <Routers {...value} />}
            </GlobalConsumer>
          </Router>
        </CategoryProvider>
      </GlobalProvider>
    </ThemeProvider>
  );
}

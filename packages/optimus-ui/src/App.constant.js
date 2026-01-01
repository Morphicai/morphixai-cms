/**
 * 基于常量的App组件
 * 
 * 完全使用常量配置的菜单和路由系统
 * - 菜单配置来自常量文件
 * - 路由配置来自常量文件
 * - 权限控制基于CASL
 * - 支持动态组件加载
 */

import React, { useState, useEffect, Suspense } from "react";
import { HashRouter as Router } from "react-router-dom";
import zhCN from "antd/locale/zh_CN";
import { ConfigProvider } from "antd";
import { Ability } from "@casl/ability";
import { Spin } from "antd";

import Panel from "./shared/components/Panel";
import Login from "./shared/components/Login";
import useAuth from "./shared/hooks/useAuth";

import {
  GlobalProvider,
  GlobalConsumer,
} from "./shared/contexts/useGlobalContext";

// 导入基于常量的组件
import { FunctionalRouteManager } from "./router/RouteManager";
import ConstantSiderMenus from "./shared/components/Panel/ConstantSiderMenus";
import { generateCASLRules, getMenuTree } from "./constants/routes";

// 创建CASL权限实例
const ability = new Ability();

// 全局加载组件
const GlobalLoading = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh'
  }}>
    <Spin size="large" tip="系统初始化中..." />
  </div>
);

/**
 * 获取用户权限（模拟API调用）
 */
const getUserPermissions = async (userId, userType) => {
  try {
    // 这里应该调用实际的API
    // const response = await fetch('/api/perm/user/codes');
    // const result = await response.json();
    // return result.success ? result.data : [];

    // 模拟数据 - 根据用户类型返回不同权限
    if (userType === 0) {
      // 超级管理员拥有所有权限
      return ['*'];
    } else {
      // 普通用户的权限示例
      return [
        'Dashboard',
        'PermUsers',
        'perm_users:edit',
        'perm_users:create',
        'PermRoles',
        'perm_roles:edit',
        'ContactUs',
        'Document'
      ];
    }
  } catch (error) {
    console.error('获取用户权限失败:', error);
    return [];
  }
};

/**
 * 主路由组件
 */
const MainRoutes = ({ shouldUpdate }) => {
  const [userPermissions, setUserPermissions] = useState([]);
  const [menuTree, setMenuTree] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isLogin, userInfo } = useAuth();

  // 初始化权限和菜单
  useEffect(() => {
    if (userInfo.username) {
      initializePermissions();
    }
  }, [userInfo, shouldUpdate, initializePermissions]);

  const initializePermissions = async () => {
    try {
      setIsLoading(true);

      // 获取用户权限
      const permissions = await getUserPermissions(userInfo?.id, userInfo?.type);
      console.log('用户权限:', permissions);

      // 生成CASL规则
      const calsRules = generateCASLRules(permissions);
      console.log('CASL规则:', calsRules);

      // 更新权限实例
      ability.update(calsRules);

      // 生成菜单树
      const menus = getMenuTree(permissions);
      console.log('菜单树:', menus);

      setUserPermissions(permissions);
      setMenuTree(menus);
    } catch (error) {
      console.error('权限初始化失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLogin) {
    return <Login />;
  }

  if (isLoading) {
    return <GlobalLoading />;
  }

  return (
    <Panel
      routes={menuTree}
      MenuComponent={ConstantSiderMenus}
      menuProps={{ userPermissions }}
    >
      <Suspense fallback={<GlobalLoading />}>
        <FunctionalRouteManager
          userPermissions={userPermissions}
        />
      </Suspense>
    </Panel>
  );
};

/**
 * 增强的Panel组件（支持自定义菜单组件）
 */
const EnhancedPanel = ({
  children,
  routes,
  MenuComponent = ConstantSiderMenus,
  menuProps = {}
}) => {
  return (
    <div className="app-layout">
      <div className="app-sider">
        <MenuComponent
          {...menuProps}
        />
      </div>
      <div className="app-content">
        {children}
      </div>
    </div>
  );
};

/**
 * 主App组件
 */
export default function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <GlobalProvider>
        <Router>
          <GlobalConsumer>
            {(value) => <MainRoutes {...value} />}
          </GlobalConsumer>
        </Router>
      </GlobalProvider>
    </ConfigProvider>
  );
}

/**
 * 开发环境调试组件
 */
export const DebugInfo = () => {
  const [debugData, setDebugData] = useState(null);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      import('./constants/routes').then(({ validateRouteConfig, getFlatRoutes }) => {
        const validation = validateRouteConfig();
        const routes = getFlatRoutes();

        setDebugData({
          validation,
          totalRoutes: routes.length,
          routesByType: validation.routesByType
        });
      });
    }
  }, []);

  if (process.env.NODE_ENV !== 'development' || !debugData) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>路由调试信息</h4>
      <p>总路由数: {debugData.totalRoutes}</p>
      <p>菜单: {debugData.routesByType.menus}</p>
      <p>按钮: {debugData.routesByType.buttons}</p>
      <p>配置有效: {debugData.validation.isValid ? '✅' : '❌'}</p>
      {debugData.validation.errors.length > 0 && (
        <div>
          <p>错误:</p>
          <ul>
            {debugData.validation.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
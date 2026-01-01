/**
 * 路由管理器 - 完全基于常量的路由系统
 * 
 * 功能：
 * 1. 根据用户权限动态生成路由
 * 2. 支持懒加载组件
 * 3. 支持路由权限控制
 * 4. 统一的路由配置管理
 */

import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Spin } from 'antd';
import { getReactRoutes, validateRouteConfig } from '../constants/routes.js';

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

// 404页面组件
const NotFound = () => (
  <div style={{
    textAlign: 'center',
    padding: '50px',
    fontSize: '16px',
    color: '#666'
  }}>
    <h2>404 - 页面不存在</h2>
    <p>您访问的页面不存在或您没有访问权限</p>
  </div>
);

/**
 * 路由管理器组件
 */
class RouteManager extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      routes: [],
      isLoading: true,
      error: null
    };
  }

  componentDidMount() {
    this.initializeRoutes();
  }

  componentDidUpdate(prevProps) {
    // 当用户权限发生变化时重新初始化路由
    if (prevProps.userPermissions !== this.props.userPermissions) {
      this.initializeRoutes();
    }
  }

  /**
   * 初始化路由
   */
  initializeRoutes = () => {
    try {
      // 验证路由配置
      const validation = validateRouteConfig();
      if (!validation.isValid) {
        console.error('路由配置验证失败:', validation.errors);
        this.setState({
          error: `路由配置错误: ${validation.errors.join(', ')}`,
          isLoading: false
        });
        return;
      }

      // 根据用户权限生成路由（使用固定路由，动态文档通过 /edit-doc/:id 处理）
      const { userPermissions = [] } = this.props;
      const routes = getReactRoutes(userPermissions);

      this.setState({
        routes,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('路由初始化失败:', error);
      this.setState({
        error: `路由初始化失败: ${error.message}`,
        isLoading: false
      });
    }
  };

  /**
   * 渲染单个路由
   */
  renderRoute = (route) => {
    const { component: Component, path, id } = route;

    if (!Component) {
      console.warn(`路由 ${id} 缺少组件配置`);
      return null;
    }

    return (
      <Route
        key={id}
        path={path}
        element={
          <Suspense fallback={<RouteLoading />}>
            <Component />
          </Suspense>
        }
      />
    );
  };

  render() {
    const { isLoading, error, routes } = this.state;
    const { fallbackComponent: FallbackComponent = NotFound } = this.props;

    if (isLoading) {
      return <RouteLoading />;
    }

    if (error) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '50px',
          color: 'red'
        }}>
          <h3>路由系统错误</h3>
          <p>{error}</p>
        </div>
      );
    }

    return (
      <Routes>
        {/* 渲染所有有权限的路由 */}
        {routes.map(this.renderRoute)}

        {/* 首页路由已经在routes中定义，无需额外重定向 */}

        {/* 404页面 */}
        <Route path="*" element={<FallbackComponent />} />
      </Routes>
    );
  }
}

/**
 * 路由管理器Hook版本
 */
export const useRouteManager = (userPermissions = []) => {
  const [routes, setRoutes] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    try {
      // 验证路由配置
      const validation = validateRouteConfig();
      if (!validation.isValid) {
        throw new Error(`路由配置错误: ${validation.errors.join(', ')}`);
      }

      // 根据用户权限生成路由（使用固定路由，动态文档通过 /edit-doc/:id 处理）
      const generatedRoutes = getReactRoutes(userPermissions);

      setRoutes(generatedRoutes);
      setError(null);
    } catch (err) {
      console.error('路由初始化失败:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userPermissions]);

  return { routes, isLoading, error };
};

/**
 * 函数式路由管理器组件
 */
export const FunctionalRouteManager = ({
  userPermissions = [],
  fallbackComponent: FallbackComponent = NotFound
}) => {
  const { routes, isLoading, error } = useRouteManager(userPermissions);

  if (isLoading) {
    return <RouteLoading />;
  }

  if (error) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '50px',
        color: 'red'
      }}>
        <h3>路由系统错误</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <Routes>
      {routes.map(route => {
        const { component: Component, path, id } = route;

        if (!Component) {
          console.warn(`路由 ${id} 缺少组件配置`);
          return null;
        }

        return (
          <Route
            key={id}
            path={path}
            element={
              <Suspense fallback={<RouteLoading />}>
                <Component />
              </Suspense>
            }
          />
        );
      })}

      {/* 404页面 */}
      <Route path="*" element={<FallbackComponent />} />
    </Routes>
  );
};

export default RouteManager;
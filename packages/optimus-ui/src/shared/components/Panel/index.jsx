import React, { useCallback, useState, createElement } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button, Layout } from "antd";
import { MenuUnfoldOutlined, MenuFoldOutlined } from "@ant-design/icons";
import Breadcrumb from "./Breadcrumb";
import SiderMenus from "./SiderMenus";
import ConstantSiderMenus from "./ConstantSiderMenus";
import Account from "./Account";
import ThemeSwitcher from "../../../components/ThemeSwitcher";
import { useTheme } from "../../../theme/useTheme";
import styles from "./styles.module.css";

import useAuth from "../../hooks/useAuth";

const { Header, Sider, Content } = Layout;

const APP_NAME = "OPTIMUS";

export default function Panel({
  children,
  routes = [],
  useConstantRoutes = false,
  userPermissions = []
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useAuth();
  const { theme } = useTheme();
  const _location = useLocation();
  const navigate = useNavigate();

  const toggle = useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed, setCollapsed]);

  // 选择使用哪个菜单组件
  const MenuComponent = useConstantRoutes ? ConstantSiderMenus : SiderMenus;
  const menuProps = useConstantRoutes
    ? { userPermissions }
    : {
      onSelect: ({ key }) => navigate(key),
      defaultSelectedKeys: [_location.pathname],
      menus: routes
    };

  return (
    <Layout className={styles.appLayout}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}
        style={{
          backgroundColor: theme.colors.bgPrimary,
          overflowY:'auto'
        }}
      >
        <div className={styles.logo}>
          {collapsed ? 'OP' : APP_NAME}
        </div>
        <div className={styles.menuScrollContainer}>
          <MenuComponent {...menuProps} />
        </div>
      </Sider>
      <Layout className={styles.siteLayout}>
        <Header
          className={styles.siteLayoutHeader}
          style={{ 
            backgroundColor: theme.colors.bgElevated,
            boxShadow: theme.shadows.sm,
          }}
        >
          <div>
            {createElement(
              collapsed ? MenuUnfoldOutlined : MenuFoldOutlined,
              {
                className: styles.trigger,
                onClick: toggle,
              },
            )}
          </div>
          <div className={styles.headerRight}>
            <ThemeSwitcher />
            <Button
              type="link"
              size="small"
            >
              <Account onLogout={logout} />
            </Button>
          </div>
        </Header>

        <div className={styles.mainScrollContainer}>
          <Breadcrumb
            routes={routes}
            className={styles.breadcrumb}
          />

          <Content
            className={styles.content}
            style={{
              backgroundColor: theme.colors.bgElevated,
              boxShadow: theme.shadows.sm,
            }}
          >
            {children}
          </Content>

          <footer className={styles.footer}>
            © {new Date().getFullYear()} OPTIMUS. All rights reserved.
          </footer>
        </div>
      </Layout>
    </Layout>
  );
}

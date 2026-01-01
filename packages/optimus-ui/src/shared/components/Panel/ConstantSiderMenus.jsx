/**
 * 基于常量的侧边栏菜单组件
 * 
 * 功能：
 * 1. 完全基于路由常量渲染菜单
 * 2. 支持权限控制
 * 3. 支持多级菜单
 * 4. 自动处理图标和路由
 */

import React from "react";
import { Menu } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { getMenuTree } from "../../../constants/routes.js";
import { useTheme } from "../../../theme/useTheme";

const { SubMenu } = Menu;

/**
 * 基于常量的菜单组件
 */
export default function ConstantSiderMenus({
  userPermissions = [],
  onSelect = () => { },
  ...otherProps
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const [menuTree, setMenuTree] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // 根据用户权限获取菜单树（包含动态文档菜单）
  React.useEffect(() => {
    const loadMenuTree = async () => {
      try {
        setIsLoading(true);
        const tree = await getMenuTree(userPermissions);
        setMenuTree(tree);
      } catch (error) {
        console.error('加载菜单失败:', error);
        setMenuTree([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadMenuTree();
  }, [userPermissions]);

  // 处理菜单点击
  const handleMenuClick = ({ key, keyPath }) => {
    // 查找对应的菜单项
    const findMenuByKey = (menus, targetKey) => {
      for (const menu of menus) {
        if (menu.id === targetKey) {
          return menu;
        }
        if (menu.children) {
          const found = findMenuByKey(menu.children, targetKey);
          if (found) return found;
        }
      }
      return null;
    };

    const menuItem = findMenuByKey(menuTree, key);
    if (menuItem && menuItem.path) {
      navigate(menuItem.path);
    }

    onSelect({ key, keyPath, menuItem });
  };

  // 获取当前选中的菜单key
  const getSelectedKeys = () => {
    const findKeyByPath = (menus, targetPath) => {
      for (const menu of menus) {
        if (menu.path === targetPath) {
          return menu.id;
        }
        if (menu.children) {
          const found = findKeyByPath(menu.children, targetPath);
          if (found) return found;
        }
      }
      return null;
    };

    const selectedKey = findKeyByPath(menuTree, location.pathname);
    return selectedKey ? [selectedKey] : [];
  };

  // 获取默认展开的菜单key
  const getDefaultOpenKeys = () => {
    const openKeys = [];
    const findParentKeys = (menus, targetPath, parentKeys = []) => {
      for (const menu of menus) {
        const currentKeys = [...parentKeys, menu.id];

        if (menu.path === targetPath) {
          openKeys.push(...parentKeys);
          return true;
        }

        if (menu.children) {
          if (findParentKeys(menu.children, targetPath, currentKeys)) {
            return true;
          }
        }
      }
      return false;
    };

    findParentKeys(menuTree, location.pathname);
    return openKeys;
  };

  // 渲染菜单项
  const renderMenuItem = (menu) => {
    const { id, name, icon, children } = menu;

    if (children && children.length > 0) {
      return (
        <SubMenu
          key={id}
          icon={icon}
          title={name}
        >
          {children.map(renderMenuItem)}
        </SubMenu>
      );
    }

    return (
      <Menu.Item key={id} icon={icon}>
        {name}
      </Menu.Item>
    );
  };

  if (isLoading) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#666'
      }}>
        菜单加载中...
      </div>
    );
  }

  if (!menuTree || menuTree.length === 0) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#666'
      }}>
        暂无可用菜单
      </div>
    );
  }

  return (
    <Menu
      theme={isDark ? "dark" : "light"}
      mode="inline"
      selectedKeys={getSelectedKeys()}
      defaultOpenKeys={getDefaultOpenKeys()}
      onClick={handleMenuClick}
      {...otherProps}
    >
      {menuTree.map(renderMenuItem)}
    </Menu>
  );
}
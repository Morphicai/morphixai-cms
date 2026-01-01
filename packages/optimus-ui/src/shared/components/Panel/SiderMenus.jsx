import { Menu } from "antd";
import { useTheme } from "../../../theme/useTheme";

const { SubMenu } = Menu;

export default function SiderMenus({
  onSelect = () => { },
  menus = [],
  ...otherProps
}) {
  const { isDark } = useTheme();
  
  // 确保 menus 是数组
  const safeMenus = Array.isArray(menus) ? menus : [];

  return (
    <Menu 
      theme={isDark ? "dark" : "light"} 
      mode="inline" 
      onSelect={onSelect} 
      {...otherProps}
    >
      {safeMenus
        .filter((route) => !route.displayNone)
        .map(({ path, icon, page, key = "", children = [] }, index) => {
          // 确保每个菜单项都有唯一的key
          const uniqueKey = path || key || `menu-${index}`;
          const safeChildren = Array.isArray(children) ? children : [];
          if (safeChildren.length) {

            return (
              <SubMenu key={uniqueKey} icon={icon} title={page}>
                {safeChildren.map((subMenu, subIndex) => {
                  // 确保子菜单项也有唯一的key
                  const subUniqueKey = subMenu.path || subMenu.key || `submenu-${index}-${subIndex}`;
                  return (
                    <Menu.Item key={subUniqueKey}>
                      {subMenu.page}
                    </Menu.Item>
                  );
                })}
              </SubMenu>
            );
          }
          return (
            <Menu.Item key={uniqueKey} icon={icon}>
              {page}
            </Menu.Item>
          );
        })}
    </Menu>
  );
}

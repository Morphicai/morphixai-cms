import Edit from "./document/views/Edit";
import DocumentNew from "./document-center";
import Contact from "./contact/views/Contact";
import Perm from "./perm";
import User from "./user/views";
import Setting from "./system/views/Setting";
import FilesView from "./files/views";
import { normalizeDynamicRoutes } from "../shared/helps/normalizeDynamicRoutes";
import permToCals from "../shared/helps/permToCasl";
import { getMenusFromDocument } from "../apis/document";
import { getAllMenu } from "../apis/user";
// 已废弃
// 前端路由
export const routesMap = [
  // Dashboard component removed - was using table-engine
  {
    path: "/sys/document",
    key: "Document",
    component: DocumentNew,
  },
  {
    code: "perm_users",
    key: "PermUsers",
    path: "/sys/user",
    component: User,
  },
  // Role component removed - was using table-engine
  {
    path: "/biz/contact",
    key: "ContactUs",
    component: Contact,
  },
  {
    key: "PermGroup",
  },
  {
    path: "/sys/perm",
    key: "Perm",
    component: Perm,
  },
  {
    key: "SystemSetting",
  },
  {
    key: "Files",
    path: "/sys/files",
    page: "文件管理",
    component: FilesView,
  },
];

export const initAsyncRoutes = async () => {
  const { routes, calsRules } = await getDynamicRoutes();
  const docResources = await getMenusFromDocument();

  // 不需要通过后台动态控制的菜单，可以在此处硬编码
  const rules = {
    calsRules,
    routes: [...routes].concat(
      // Test component removed - was using table-engine
      {
        path: "/sys/profile",
        page: "个人中心",
        component: Setting,
        displayNone: true,
        pid: "0",
      },

      {
        key: "config-center",
        page: "配置中心",
        component: Contact,
        pid: "0",
        children: (docResources?.data?.list || [])
          .filter((d) => Boolean(d.description))
          .map((doc) => {
            return {
              path: `/edit-doc/${doc.id}`,
              page: doc.description,
              component: Edit,
            };
          }),
      },
    ),
  };
  // 用于测试
  process.env.NODE_ENV === "development" &&
    rules.routes.push({
      key: "Files",
      path: "/sys/files",
      page: "文件管理",
      component: FilesView,
    });
  return rules;
};

async function getDynamicRoutes() {
  const { data = [] } = await getAllMenu();
  const calsJson = permToCals(data);
  return {
    calsRules: calsJson,
    routes: await normalizeDynamicRoutes(data, routesMap),
  };
}

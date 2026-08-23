import { request } from "../shared/utils/axios";

export const serviceOpsApi = {
  status: () => request({ type: "get", url: "/system/services/status" }),
  // 面板用法:不带 after,拿最近 N 条(降序)
  events: (limit = 30, type) =>
    request({ type: "get", url: "/system/events", data: { limit, type } }),
  // 服务目录(治理视角,ServiceOps 门)
  list: () => request({ type: "get", url: "/system/services" }),
  register: (data) => request({ type: "post", url: "/system/services", data, showTip: false }),
  update: (key, data) => request({ type: "put", url: `/system/services/${key}`, data, showTip: false }),
  remove: (key) => request({ type: "delete", url: `/system/services/${key}` }),
  // embed 入口条目(登录即可;动态菜单与嵌入页消费)
  entries: () => request({ type: "get", url: "/system/services/entries" }),
};


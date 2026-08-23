import { request } from "../shared/utils/axios";

export const serviceOpsApi = {
  status: () => request({ type: "get", url: "/system/services/status" }),
  // 面板用法:不带 after,拿最近 N 条(降序)
  events: (limit = 30, type) =>
    request({ type: "get", url: "/system/events", data: { limit, type } }),
};

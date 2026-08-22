import { request } from "../shared/utils/axios";

export const formApi = {
  list: (page = 1, pageSize = 50) =>
    request({ type: "get", url: "/form/list", data: { page, pageSize } }),
  create: (data) => request({ type: "post", url: "/form", data }),
  update: (id, data) => request({ type: "put", url: `/form/${id}`, data }),
  remove: (id) => request({ type: "delete", url: `/form/${id}` }),
  entries: (id, page = 1, pageSize = 20) =>
    request({ type: "get", url: `/form/${id}/entries`, data: { page, pageSize } }),
  // 模型生成慢,单独放宽超时
  generate: (description) =>
    request({ type: "post", url: "/form/generate", data: { description }, timeout: 140000, showTip: false }),
  // 公开接口(填报页用)
  getPublic: (slug) => request({ type: "get", url: `/public/form/${slug}`, showTip: false }),
  submitPublic: (slug, data) =>
    request({ type: "post", url: `/public/form/${slug}/entries`, data: { data }, showTip: false }),
};

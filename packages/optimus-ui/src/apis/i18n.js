import { request } from "../shared/utils/axios";

export const i18nApi = {
  namespaces: () => request({ type: "get", url: "/system/i18n/namespaces" }),
  entries: (namespace, page = 1, pageSize = 50, keyword) =>
    request({ type: "get", url: "/system/i18n/entries", data: { namespace, page, pageSize, keyword } }),
  create: (data) => request({ type: "post", url: "/system/i18n/entries", data, showTip: false }),
  update: (id, data) => request({ type: "put", url: `/system/i18n/entries/${id}`, data, showTip: false }),
  remove: (id) => request({ type: "delete", url: `/system/i18n/entries/${id}` }),
  // AI 补全是长操作(打包调一次模型),前端把超时放宽交给后端的 60s
  translate: (namespace, targetLocales, keys) =>
    request({ type: "post", url: "/system/i18n/translate", data: { namespace, targetLocales, keys }, showTip: false }),
};

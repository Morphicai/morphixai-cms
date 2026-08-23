import axios from "axios";
import { request } from "../shared/utils/axios";
import storage from "../shared/utils/storage";

export const i18nApi = {
  namespaces: () => request({ type: "get", url: "/system/i18n/namespaces" }),
  entries: (namespace, page = 1, pageSize = 50, keyword) =>
    request({ type: "get", url: "/system/i18n/entries", data: { namespace, page, pageSize, keyword } }),
  create: (data) => request({ type: "post", url: "/system/i18n/entries", data, showTip: false }),
  update: (id, data) => request({ type: "put", url: `/system/i18n/entries/${id}`, data, showTip: false }),
  remove: (id) => request({ type: "delete", url: `/system/i18n/entries/${id}` }),
  // AI 补全走 agent-service(翻译只有 Agent 一条实现路径)。
  // 不走全局 axios 实例:agent-service 有自己的鉴权,401 不应触发管理端 token 刷新
  translate: (namespace, targetLocales) =>
    axios.post(
      "/agent-api/run",
      {
        task: `把多语言命名空间 ${namespace} 里缺少 ${targetLocales.join("、")} 译文的键全部补上译文`,
        system: "你是多语言文案翻译助理。保持 UI 文案的简洁语气;键的备注是给你的上下文,不要写进译文。",
      },
      { headers: { Authorization: storage("access-token") || "" }, timeout: 6 * 60_000 },
    ),
};

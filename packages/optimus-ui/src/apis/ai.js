import { request } from "../shared/utils/axios";

/**
 * 智能辅助（文章模块）
 * action: summary | polish | continue
 */
export function aiAssist(action, text) {
  return request({
    type: "post",
    url: "/ai/assist",
    data: { action, text },
    // 模型生成慢,别用全局默认超时把正常请求掐了
    timeout: 70000,
    showTip: false,
  });
}

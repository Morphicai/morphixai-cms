/**
 * OneRouter → pi-ai Model 接线。
 * 三条 compat 配置是 morphicai-api 的 modelBridge 用真实流量踩出来的,原样继承:
 * 1. supportsDeveloperRole: false —— pi 的 detectCompat 不认识 llm.onerouter.pro,
 *    默认会把系统提示词发成 role:'developer',部分模型(如 deepseek 系)直接 400
 * 2. thinkingFormat: 'openrouter' —— OneRouter 是 OpenRouter 兼容网关,
 *    发 reasoning_effort 是静默无效,reasoning:{effort} 才生效
 * 3. maxTokens 只是元数据;真正的输出预算在 streamFn 的 options.maxTokens,
 *    不给的话大 prompt 会把输出预算挤到个位数且无诊断线索(见 runner 的 streamFn 包装)
 */
import type { Model } from "@earendil-works/pi-ai";

const BASE_URL = process.env.AI_BASE_URL || "https://llm.onerouter.pro/v1";
const MODEL_TAG = process.env.AI_MODEL || "google/gemini-3.1-flash-lite";

export const MAX_OUTPUT_TOKENS = 8000;

export function buildModel(): Model<"openai-completions"> {
    return {
        id: MODEL_TAG,
        name: MODEL_TAG,
        api: "openai-completions",
        provider: "onerouter",
        baseUrl: BASE_URL,
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: MAX_OUTPUT_TOKENS,
        compat: {
            supportsDeveloperRole: false,
            thinkingFormat: "openrouter",
        },
    } as Model<"openai-completions">;
}

/** key 只经环境变量,零落盘(与全仓约定一致) */
export function getApiKey(): string | undefined {
    return process.env.ONEROUTER_API_KEY;
}

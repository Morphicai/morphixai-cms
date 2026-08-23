/**
 * i18n 模块贡献给 Agent 的工具——声明跟着实现走,改端点时这份声明就在手边。
 * description 是给模型看的,写"什么时候用",不是给人看的接口文档。
 */
import { contributeAgentTools } from "../agent-tools/agent-tool-registry";

contributeAgentTools([
    {
        name: "i18n_list_namespaces",
        description: "列出全部多语言命名空间及各自的键数量。不需要参数。",
        params: [],
        method: "GET",
        path: "/system/i18n/namespaces",
    },
    {
        name: "i18n_list_missing",
        description: "列出某命名空间在指定语言下缺少译文的键,返回每个键的 zh-CN 源文与备注。翻译任务先用它了解要翻什么。",
        params: [
            { key: "namespace", type: "string", required: true, description: "命名空间,如 portal" },
            { key: "locale", type: "string", required: true, description: "目标语言代码,如 fr-FR" },
        ],
        method: "GET",
        path: "/system/i18n/missing?namespace={namespace}&locale={locale}",
    },
    {
        name: "i18n_write_translation",
        description: "为一个键写入指定语言的译文。只能补缺失——键在该语言已有译文时会被拒绝。一次写一条。",
        params: [
            { key: "namespace", type: "string", required: true, description: "命名空间" },
            { key: "key", type: "string", required: true, description: "文案键,如 hero.title" },
            { key: "locale", type: "string", required: true, description: "目标语言代码" },
            { key: "text", type: "string", required: true, description: "译文文本" },
        ],
        method: "PUT",
        path: "/system/i18n/translation",
    },
]);

/** 字典/数据集合模块贡献给 Agent 的工具 */
import { contributeAgentTools } from "../agent-tools/agent-tool-registry";

contributeAgentTools([
    {
        name: "collection_list",
        description: "读取一个公开数据集合的全部行(如 site-features 官网卡片、demo-activity-config 活动配置)。",
        params: [
            { key: "collection", type: "string", required: true, description: "集合名,如 site-features" },
        ],
        method: "GET",
        path: "/api/dictionary/{collection}",
    },
]);

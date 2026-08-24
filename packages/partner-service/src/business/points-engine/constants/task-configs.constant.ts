import { TaskType } from "../enums/task-type.enum";
import { PointRuleType } from "../enums/point-rule-type.enum";
import { TaskConfig } from "../types/task-config.type";

/**
 * 任务配置常量列表
 * 所有任务定义都在这里维护
 */
export const TASK_CONFIGS: TaskConfig[] = [
    // ==================== 合伙人任务 ====================
    {
        taskCode: "REGISTER_V1",
        taskType: TaskType.REGISTER,
        triggerEventType: "partner.register_self",
        pointRule: {
            type: PointRuleType.FIXED,
            value: 300, // 自己获得的积分
        },
        maxCompletionCount: 1, // 注册任务只能完成一次
        enabled: true,
        description: "用户注册成为合伙人奖励",
    },
    {
        taskCode: "INVITE_V1",
        taskType: TaskType.INVITE_SUCCESS,
        triggerEventType: "partner.register_downline_L1",
        pointRule: {
            type: PointRuleType.FIXED,
            value: 300,
        },
        maxCompletionCount: 50, // 最多邀请 50 人
        enabled: true,
        description: "邀请团队成员注册奖励（团队活跃度积分）",
    },

    // ==================== 游戏行为任务（示例） ====================
    // 以下任务通过 C 端调用 /api/biz/points/notify 接口触发
    {
        taskCode: "GAME_LEVEL_UP_10",
        taskType: TaskType.GAME_ACTION,
        triggerEventType: "game_action",
        pointRule: {
            type: PointRuleType.FIXED,
            value: 50,
        },
        maxCompletionCount: 1, // 每个等级只能完成一次
        enabled: true,
        description: "角色升级到10级",
    },
    {
        taskCode: "GAME_LEVEL_UP_50",
        taskType: TaskType.GAME_ACTION,
        triggerEventType: "game_action",
        pointRule: {
            type: PointRuleType.FIXED,
            value: 200,
        },
        maxCompletionCount: 1, // 每个等级只能完成一次
        enabled: true,
        description: "角色升级到50级",
    },
    {
        taskCode: "FIRST_RECHARGE",
        taskType: TaskType.GAME_ACTION,
        triggerEventType: "game_action",
        pointRule: {
            type: PointRuleType.FIXED,
            value: 500,
        },
        maxCompletionCount: 1, // 只能完成一次
        enabled: true,
        description: "首次充值",
    },
    {
        taskCode: "FIRST_DUNGEON_CLEAR",
        taskType: TaskType.GAME_ACTION,
        triggerEventType: "game_action",
        pointRule: {
            type: PointRuleType.FIXED,
            value: 100,
        },
        maxCompletionCount: 1, // 只能完成一次
        enabled: true,
        description: "首次通关副本",
    },

    // ==================== 外部任务（人工审核） ====================
    // 外部任务通过审核后触发，积分值由审核时动态传入
    {
        taskCode: "EXTERNAL_TASK_V1",
        taskType: TaskType.EXTERNAL_TASK,
        triggerEventType: "external_task.approved",
        pointRule: {
            type: PointRuleType.FIXED,
            value: 0, // 实际积分由业务参数传入
        },
        maxCompletionCount: 0, // 外部任务的次数限制由外部任务配置控制
        enabled: true,
        description: "外部任务审核通过奖励",
    },
];

/**
 * 根据任务代码获取任务配置
 */
export function getTaskConfigByCode(taskCode: string): TaskConfig | undefined {
    return TASK_CONFIGS.find((config) => config.taskCode === taskCode);
}

/**
 * 根据事件类型获取启用的任务配置列表
 */
export function getEnabledTaskConfigsByEventType(eventType: string): TaskConfig[] {
    return TASK_CONFIGS.filter((config) => config.triggerEventType === eventType && config.enabled);
}

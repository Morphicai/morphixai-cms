import { ExternalTaskType } from "../enums/external-task-type.enum";

/**
 * 外部任务配置接口
 */
export interface ExternalTaskConfig {
    /** 任务类型 */
    taskType: ExternalTaskType;
    /** 任务分类（用于前端分组展示） */
    category: string;
    /** 任务来源/行为 */
    source: string;
    /** 任务名称 */
    name: string;
    /** 任务描述（触发条件） */
    description: string;
    /** 奖励积分 */
    pointsReward: number;
    /** 频率/上限 */
    maxCompletionCount: number;
    /** 按钮文本 */
    buttonText: string;
    /** 跳转链接（可选，用于外部跳转） */
    actionUrl?: string;
    /** 是否需要链接 */
    requireLink: boolean;
    /** 是否需要图片 */
    requireImages: boolean;
    /** 最少图片数量 */
    minImages?: number;
    /** 最多图片数量 */
    maxImages?: number;
    /** 排序权重（数字越小越靠前） */
    sortOrder: number;
    /** 是否启用 */
    enabled: boolean;
}

/**
 * 外部任务配置列表
 */
export const EXTERNAL_TASK_CONFIGS: ExternalTaskConfig[] = [
    // 原有任务类型（保留但不在主列表展示）
    {
        taskType: ExternalTaskType.SOCIAL_SHARE,
        category: "其他",
        source: "社交媒体分享",
        name: "社交媒体分享",
        description: "在社交媒体（Twitter、Facebook等）分享游戏内容",
        pointsReward: 50,
        maxCompletionCount: 0,
        buttonText: "点击跳转",
        requireLink: true,
        requireImages: true,
        minImages: 1,
        maxImages: 5,
        sortOrder: 100,
        enabled: false, // 暂时禁用
    },
    {
        taskType: ExternalTaskType.CONTENT_CREATION,
        category: "其他",
        source: "内容创作",
        name: "内容创作",
        description: "创作游戏相关视频或文章",
        pointsReward: 200,
        maxCompletionCount: 0,
        buttonText: "点击跳转",
        requireLink: true,
        requireImages: false,
        sortOrder: 101,
        enabled: false, // 暂时禁用
    },
    {
        taskType: ExternalTaskType.COMMUNITY_ACTIVITY,
        category: "其他",
        source: "社区活动",
        name: "社区活动参与",
        description: "参与官方社区活动",
        pointsReward: 100,
        maxCompletionCount: 0,
        buttonText: "点击跳转",
        requireLink: false,
        requireImages: true,
        minImages: 1,
        maxImages: 3,
        sortOrder: 102,
        enabled: false, // 暂时禁用
    },
    {
        taskType: ExternalTaskType.FEEDBACK_SUBMIT,
        category: "其他",
        source: "反馈提交",
        name: "反馈提交",
        description: "提交游戏改进建议或bug反馈",
        pointsReward: 30,
        maxCompletionCount: 0,
        buttonText: "点击跳转",
        requireLink: false,
        requireImages: false,
        sortOrder: 103,
        enabled: false, // 暂时禁用
    },
    // 外部专项激励任务
    {
        taskType: ExternalTaskType.DOUYIN_SHORT_VIDEO,
        category: "外部专项激励",
        source: "抖音短视频",
        name: "抖音短视频",
        description: "通过任意链接发表视频",
        pointsReward: 2000,
        maxCompletionCount: 10,
        buttonText: "点击跳转",
        actionUrl: "https://www.douyin.com", // 抖音官网
        requireLink: true,
        requireImages: true,
        minImages: 1,
        maxImages: 5,
        sortOrder: 1,
        enabled: true,
    },
    {
        taskType: ExternalTaskType.DOUYIN_LIVE_30MIN,
        category: "外部专项激励",
        source: "抖音直播",
        name: "抖音直播（30分钟）",
        description: "抖音定账号直播累计>30小时并符合任务链接",
        pointsReward: 150000,
        maxCompletionCount: 1,
        buttonText: "点击跳转",
        actionUrl: "https://www.douyin.com",
        requireLink: true,
        requireImages: true,
        minImages: 1,
        maxImages: 5,
        sortOrder: 2,
        enabled: true,
    },
    {
        taskType: ExternalTaskType.DOUYIN_LIVE_50MIN,
        category: "外部专项激励",
        source: "抖音直播",
        name: "抖音直播（50分钟）",
        description: "抖音定账号直播累计>50小时并符合任务链接",
        pointsReward: 300000,
        maxCompletionCount: 1,
        buttonText: "点击跳转",
        actionUrl: "https://www.douyin.com",
        requireLink: true,
        requireImages: true,
        minImages: 1,
        maxImages: 5,
        sortOrder: 3,
        enabled: true,
    },
    {
        taskType: ExternalTaskType.DOUYIN_LIVE_100MIN,
        category: "外部专项激励",
        source: "抖音直播",
        name: "抖音直播（100分钟）",
        description: "抖音级定账号直播累计>100小时并符合任务链接",
        pointsReward: 500000,
        maxCompletionCount: 1,
        buttonText: "点击跳转",
        actionUrl: "https://www.douyin.com",
        requireLink: true,
        requireImages: true,
        minImages: 1,
        maxImages: 5,
        sortOrder: 4,
        enabled: true,
    },
    {
        taskType: ExternalTaskType.MANYI_DRIVER_VERIFY,
        category: "外部专项激励",
        source: "满溢司机身份认证",
        name: "满溢司机身份认证",
        description: "用户上传满溢司机身份认证并通过平台核验",
        pointsReward: 500000,
        maxCompletionCount: 1,
        buttonText: "点击认证",
        requireLink: false,
        requireImages: true,
        minImages: 1,
        maxImages: 5,
        sortOrder: 5,
        enabled: true,
    },
    {
        taskType: ExternalTaskType.KUAIDI_COURIER_VERIFY,
        category: "外部专项激励",
        source: "快递小哥身份认证",
        name: "快递小哥身份认证",
        description: "用户上传快递平台身份认证并通过平台核验",
        pointsReward: 500000,
        maxCompletionCount: 1,
        buttonText: "点击认证",
        requireLink: false,
        requireImages: true,
        minImages: 1,
        maxImages: 5,
        sortOrder: 6,
        enabled: true,
    },
];

/**
 * 根据任务类型获取配置
 */
export function getExternalTaskConfig(taskType: ExternalTaskType): ExternalTaskConfig | undefined {
    return EXTERNAL_TASK_CONFIGS.find((config) => config.taskType === taskType);
}

/**
 * 获取所有启用的任务类型
 */
export function getEnabledExternalTaskConfigs(): ExternalTaskConfig[] {
    return EXTERNAL_TASK_CONFIGS.filter((config) => config.enabled);
}

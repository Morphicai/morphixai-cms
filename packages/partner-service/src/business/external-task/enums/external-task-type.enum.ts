/**
 * 外部任务类型枚举
 */
export enum ExternalTaskType {
    /** 社交媒体分享 */
    SOCIAL_SHARE = "SOCIAL_SHARE",
    /** 内容创作 */
    CONTENT_CREATION = "CONTENT_CREATION",
    /** 社区活动 */
    COMMUNITY_ACTIVITY = "COMMUNITY_ACTIVITY",
    /** 反馈提交 */
    FEEDBACK_SUBMIT = "FEEDBACK_SUBMIT",
    /** 抖音短视频 */
    DOUYIN_SHORT_VIDEO = "DOUYIN_SHORT_VIDEO",
    /** 抖音直播（30分钟） */
    DOUYIN_LIVE_30MIN = "DOUYIN_LIVE_30MIN",
    /** 抖音直播（50分钟） */
    DOUYIN_LIVE_50MIN = "DOUYIN_LIVE_50MIN",
    /** 抖音直播（100分钟） */
    DOUYIN_LIVE_100MIN = "DOUYIN_LIVE_100MIN",
    /** 满溢司机身份认证 */
    MANYI_DRIVER_VERIFY = "MANYI_DRIVER_VERIFY",
    /** 快递小哥身份认证 */
    KUAIDI_COURIER_VERIFY = "KUAIDI_COURIER_VERIFY",
}

/**
 * 活动类型枚举
 * 简化版本，只保留奖励发放记录需要的类型
 */
export enum ActivityType {
    /** 充值返利活动 */
    RECHARGE_REBATE = "recharge_rebate",
    
    /** 每日签到活动 */
    DAILY_CHECKIN = "daily_checkin",
    
    /** 任务完成奖励 */
    TASK_REWARD = "task_reward",
    
    /** 其他活动 */
    OTHER = "other",
}
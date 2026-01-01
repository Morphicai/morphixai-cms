/**
 * 奖励领取状态枚举
 */
export enum RewardClaimStatus {
    /** 领取中 */
    CLAIMING = "claiming",
    /** 已发放 */
    CLAIMED = "claimed",
    /** 领取失败 */
    FAILED = "failed",
}

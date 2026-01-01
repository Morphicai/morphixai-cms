/**
 * 提交状态枚举
 */
export enum SubmissionStatus {
    /** 待审核 */
    PENDING = "PENDING",
    /** 审核通过 */
    APPROVED = "APPROVED",
    /** 审核拒绝 */
    REJECTED = "REJECTED",
}

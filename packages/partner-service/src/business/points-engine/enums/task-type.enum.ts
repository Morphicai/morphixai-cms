/**
 * 任务类型枚举
 */
export enum TaskType {
    /** 注册任务 */
    REGISTER = "REGISTER",
    /** 邀请成功任务 */
    INVITE_SUCCESS = "INVITE_SUCCESS",
    /** 通用游戏任务（如升级、充值等） */
    GAME_ACTION = "GAME_ACTION",
    /** 外部任务（需要人工审核） */
    EXTERNAL_TASK = "EXTERNAL_TASK",
}

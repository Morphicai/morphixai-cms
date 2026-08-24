import { TaskType } from "../enums/task-type.enum";
import { TaskConfig } from "../types/task-config.type";

/**
 * 任务处理结果
 */
export interface TaskHandlerResult {
    /** 是否通过校验 */
    isValid: boolean;
    /** 获得积分的合伙人ID */
    partnerId: string;
    /** 获得积分的用户ID（冗余） */
    uid: string;
    /** 相关合伙人ID（如被邀请人） */
    relatedPartnerId?: string;
    /** 相关用户ID（如被邀请人，冗余） */
    relatedUid?: string;
    /** 业务参数 */
    businessParams?: Record<string, any>;
    /** 失败原因 */
    reason?: string;
}

/**
 * 任务类型处理器接口
 */
export interface ITaskHandler {
    /** 处理器支持的任务类型 */
    readonly taskType: TaskType;

    /**
     * 处理任务事件
     * @param event 领域事件
     * @param config 任务配置
     * @returns 处理结果
     */
    handle(event: any, config: TaskConfig): Promise<TaskHandlerResult>;
}

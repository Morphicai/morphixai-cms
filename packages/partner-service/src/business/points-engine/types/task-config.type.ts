import { TaskType } from "../enums/task-type.enum";
import { PointRule } from "./point-rule.type";

/**
 * 任务配置
 */
export interface TaskConfig {
    /** 任务代码（唯一标识） */
    taskCode: string;
    /** 任务类型 */
    taskType: TaskType;
    /** 触发事件类型 */
    triggerEventType: string;
    /** 积分规则 */
    pointRule: PointRule;
    /** 是否启用 */
    enabled: boolean;
    /** 任务描述 */
    description?: string;
    /** 最大完成次数（0 或 undefined 表示无限制） */
    maxCompletionCount?: number;
}

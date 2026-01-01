import { Injectable, Logger } from "@nestjs/common";
import { TaskType } from "../enums/task-type.enum";
import { ITaskHandler, TaskHandlerResult } from "../interfaces/task-handler.interface";
import { TaskConfig } from "../types/task-config.type";

/**
 * 外部任务事件载荷
 */
export interface ExternalTaskEventPayload {
    submissionId: string;
    partnerId: string;
    uid: string;
    taskType: string;
    pointsReward: number;
    timestamp: number;
}

/**
 * 外部任务处理器
 */
@Injectable()
export class ExternalTaskHandler implements ITaskHandler {
    private readonly logger = new Logger(ExternalTaskHandler.name);
    readonly taskType = TaskType.EXTERNAL_TASK;

    async handle(event: ExternalTaskEventPayload, config: TaskConfig): Promise<TaskHandlerResult> {
        this.logger.log(
            `处理外部任务: submissionId=${event.submissionId}, partnerId=${event.partnerId}, taskType=${event.taskType}`,
        );

        // 外部任务已经通过审核，次数限制在外部任务模块中已经检查过
        // 这里直接返回成功
        return {
            isValid: true,
            partnerId: event.partnerId,
            uid: event.uid,
            businessParams: {
                submissionId: event.submissionId,
                externalTaskType: event.taskType,
                pointsReward: event.pointsReward,
            },
        };
    }
}

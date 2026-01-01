import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TaskType } from "../enums/task-type.enum";
import { TaskStatus } from "../enums/task-status.enum";
import { ITaskHandler, TaskHandlerResult } from "../interfaces/task-handler.interface";
import { TaskCompletionLogEntity } from "../entities/task-completion-log.entity";
import { TaskConfig } from "../types/task-config.type";

/**
 * 游戏行为任务事件接口
 */
export interface GameActionEventPayload {
    taskCode: string;
    partnerId: string;
    partnerCode: string;
    uid: string;
    timestamp: number;
    businessParams: Record<string, any>;
}

/**
 * 游戏行为任务处理器
 * 处理游戏内的各种行为任务（如升级、充值、完成副本等）
 */
@Injectable()
export class GameActionTaskHandler implements ITaskHandler {
    private readonly logger = new Logger(GameActionTaskHandler.name);
    readonly taskType = TaskType.GAME_ACTION;

    constructor(
        @InjectRepository(TaskCompletionLogEntity)
        private readonly taskLogRepository: Repository<TaskCompletionLogEntity>,
    ) {}

    async handle(event: GameActionEventPayload, config: TaskConfig): Promise<TaskHandlerResult> {
        this.logger.log(`处理游戏行为任务: taskCode=${event.taskCode}, partnerId=${event.partnerId}, uid=${event.uid}`);

        // 检查次数限制
        if (config.maxCompletionCount && config.maxCompletionCount > 0) {
            const completedCount = await this.taskLogRepository.count({
                where: {
                    taskCode: config.taskCode,
                    partnerId: event.partnerId,
                    status: TaskStatus.COMPLETED,
                },
            });

            if (completedCount >= config.maxCompletionCount) {
                this.logger.warn(
                    `游戏行为任务已达到上限: taskCode=${config.taskCode}, partnerId=${event.partnerId}, ` +
                        `completedCount=${completedCount}, maxCount=${config.maxCompletionCount}`,
                );
                return {
                    isValid: false,
                    partnerId: event.partnerId,
                    uid: event.uid,
                    reason: `任务已达到上限（${config.maxCompletionCount}次）`,
                };
            }
        }

        return {
            isValid: true,
            partnerId: event.partnerId,
            uid: event.uid,
            businessParams: event.businessParams,
        };
    }
}

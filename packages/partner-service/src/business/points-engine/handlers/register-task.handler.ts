import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TaskType } from "../enums/task-type.enum";
import { TaskStatus } from "../enums/task-status.enum";
import { ITaskHandler, TaskHandlerResult } from "../interfaces/task-handler.interface";
import { RegisterSelfEventPayload } from "../../partner/events/partner-event.dto";
import { TaskCompletionLogEntity } from "../entities/task-completion-log.entity";
import { TaskConfig } from "../types/task-config.type";

/**
 * 注册任务处理器
 * 处理用户加入合伙人计划时的积分奖励
 * - 只给自己发放积分（由 pointRule.value 配置）
 */
@Injectable()
export class RegisterTaskHandler implements ITaskHandler {
    private readonly logger = new Logger(RegisterTaskHandler.name);
    readonly taskType = TaskType.REGISTER;

    constructor(
        @InjectRepository(TaskCompletionLogEntity)
        private readonly taskLogRepository: Repository<TaskCompletionLogEntity>,
    ) {}

    async handle(event: RegisterSelfEventPayload, config: TaskConfig): Promise<TaskHandlerResult> {
        this.logger.log(`处理注册任务: partnerId=${event.partnerId}, uid=${event.uid}`);

        // 检查次数限制（注册任务理论上只能完成一次）
        if (config.maxCompletionCount && config.maxCompletionCount > 0) {
            const completedCount = await this.taskLogRepository.count({
                where: {
                    taskCode: config.taskCode,
                    partnerId: event.partnerId,
                    status: TaskStatus.COMPLETED,
                },
            });

            if (completedCount >= config.maxCompletionCount) {
                this.logger.warn(`注册任务已完成: partnerId=${event.partnerId}, completedCount=${completedCount}`);
                return {
                    isValid: false,
                    partnerId: event.partnerId,
                    uid: event.uid,
                    reason: "注册任务已完成",
                };
            }
        }

        return {
            isValid: true,
            partnerId: event.partnerId,
            uid: event.uid,
            businessParams: {
                partnerCode: event.partnerCode,
                registerTime: event.timestamp, // 用户注册时间（毫秒时间戳）
            },
        };
    }
}

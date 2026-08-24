import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TaskType } from "../enums/task-type.enum";
import { TaskStatus } from "../enums/task-status.enum";
import { ITaskHandler, TaskHandlerResult } from "../interfaces/task-handler.interface";
import { RegisterDownlineL1EventPayload } from "../../partner/events/partner-event.dto";
import { TaskCompletionLogEntity } from "../entities/task-completion-log.entity";
import { TaskConfig } from "../types/task-config.type";

/**
 * 邀请任务处理器
 */
@Injectable()
export class InviteTaskHandler implements ITaskHandler {
    private readonly logger = new Logger(InviteTaskHandler.name);
    readonly taskType = TaskType.INVITE_SUCCESS;

    constructor(
        @InjectRepository(TaskCompletionLogEntity)
        private readonly taskLogRepository: Repository<TaskCompletionLogEntity>,
    ) {}

    async handle(event: RegisterDownlineL1EventPayload, config: TaskConfig): Promise<TaskHandlerResult> {
        this.logger.log(
            `处理邀请任务: inviterPartnerId=${event.partnerId}, downlinePartnerId=${event.downlinePartnerId}`,
        );

        // 1. 检查任务完成次数限制
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
                    `邀请任务已达到上限: inviterPartnerId=${event.partnerId}, ` +
                        `completedCount=${completedCount}, maxCount=${config.maxCompletionCount}`,
                );
                return {
                    isValid: false,
                    partnerId: event.partnerId,
                    uid: event.uid,
                    reason: `邀请任务已达到上限（${config.maxCompletionCount}次）`,
                };
            }
        }

        // 2. 校验：确保同一邀请对 (inviterPartnerId, downlinePartnerId) 没有被奖励过
        const existingLog = await this.taskLogRepository.findOne({
            where: {
                taskCode: config.taskCode, // ✅ 使用 taskCode 而不是 taskType
                partnerId: event.partnerId,
                relatedPartnerId: event.downlinePartnerId,
            },
        });

        if (existingLog) {
            this.logger.warn(
                `邀请关系已奖励过: taskCode=${config.taskCode}, inviterPartnerId=${event.partnerId}, downlinePartnerId=${event.downlinePartnerId}`,
            );
            return {
                isValid: false,
                partnerId: event.partnerId,
                uid: event.uid,
                reason: "邀请关系已奖励",
            };
        }

        return {
            isValid: true,
            partnerId: event.partnerId,
            uid: event.uid,
            relatedPartnerId: event.downlinePartnerId,
            relatedUid: event.downlineUid,
            businessParams: {
                inviterPartnerCode: event.partnerCode,
                downlinePartnerCode: event.downlinePartnerCode,
                sourceChannelId: event.sourceChannelId,
                inviteTime: event.timestamp, // 邀请成功时间（毫秒时间戳）
            },
        };
    }
}

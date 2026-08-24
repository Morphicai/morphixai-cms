import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OnEvent } from "@nestjs/event-emitter";
import { TaskCompletionLogEntity } from "../entities/task-completion-log.entity";
import { TaskStatus } from "../enums/task-status.enum";
import { ITaskHandler } from "../interfaces/task-handler.interface";
import { getEnabledTaskConfigsByEventType } from "../constants/task-configs.constant";
import { RegisterSelfEventPayload, RegisterDownlineL1EventPayload } from "../../partner/events/partner-event.dto";
import { PointsCacheService } from "./points-cache.service";

/**
 * 任务引擎服务
 * 负责监听领域事件，触发任务完成逻辑
 */
@Injectable()
export class TaskEngineService {
    private readonly logger = new Logger(TaskEngineService.name);
    private readonly handlerMap = new Map<string, ITaskHandler>();

    constructor(
        @InjectRepository(TaskCompletionLogEntity)
        private readonly taskLogRepository: Repository<TaskCompletionLogEntity>,
        private readonly pointsCacheService: PointsCacheService,
    ) {}

    /**
     * 注册任务处理器
     */
    registerHandler(handler: ITaskHandler): void {
        this.handlerMap.set(handler.taskType, handler);
        this.logger.log(`注册任务处理器: ${handler.taskType}`);
    }

    /**
     * 监听合伙人注册事件
     */
    @OnEvent("partner.register_self")
    async handleRegisterSelfEvent(payload: RegisterSelfEventPayload): Promise<void> {
        this.logger.log(`收到事件: partner.register_self, partnerId=${payload.partnerId}`);
        await this.processEvent("partner.register_self", payload);
    }

    /**
     * 监听一级下线注册事件
     */
    @OnEvent("partner.register_downline_L1")
    async handleRegisterDownlineL1Event(payload: RegisterDownlineL1EventPayload): Promise<void> {
        this.logger.log(
            `收到事件: partner.register_downline_L1, partnerId=${payload.partnerId}, downlinePartnerId=${payload.downlinePartnerId}`,
        );
        await this.processEvent("partner.register_downline_L1", payload);
    }

    /**
     * 处理事件
     */
    private async processEvent(eventType: string, event: any): Promise<void> {
        // 获取匹配的任务配置
        const taskConfigs = getEnabledTaskConfigsByEventType(eventType);

        if (taskConfigs.length === 0) {
            this.logger.log(`事件 ${eventType} 没有匹配的任务配置`);
            return;
        }

        this.logger.log(`事件 ${eventType} 匹配到 ${taskConfigs.length} 个任务配置`);

        // 处理每个匹配的任务
        for (const config of taskConfigs) {
            try {
                await this.processTask(config.taskCode, config.taskType, eventType, event);
            } catch (error) {
                this.logger.error(`处理任务失败: taskCode=${config.taskCode}, error=${error.message}`, error.stack);
            }
        }
    }

    /**
     * 处理单个任务
     */
    private async processTask(taskCode: string, taskType: string, eventType: string, event: any): Promise<void> {
        // 获取任务配置
        const taskConfigs = getEnabledTaskConfigsByEventType(eventType);
        const config = taskConfigs.find((c) => c.taskCode === taskCode);

        if (!config) {
            this.logger.warn(`未找到任务配置: taskCode=${taskCode}`);
            return;
        }

        // 获取对应的任务处理器
        const handler = this.handlerMap.get(taskType);
        if (!handler) {
            this.logger.warn(`未找到任务类型 ${taskType} 的处理器`);
            return;
        }

        // 生成事件ID（用于幂等）
        const eventId = this.generateEventId(event);

        // 调用处理器进行业务校验，传入 config
        const result = await handler.handle(event, config);

        if (!result.isValid) {
            this.logger.log(`任务校验失败: taskCode=${taskCode}, reason=${result.reason}`);
            return;
        }

        // 幂等检查
        const existingLog = await this.taskLogRepository.findOne({
            where: {
                taskCode,
                partnerId: result.partnerId,
                eventId,
            },
        });

        if (existingLog) {
            this.logger.log(
                `任务已完成，跳过: taskCode=${taskCode}, partnerId=${result.partnerId}, eventId=${eventId}`,
            );
            return;
        }

        // 写入任务完成日志
        const log = this.taskLogRepository.create({
            taskCode,
            taskType: taskType as any,
            partnerId: result.partnerId,
            uid: result.uid,
            relatedPartnerId: result.relatedPartnerId || null,
            relatedUid: result.relatedUid || null,
            eventType,
            eventId,
            businessParams: result.businessParams || null,
            status: TaskStatus.COMPLETED,
        });

        await this.taskLogRepository.save(log);

        this.logger.log(
            `任务完成日志已记录: taskCode=${taskCode}, partnerId=${result.partnerId}, uid=${result.uid}, logId=${log.id}`,
        );

        // 使该用户的积分缓存失效
        this.pointsCacheService.invalidateUserCache(result.partnerId);
    }

    /**
     * 处理游戏行为任务事件（由C端通知接口调用）
     * 通过正常的 Handler 流程处理，而不是直接写入数据库
     */
    async processGameActionEvent(event: {
        taskCode: string;
        partnerId: string;
        partnerCode: string;
        uid: string;
        timestamp: number;
        businessParams: Record<string, any>;
    }): Promise<void> {
        this.logger.log(`收到游戏行为任务事件: taskCode=${event.taskCode}, partnerId=${event.partnerId}`);

        // 查找匹配的任务配置
        const taskConfigs = getEnabledTaskConfigsByEventType("game_action");

        // 过滤出匹配 taskCode 的配置
        const matchedConfig = taskConfigs.find((config) => config.taskCode === event.taskCode);

        if (!matchedConfig) {
            this.logger.warn(`未找到任务配置: taskCode=${event.taskCode}`);
            throw new Error(`任务代码无效: ${event.taskCode}`);
        }

        this.logger.log(`找到任务配置: taskCode=${event.taskCode}, taskType=${matchedConfig.taskType}`);

        // 通过正常的任务处理流程
        await this.processTask(matchedConfig.taskCode, matchedConfig.taskType, "game_action", event);
    }

    /**
     * 处理外部任务审核通过事件
     * 由外部任务模块在审核通过时调用
     */
    async processExternalTaskEvent(event: {
        submissionId: string;
        partnerId: string;
        uid: string;
        taskType: string;
        pointsReward: number;
        timestamp: number;
    }): Promise<string> {
        this.logger.log(`收到外部任务审核通过事件: submissionId=${event.submissionId}, partnerId=${event.partnerId}`);

        // 查找外部任务配置
        const taskConfigs = getEnabledTaskConfigsByEventType("external_task.approved");

        if (taskConfigs.length === 0) {
            this.logger.warn("未找到外部任务配置");
            throw new Error("外部任务配置不存在");
        }

        const config = taskConfigs[0]; // 使用第一个配置

        // 通过正常的任务处理流程
        const handler = this.handlerMap.get(config.taskType);
        if (!handler) {
            this.logger.warn(`未找到任务类型 ${config.taskType} 的处理器`);
            throw new Error(`任务处理器不存在: ${config.taskType}`);
        }

        // 生成事件ID（用于幂等）
        const eventId = `external_${event.submissionId}_${event.timestamp}`;

        // 调用处理器进行业务校验，传入 config
        const result = await handler.handle(event, config);

        if (!result.isValid) {
            this.logger.log(`任务校验失败: taskCode=${config.taskCode}, reason=${result.reason}`);
            throw new Error(result.reason || "任务校验失败");
        }

        // 幂等检查
        const existingLog = await this.taskLogRepository.findOne({
            where: {
                taskCode: config.taskCode,
                partnerId: result.partnerId,
                eventId,
            },
        });

        if (existingLog) {
            this.logger.log(
                `任务已完成，跳过: taskCode=${config.taskCode}, partnerId=${result.partnerId}, eventId=${eventId}`,
            );
            return existingLog.id;
        }

        // 写入任务完成日志
        const log = this.taskLogRepository.create({
            taskCode: config.taskCode,
            taskType: config.taskType as any,
            partnerId: result.partnerId,
            uid: result.uid,
            relatedPartnerId: result.relatedPartnerId || null,
            relatedUid: result.relatedUid || null,
            eventType: "external_task.approved",
            eventId,
            businessParams: {
                ...result.businessParams,
                pointsReward: event.pointsReward, // 记录实际奖励的积分
            },
            status: TaskStatus.COMPLETED,
        });

        await this.taskLogRepository.save(log);

        this.logger.log(
            `外部任务完成日志已记录: taskCode=${config.taskCode}, partnerId=${result.partnerId}, logId=${log.id}`,
        );

        // 使该用户的积分缓存失效
        this.pointsCacheService.invalidateUserCache(result.partnerId);

        return log.id;
    }

    /**
     * 生成事件ID（用于幂等判断）
     */
    private generateEventId(event: any): string {
        // 使用事件的关键字段生成唯一ID
        if (event.partnerId && event.downlinePartnerId) {
            // 邀请事件
            return `${event.partnerId}_${event.downlinePartnerId}_${event.timestamp}`;
        } else if (event.partnerId) {
            // 注册事件
            return `${event.partnerId}_${event.timestamp}`;
        }
        return `${event.timestamp}`;
    }
}

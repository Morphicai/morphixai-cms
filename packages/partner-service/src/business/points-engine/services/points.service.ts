import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TaskCompletionLogEntity } from "../entities/task-completion-log.entity";
import { TaskStatus } from "../enums/task-status.enum";
import { PointRuleService } from "./point-rule.service";
import { PointsCacheService } from "./points-cache.service";
import { getTaskConfigByCode } from "../constants/task-configs.constant";

/**
 * 积分服务
 * 负责查询用户积分（支持缓存）
 */
@Injectable()
export class PointsService {
    private readonly logger = new Logger(PointsService.name);

    constructor(
        @InjectRepository(TaskCompletionLogEntity)
        private readonly taskLogRepository: Repository<TaskCompletionLogEntity>,
        private readonly pointRuleService: PointRuleService,
        private readonly pointsCacheService: PointsCacheService,
    ) {}

    /**
     * 获取合伙人当前积分（支持缓存）
     * @param partnerId 合伙人ID
     * @returns 总积分
     */
    async getUserPoints(partnerId: string): Promise<number> {
        // 1. 尝试从缓存获取
        const cachedPoints = this.pointsCacheService.getTotalPoints(partnerId);
        if (cachedPoints !== undefined) {
            return cachedPoints;
        }

        // 2. 缓存未命中，从数据库计算
        const totalPoints = await this.calculateUserPointsFromDB(partnerId);

        // 3. 写入缓存
        this.pointsCacheService.setTotalPoints(partnerId, totalPoints);

        return totalPoints;
    }

    /**
     * 从数据库计算用户积分
     * @param partnerId 合伙人ID
     * @returns 总积分
     */
    private async calculateUserPointsFromDB(partnerId: string): Promise<number> {
        // 查询该合伙人所有已完成的任务日志
        const logs = await this.taskLogRepository.find({
            where: {
                partnerId,
                status: TaskStatus.COMPLETED,
            },
            order: {
                createdAt: "ASC",
            },
        });

        this.logger.log(`合伙人 ${partnerId} 共有 ${logs.length} 条任务完成记录`);

        // 累加每条日志的积分
        let totalPoints = 0;

        for (const log of logs) {
            const points = this.calculateLogPoints(log);
            totalPoints += points;
        }

        this.logger.log(`合伙人 ${partnerId} 当前总积分: ${totalPoints}`);
        return totalPoints;
    }

    /**
     * 获取合伙人积分明细（支持缓存）
     * @param partnerId 合伙人ID
     * @returns 积分明细列表
     */
    async getUserPointsDetail(partnerId: string): Promise<
        Array<{
            taskCode: string;
            taskType: string;
            points: number;
            businessParams: Record<string, any> | null;
            createdAt: Date;
        }>
    > {
        // 1. 尝试从缓存获取
        const cachedDetail = this.pointsCacheService.getPointsDetail(partnerId);
        if (cachedDetail !== undefined) {
            return cachedDetail;
        }

        // 2. 缓存未命中，从数据库查询
        const detail = await this.calculateUserPointsDetailFromDB(partnerId);

        // 3. 写入缓存
        this.pointsCacheService.setPointsDetail(partnerId, detail);

        return detail;
    }

    /**
     * 从数据库计算用户积分明细
     * @param partnerId 合伙人ID
     * @returns 积分明细列表
     */
    private async calculateUserPointsDetailFromDB(partnerId: string): Promise<
        Array<{
            taskCode: string;
            taskType: string;
            points: number;
            businessParams: Record<string, any> | null;
            createdAt: Date;
        }>
    > {
        const logs = await this.taskLogRepository.find({
            where: {
                partnerId,
                status: TaskStatus.COMPLETED,
            },
            order: {
                createdAt: "DESC",
            },
        });

        return logs.map((log) => ({
            taskCode: log.taskCode,
            taskType: log.taskType,
            points: this.calculateLogPoints(log),
            businessParams: log.businessParams,
            createdAt: log.createdAt,
        }));
    }

    /**
     * 计算单条日志的积分
     */
    private calculateLogPoints(log: TaskCompletionLogEntity): number {
        // 根据 taskCode 获取任务配置
        const config = getTaskConfigByCode(log.taskCode);

        if (!config) {
            this.logger.warn(`未找到任务配置: taskCode=${log.taskCode}`);
            return 0;
        }

        // 使用积分规则服务计算积分
        const points = this.pointRuleService.calculatePoints(config.pointRule, log.businessParams || undefined);

        return points;
    }

    /**
     * 获取合伙人本月积分（支持缓存）
     * @param partnerId 合伙人ID
     * @returns 本月积分
     */
    async getUserMonthlyPoints(partnerId: string): Promise<number> {
        // 1. 尝试从缓存获取
        const cachedPoints = this.pointsCacheService.getMonthlyPoints(partnerId);
        if (cachedPoints !== undefined) {
            return cachedPoints;
        }

        // 2. 缓存未命中，从数据库计算
        const monthlyPoints = await this.calculateUserMonthlyPointsFromDB(partnerId);

        // 3. 写入缓存
        this.pointsCacheService.setMonthlyPoints(partnerId, monthlyPoints);

        return monthlyPoints;
    }

    /**
     * 从数据库计算用户本月积分
     * @param partnerId 合伙人ID
     * @returns 本月积分
     */
    private async calculateUserMonthlyPointsFromDB(partnerId: string): Promise<number> {
        // 获取本月第一天
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // 查询本月的任务日志
        const logs = await this.taskLogRepository
            .createQueryBuilder("log")
            .where("log.partner_id = :partnerId", { partnerId })
            .andWhere("log.status = :status", { status: TaskStatus.COMPLETED })
            .andWhere("log.created_at >= :firstDayOfMonth", { firstDayOfMonth })
            .orderBy("log.created_at", "ASC")
            .getMany();

        this.logger.log(`合伙人 ${partnerId} 本月共有 ${logs.length} 条任务完成记录`);

        // 累加本月积分（只统计正积分）
        let monthlyPoints = 0;

        for (const log of logs) {
            const points = this.calculateLogPoints(log);
            if (points > 0) {
                monthlyPoints += points;
            }
        }

        this.logger.log(`合伙人 ${partnerId} 本月积分: ${monthlyPoints}`);
        return monthlyPoints;
    }

    /**
     * 使指定用户的缓存失效
     * 当用户完成新任务时调用此方法
     * @param partnerId 合伙人ID
     */
    invalidateUserCache(partnerId: string): void {
        this.pointsCacheService.invalidateUserCache(partnerId);
        this.logger.log(`用户积分缓存已失效: partnerId=${partnerId}`);
    }

    /**
     * 获取缓存统计信息
     */
    getCacheStats() {
        return this.pointsCacheService.getCacheStats();
    }

    /**
     * 按月统计积分
     * @param partnerId 合伙人ID
     * @returns 月度积分统计
     */
    async getMonthlySummary(partnerId: string): Promise<{
        thisMonth: { earned: string; spent: string };
        lastMonth: { earned: string; spent: string };
        history: Array<{ month: string; earned: string; spent: string }>;
    }> {
        // 查询所有已完成的任务日志
        const logs = await this.taskLogRepository.find({
            where: {
                partnerId,
                status: TaskStatus.COMPLETED,
            },
            order: {
                createdAt: "DESC",
            },
        });

        // 按月分组统计
        const monthlyStats = new Map<string, { earned: number; spent: number }>();

        for (const log of logs) {
            // 使用 createdAt 提取年月
            const date = new Date(log.createdAt);
            const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

            const points = this.calculateLogPoints(log);

            if (!monthlyStats.has(month)) {
                monthlyStats.set(month, { earned: 0, spent: 0 });
            }

            const stats = monthlyStats.get(month)!;
            if (points > 0) {
                stats.earned += points;
            } else {
                stats.spent += Math.abs(points);
            }
        }

        // 获取本月和上月
        const now = new Date();
        const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;

        const thisMonthStats = monthlyStats.get(thisMonth) || { earned: 0, spent: 0 };
        const lastMonthStats = monthlyStats.get(lastMonth) || { earned: 0, spent: 0 };

        // 构建历史记录（按月份倒序）
        const history = Array.from(monthlyStats.entries())
            .map(([month, stats]) => ({
                month,
                earned: stats.earned.toString(),
                spent: stats.spent.toString(),
            }))
            .sort((a, b) => b.month.localeCompare(a.month));

        return {
            thisMonth: {
                earned: thisMonthStats.earned.toString(),
                spent: thisMonthStats.spent.toString(),
            },
            lastMonth: {
                earned: lastMonthStats.earned.toString(),
                spent: lastMonthStats.spent.toString(),
            },
            history,
        };
    }
}

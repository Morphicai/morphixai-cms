import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, Like } from "typeorm";
import { OperationLogEntity } from "../entities/operation-log.entity";

/**
 * 创建操作日志DTO
 */
export interface CreateOperationLogDto {
    module: string;
    action: string;
    description: string;
    userId?: string;
    beforeData?: Record<string, any>;
    afterData?: Record<string, any>;
    status?: string;
    errorMessage?: string;
    duration?: number;
    ip?: string;
    userAgent?: string;
    method?: string;
    path?: string;
}

/**
 * 查询操作日志DTO
 */
export interface QueryOperationLogDto {
    page?: number;
    pageSize?: number;
    module?: string;
    action?: string;
    userId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    keyword?: string;
}

/**
 * 操作日志服务
 * 提供操作日志的创建、查询等功能
 */
@Injectable()
export class OperationLogService {
    private readonly logger = new Logger(OperationLogService.name);

    constructor(
        @InjectRepository(OperationLogEntity)
        private readonly operationLogRepository: Repository<OperationLogEntity>,
    ) {}

    /**
     * 创建操作日志
     */
    async createLog(data: CreateOperationLogDto): Promise<OperationLogEntity | null> {
        try {
            const log = this.operationLogRepository.create({
                module: data.module,
                action: data.action,
                description: data.description,
                userId: data.userId,
                beforeData: data.beforeData,
                afterData: data.afterData,
                status: data.status || "success",
                errorMessage: data.errorMessage,
                duration: data.duration,
                ip: data.ip,
                userAgent: data.userAgent,
                method: data.method,
                path: data.path,
            });

            return await this.operationLogRepository.save(log);
        } catch (error) {
            this.logger.error(`Failed to create operation log: ${error.message}`, error.stack);
            // 不抛出错误，避免影响主业务流程
            return null;
        }
    }

    /**
     * 查询操作日志列表（分页）
     */
    async findLogs(query: QueryOperationLogDto): Promise<{ list: OperationLogEntity[]; total: number }> {
        try {
            const { page = 1, pageSize = 20, module, action, userId, status, startDate, endDate, keyword } = query;

            const queryBuilder = this.operationLogRepository.createQueryBuilder("log");

            // 模块筛选
            if (module) {
                queryBuilder.andWhere("log.module = :module", { module });
            }

            // 操作类型筛选
            if (action) {
                queryBuilder.andWhere("log.action = :action", { action });
            }

            // 用户筛选
            if (userId) {
                queryBuilder.andWhere("log.userId = :userId", { userId });
            }

            // 状态筛选
            if (status) {
                queryBuilder.andWhere("log.status = :status", { status });
            }

            // 时间范围筛选
            if (startDate && endDate) {
                queryBuilder.andWhere("log.createDate BETWEEN :startDate AND :endDate", {
                    startDate,
                    endDate,
                });
            }

            // 关键词搜索
            if (keyword) {
                queryBuilder.andWhere("(log.description LIKE :keyword OR log.errorMessage LIKE :keyword)", {
                    keyword: `%${keyword}%`,
                });
            }

            // 排序
            queryBuilder.orderBy("log.createDate", "DESC");

            // 分页
            const skip = (page - 1) * pageSize;
            queryBuilder.skip(skip).take(pageSize);

            const [list, total] = await queryBuilder.getManyAndCount();

            return { list, total };
        } catch (error) {
            this.logger.error(`Failed to query operation logs: ${error.message}`, error.stack);
            return { list: [], total: 0 };
        }
    }

    /**
     * 根据ID获取操作日志详情
     */
    async findLogById(id: number): Promise<OperationLogEntity | null> {
        try {
            return await this.operationLogRepository.findOne({ where: { id } });
        } catch (error) {
            this.logger.error(`Failed to find operation log ${id}: ${error.message}`, error.stack);
            return null;
        }
    }

    /**
     * 获取用户操作日志
     */
    async findUserLogs(userId: string, limit = 50): Promise<OperationLogEntity[]> {
        try {
            return await this.operationLogRepository.find({
                where: { userId },
                order: { createDate: "DESC" },
                take: limit,
            });
        } catch (error) {
            this.logger.error(`Failed to get user logs for ${userId}: ${error.message}`, error.stack);
            return [];
        }
    }

    /**
     * 获取模块操作日志
     */
    async findModuleLogs(module: string, limit = 50): Promise<OperationLogEntity[]> {
        try {
            return await this.operationLogRepository.find({
                where: { module },
                order: { createDate: "DESC" },
                take: limit,
            });
        } catch (error) {
            this.logger.error(`Failed to get module logs for ${module}: ${error.message}`, error.stack);
            return [];
        }
    }

    /**
     * 获取操作统计
     */
    async getStatistics(startDate?: Date, endDate?: Date): Promise<any> {
        try {
            const queryBuilder = this.operationLogRepository.createQueryBuilder("log");

            if (startDate && endDate) {
                queryBuilder.where("log.createDate BETWEEN :startDate AND :endDate", {
                    startDate,
                    endDate,
                });
            }

            const total = await queryBuilder.getCount();
            const successCount = await queryBuilder
                .clone()
                .andWhere("log.status = :status", { status: "success" })
                .getCount();
            const failedCount = await queryBuilder
                .clone()
                .andWhere("log.status = :status", { status: "failed" })
                .getCount();

            // 按模块统计
            const moduleStats = await queryBuilder
                .clone()
                .select("log.module", "module")
                .addSelect("COUNT(*)", "count")
                .groupBy("log.module")
                .getRawMany();

            // 按操作类型统计
            const actionStats = await queryBuilder
                .clone()
                .select("log.action", "action")
                .addSelect("COUNT(*)", "count")
                .groupBy("log.action")
                .getRawMany();

            return {
                total,
                successCount,
                failedCount,
                successRate: total > 0 ? ((successCount / total) * 100).toFixed(2) + "%" : "0%",
                moduleStats,
                actionStats,
            };
        } catch (error) {
            this.logger.error(`Failed to get statistics: ${error.message}`, error.stack);
            return null;
        }
    }

    /**
     * 清理过期日志（可选功能）
     */
    async cleanExpiredLogs(daysToKeep = 90): Promise<number> {
        try {
            const expireDate = new Date();
            expireDate.setDate(expireDate.getDate() - daysToKeep);

            const result = await this.operationLogRepository
                .createQueryBuilder()
                .delete()
                .where("createDate < :expireDate", { expireDate })
                .execute();

            this.logger.log(`Cleaned ${result.affected} expired operation logs`);
            return result.affected || 0;
        } catch (error) {
            this.logger.error(`Failed to clean expired logs: ${error.message}`, error.stack);
            return 0;
        }
    }
}

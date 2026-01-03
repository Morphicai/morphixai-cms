import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ActivityEntity } from "./entities/activity.entity";
import { ResultData } from "../../shared/utils/result";
import { AppHttpCode } from "../../shared/enums/code.enum";

/**
 * 活动服务
 */
@Injectable()
export class ActivityService {
    private readonly logger = new Logger(ActivityService.name);

    constructor(
        @InjectRepository(ActivityEntity)
        private readonly activityRepository: Repository<ActivityEntity>,
    ) {}

    /**
     * 获取活动列表
     */
    async findAll(page: number = 1, pageSize: number = 10): Promise<ResultData> {
        try {
            const skip = (page - 1) * pageSize;
            const [items, total] = await this.activityRepository.findAndCount({
                where: { isDeleted: false },
                order: { createDate: "DESC" },
                skip,
                take: pageSize,
            });

            return ResultData.ok({
                items,
                total,
                page,
                pageSize,
            });
        } catch (error) {
            this.logger.error(`获取活动列表失败: ${error.message}`, error.stack);
            return ResultData.fail(AppHttpCode.SERVICE_ERROR, `获取活动列表失败: ${error.message}`);
        }
    }

    /**
     * 根据活动代码查找活动
     */
    async findByCode(activityCode: string): Promise<ResultData> {
        try {
            const activity = await this.activityRepository.findOne({
                where: { activityCode, isDeleted: false },
            });

            if (!activity) {
                return ResultData.fail(AppHttpCode.SERVICE_ERROR, `活动不存在: ${activityCode}`);
            }

            return ResultData.ok(activity);
        } catch (error) {
            this.logger.error(`查找活动失败: ${error.message}`, error.stack);
            return ResultData.fail(AppHttpCode.SERVICE_ERROR, `查找活动失败: ${error.message}`);
        }
    }

    /**
     * 验证活动是否存在且有效
     */
    async validateActivity(activityCode: string): Promise<any> {
        try {
            const activity = await this.activityRepository.findOne({
                where: { activityCode, isDeleted: false },
            });

            if (!activity) {
                return null;
            }

            const now = new Date();
            const isActive = now >= activity.startTime && now <= activity.endTime;

            return {
                activityCode: activity.activityCode,
                name: activity.name,
                type: activity.type,
                maxClaimTimes: 1, // 默认最大领取次数为1，可以根据活动规则扩展
                isActive,
                startTime: activity.startTime,
                endTime: activity.endTime,
            };
        } catch (error) {
            this.logger.error(`验证活动失败: ${error.message}`, error.stack);
            return null;
        }
    }
}


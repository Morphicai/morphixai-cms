import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, getManager } from "typeorm";
import { classToPlain } from "class-transformer";

import { ResultData } from "../../shared/utils/result";
import { AppHttpCode } from "../../shared/enums/code.enum";
import { RewardClaimRecordEntity } from "./entities/reward-claim-record.entity";
import { RewardClaimStatus } from "./enums/reward-claim-status.enum";
import {
    CreateRewardClaimRecordDto,
    UpdateRewardClaimStatusDto,
    QueryRewardClaimRecordDto,
    RewardClaimRecordListResponseDto,
    RewardClaimRecordInfoDto,
} from "./dto";
import { ActivityService } from "./services/activity.service";

/**
 * 奖励发放记录服务
 */
@Injectable()
export class RewardClaimRecordService {
    private readonly logger = new Logger(RewardClaimRecordService.name);

    constructor(
        @InjectRepository(RewardClaimRecordEntity)
        private readonly rewardClaimRecordRepo: Repository<RewardClaimRecordEntity>,
        private readonly activityService: ActivityService,
    ) {}

    /**
     * 创建或更新奖励发放记录
     * @param uid 用户ID
     * @param createDto 创建记录DTO
     * @returns 创建或更新结果
     */
    async create(uid: string, createDto: CreateRewardClaimRecordDto): Promise<ResultData> {
        try {
            // 验证活动代码对应的活动是否存在且有效（在活动时间范围内）
            const activity = await this.activityService.validateActivity(createDto.activityCode);
            if (!activity) {
                return ResultData.fail(AppHttpCode.PARAM_INVALID, "活动不存在或不在活动时间范围内");
            }

            // 使用事务确保原子性，解决并发问题
            const result = await getManager().transaction(async (transactionalEntityManager) => {
                const recordRepo = transactionalEntityManager.getRepository(RewardClaimRecordEntity);

                // 查询用户该活动的所有领取记录（在事务中查询）
                const allRecords = await recordRepo.find({
                    where: { uid, activityCode: createDto.activityCode },
                });

                // 检查领取次数限制（兼容旧数据：如果 maxClaimTimes 为空，默认为 1）
                const maxClaimTimes = activity.maxClaimTimes || 1;

                // 计算已使用的领取次数：
                // - 只统计 CLAIMING（领取中）和 CLAIMED（已成功）状态的记录
                // - FAILED（失败）状态不算作领取次数，允许重新领取
                const claimingRecords = allRecords.filter((record) => record.status === RewardClaimStatus.CLAIMING);
                const claimedRecords = allRecords.filter((record) => record.status === RewardClaimStatus.CLAIMED);
                const failedRecords = allRecords.filter((record) => record.status === RewardClaimStatus.FAILED);
                const usedClaimTimes = claimingRecords.length + claimedRecords.length;

                // 打印领取记录统计信息
                this.logger.log(
                    `领取次数统计 - uid: ${uid}, activityCode: ${createDto.activityCode}, ` +
                        `总记录数: ${allRecords.length}, ` +
                        `CLAIMING: ${claimingRecords.length}, ` +
                        `CLAIMED: ${claimedRecords.length}, ` +
                        `FAILED: ${failedRecords.length}, ` +
                        `已用次数: ${usedClaimTimes}, ` +
                        `最大次数: ${maxClaimTimes}`,
                );

                // 检查是否超过最大领取次数
                if (usedClaimTimes >= maxClaimTimes) {
                    // 根据最大领取次数提供不同的错误提示
                    if (maxClaimTimes === 1) {
                        throw new Error("该活动的奖励已经发放完成，不允许重新领取");
                    } else {
                        throw new Error(`领取奖励已达上限（${maxClaimTimes}次）`);
                    }
                }

                // 验证rewards数组不为空
                if (!createDto.rewards || createDto.rewards.length === 0) {
                    throw new Error("奖励信息不能为空");
                }

                // 始终创建新记录
                const newRecord = recordRepo.create({
                    uid,
                    activityCode: createDto.activityCode,
                    roleId: createDto.roleId,
                    serverId: createDto.serverId,
                    status: RewardClaimStatus.CLAIMING,
                    claimStartTime: new Date(),
                    rewards: createDto.rewards,
                });

                const savedRecord = await recordRepo.save(newRecord);
                return { record: savedRecord, isNew: true };
            });

            this.logger.log(
                `奖励发放记录创建成功：${result.record.id} - uid: ${uid}, activityCode: ${createDto.activityCode}`,
            );

            return ResultData.ok(classToPlain(result.record) as RewardClaimRecordInfoDto, "奖励发放记录创建成功");
        } catch (error) {
            // 处理业务逻辑错误
            if (error.message) {
                if (
                    error.message.includes("不允许重新领取") ||
                    error.message.includes("已经发放完成") ||
                    error.message.includes("领取奖励已达上限") ||
                    error.message.includes("已达到最大领取次数")
                ) {
                    return ResultData.fail(AppHttpCode.PARAM_INVALID, error.message);
                }
                if (error.message.includes("奖励信息不能为空")) {
                    return ResultData.fail(AppHttpCode.PARAM_INVALID, error.message);
                }
                if (error.message.includes("活动不存在") || error.message.includes("不在活动时间范围内")) {
                    return ResultData.fail(AppHttpCode.PARAM_INVALID, error.message);
                }
            }

            this.logger.error(`奖励发放记录创建失败: ${error.message}`, error.stack);
            return ResultData.fail(AppHttpCode.SERVICE_ERROR, `创建失败: ${error.message}`);
        }
    }

    /**
     * 更新奖励发放状态
     * @param uid 用户ID
     * @param updateDto 更新状态DTO
     * @returns 更新结果
     */
    async updateStatus(uid: string, updateDto: UpdateRewardClaimStatusDto): Promise<ResultData> {
        try {
            this.logger.log(
                `开始更新奖励发放状态 - uid: ${uid}, activityCode: ${updateDto.activityCode}, 目标状态: ${updateDto.status}`,
            );

            // 验证活动代码对应的活动是否存在
            // 注意：即使活动已结束，也允许更新状态（因为可能是处理延迟的发放）
            // 但如果活动不存在，则不允许更新
            const activityResult = await this.activityService.findByCode(updateDto.activityCode);
            if (activityResult.code !== 200 || !activityResult.data) {
                this.logger.warn(`活动不存在 - activityCode: ${updateDto.activityCode}`);
                return ResultData.fail(AppHttpCode.PARAM_INVALID, "活动不存在");
            }

            // 通过uid+activityCode查询最新的记录
            const records = await this.rewardClaimRecordRepo.find({
                where: { uid, activityCode: updateDto.activityCode },
                order: { createDate: "DESC" },
            });

            if (!records || records.length === 0) {
                this.logger.warn(`奖励发放记录不存在 - uid: ${uid}, activityCode: ${updateDto.activityCode}`);
                return ResultData.fail(AppHttpCode.PARAM_INVALID, "奖励发放记录不存在");
            }

            // 获取最新的记录
            const record = records[0];

            this.logger.log(
                `找到奖励发放记录 - id: ${record.id}, 当前状态: ${record.status}, 记录总数: ${records.length}`,
            );

            // 验证状态转换合法性（只能从 CLAIMING 转换到 CLAIMED 或 FAILED）
            if (record.status !== RewardClaimStatus.CLAIMING) {
                this.logger.warn(
                    `状态转换不合法 - 当前状态: ${record.status}, 目标状态: ${updateDto.status}, 只能从 CLAIMING 状态转换`,
                );
                return ResultData.fail(
                    AppHttpCode.PARAM_INVALID,
                    `当前状态为 ${record.status}，只能从 ${RewardClaimStatus.CLAIMING} 状态转换`,
                );
            }

            // 如果状态为 FAILED，验证 failureReason 必填
            if (updateDto.status === RewardClaimStatus.FAILED && !updateDto.failureReason) {
                this.logger.warn("失败状态缺少失败原因");
                return ResultData.fail(AppHttpCode.PARAM_INVALID, "失败状态必须提供失败原因");
            }

            // 根据新状态设置对应时间字段
            record.status = updateDto.status;
            if (updateDto.status === RewardClaimStatus.CLAIMED) {
                record.claimSuccessTime = new Date();
                record.claimFailTime = undefined;
                record.failReason = undefined;
            } else if (updateDto.status === RewardClaimStatus.FAILED) {
                record.claimFailTime = new Date();
                record.failReason = updateDto.failureReason;
                record.claimSuccessTime = undefined;
            }

            const updatedRecord = await this.rewardClaimRecordRepo.save(record);

            this.logger.log(
                `奖励发放状态更新成功 - id: ${updatedRecord.id}, uid: ${uid}, activityCode: ${updateDto.activityCode}, ` +
                    `旧状态: CLAIMING, 新状态: ${updateDto.status}`,
            );

            return ResultData.ok(classToPlain(updatedRecord) as RewardClaimRecordInfoDto, "奖励发放状态更新成功");
        } catch (error) {
            this.logger.error(
                `奖励发放状态更新失败 - uid: ${uid}, activityCode: ${updateDto.activityCode}, error: ${error.message}`,
                error.stack,
            );
            return ResultData.fail(AppHttpCode.SERVICE_ERROR, `更新失败: ${error.message}`);
        }
    }

    /**
     * 查询用户奖励发放记录
     * @param uid 用户ID
     * @param activityCode 活动代码（可选）
     * @param page 页码（可选，默认1）
     * @param pageSize 每页数量（可选，默认20，最大100）
     * @returns 记录列表
     */
    async findByUid(uid: string, activityCode?: string, page?: number, pageSize?: number): Promise<ResultData> {
        try {
            const currentPage = page || 1;
            const currentPageSize = Math.min(pageSize || 20, 100); // 限制最大每页100条

            const queryBuilder = this.rewardClaimRecordRepo.createQueryBuilder("record");

            // 固定查询条件为指定 uid
            queryBuilder.where("record.uid = :uid", { uid });

            // 如果提供了activityCode，则查询指定活动的记录
            if (activityCode) {
                queryBuilder.andWhere("record.activityCode = :activityCode", { activityCode });
            }

            // 排序：按创建时间倒序
            queryBuilder.orderBy("record.createDate", "DESC");

            // 分页
            const skip = (currentPage - 1) * currentPageSize;
            queryBuilder.skip(skip).take(currentPageSize);

            const [items, total] = await queryBuilder.getManyAndCount();

            return ResultData.ok({
                items: items.map((item) => classToPlain(item) as RewardClaimRecordInfoDto),
                total,
                page: currentPage,
                pageSize: currentPageSize,
            });
        } catch (error) {
            this.logger.error(`查询用户奖励发放记录失败: ${error.message}`, error.stack);
            return ResultData.fail(AppHttpCode.SERVICE_ERROR, `查询失败: ${error.message}`);
        }
    }

    /**
     * 删除奖励发放记录
     * @param id 记录ID
     * @returns 删除结果
     */
    async delete(id: string): Promise<ResultData> {
        try {
            const record = await this.rewardClaimRecordRepo.findOne({ where: { id } });

            if (!record) {
                return ResultData.fail(AppHttpCode.PARAM_INVALID, "奖励发放记录不存在");
            }

            await this.rewardClaimRecordRepo.remove(record);

            this.logger.log(`奖励发放记录删除成功：${id} - uid: ${record.uid}, activityCode: ${record.activityCode}`);

            return ResultData.ok(null, "奖励发放记录删除成功");
        } catch (error) {
            this.logger.error(`奖励发放记录删除失败: ${error.message}`, error.stack);
            return ResultData.fail(AppHttpCode.SERVICE_ERROR, `删除失败: ${error.message}`);
        }
    }

    /**
     * 分页查询奖励发放记录列表
     * @param queryDto 查询参数
     * @returns 分页结果
     */
    async list(queryDto: QueryRewardClaimRecordDto): Promise<ResultData> {
        try {
            const { page = 1, pageSize = 10, uid, activityCode, activityType, status } = queryDto;

            const queryBuilder = this.rewardClaimRecordRepo.createQueryBuilder("record");

            // 按 uid 筛选
            if (uid) {
                queryBuilder.andWhere("record.uid LIKE :uid", { uid: `%${uid}%` });
            }

            // 按 activityCode 筛选
            if (activityCode) {
                queryBuilder.andWhere("record.activityCode = :activityCode", { activityCode });
            }

            // 按活动类型筛选（需要通过关联活动表）
            if (activityType) {
                queryBuilder
                    .innerJoin("biz_activity", "activity", "activity.activity_code = record.activity_code")
                    .andWhere("activity.type = :activityType", { activityType });
            }

            // 按 status 筛选
            if (status) {
                queryBuilder.andWhere("record.status = :status", { status });
            }

            // 分页
            const skip = (page - 1) * pageSize;
            queryBuilder.skip(skip).take(pageSize);

            // 排序：按创建时间倒序
            queryBuilder.orderBy("record.createDate", "DESC");

            const [items, total] = await queryBuilder.getManyAndCount();

            const response: RewardClaimRecordListResponseDto = {
                items: items.map((item) => classToPlain(item) as RewardClaimRecordInfoDto),
                total,
                page,
                pageSize,
            };

            return ResultData.ok(response);
        } catch (error) {
            this.logger.error(`查询奖励发放记录列表失败: ${error.message}`, error.stack);
            return ResultData.fail(AppHttpCode.SERVICE_ERROR, `查询失败: ${error.message}`);
        }
    }
}

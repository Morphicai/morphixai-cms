import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, In } from "typeorm";
import { ExternalTaskSubmissionEntity } from "../entities/external-task-submission.entity";
import { SubmitExternalTaskDto } from "../dto/submit-external-task.dto";
import { QuerySubmissionsDto } from "../dto/query-submissions.dto";
import { ApproveSubmissionDto } from "../dto/approve-submission.dto";
import { RejectSubmissionDto } from "../dto/reject-submission.dto";
import { SubmissionStatus } from "../enums/submission-status.enum";
import { getExternalTaskConfig, getEnabledExternalTaskConfigs } from "../constants/external-task-configs.constant";
import { TaskEngineService } from "../../points-engine/services/task-engine.service";

@Injectable()
export class ExternalTaskService {
    private readonly logger = new Logger(ExternalTaskService.name);

    constructor(
        @InjectRepository(ExternalTaskSubmissionEntity)
        private readonly submissionRepository: Repository<ExternalTaskSubmissionEntity>,
        private readonly taskEngineService: TaskEngineService,
    ) {}

    /**
     * 生成提交编号
     */
    private generateSubmissionCode(): string {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, "0");
        return `ES${timestamp}${random}`;
    }

    /**
     * 检查任务完成次数限制
     */
    private async checkCompletionLimit(partnerId: string, taskType: string, config: any): Promise<void> {
        // 如果没有限制，直接返回
        if (config.maxCompletionCount === 0) {
            return;
        }

        // 统计该用户该任务类型的完成次数（审核中 + 审核通过）
        const completedCount = await this.submissionRepository.count({
            where: [
                { partnerId, taskType, status: SubmissionStatus.PENDING },
                { partnerId, taskType, status: SubmissionStatus.APPROVED },
            ],
        });

        if (completedCount >= config.maxCompletionCount) {
            throw new BadRequestException(
                `该任务最多只能完成${config.maxCompletionCount}次，您已达到上限（包含审核中的提交）`,
            );
        }
    }

    /**
     * 提交外部任务
     */
    async submitTask(
        partnerId: string,
        uid: string,
        dto: SubmitExternalTaskDto,
    ): Promise<ExternalTaskSubmissionEntity> {
        this.logger.log(`用户提交外部任务: partnerId=${partnerId}, taskType=${dto.taskType}`);

        // 获取任务配置
        const config = getExternalTaskConfig(dto.taskType);
        if (!config) {
            throw new BadRequestException("无效的任务类型");
        }

        if (!config.enabled) {
            throw new BadRequestException("该任务类型已禁用");
        }

        // 检查完成次数限制
        await this.checkCompletionLimit(partnerId, dto.taskType, config);

        // 验证必填项
        if (config.requireLink && !dto.taskLink) {
            throw new BadRequestException("该任务类型需要提供任务链接");
        }

        if (config.requireImages && (!dto.proofImages || dto.proofImages.length === 0)) {
            throw new BadRequestException("该任务类型需要上传证明图片");
        }

        // 验证图片数量
        if (dto.proofImages && dto.proofImages.length > 0) {
            if (config.minImages && dto.proofImages.length < config.minImages) {
                throw new BadRequestException(`至少需要上传${config.minImages}张图片`);
            }
            if (config.maxImages && dto.proofImages.length > config.maxImages) {
                throw new BadRequestException(`最多只能上传${config.maxImages}张图片`);
            }
        }

        // 创建提交记录
        const submission = this.submissionRepository.create({
            submissionCode: this.generateSubmissionCode(),
            taskType: dto.taskType,
            partnerId,
            uid,
            taskLink: dto.taskLink || null,
            proofImages: dto.proofImages || null,
            remark: dto.remark || null,
            status: SubmissionStatus.PENDING,
        });

        await this.submissionRepository.save(submission);

        this.logger.log(`外部任务提交成功: submissionCode=${submission.submissionCode}`);

        return submission;
    }

    /**
     * 修改被拒绝的提交
     */
    async updateRejectedSubmission(
        partnerId: string,
        submissionId: string,
        dto: any,
    ): Promise<ExternalTaskSubmissionEntity> {
        this.logger.log(`用户修改被拒绝的提交: partnerId=${partnerId}, submissionId=${submissionId}`);

        // 查询提交记录
        const submission = await this.submissionRepository.findOne({
            where: { id: submissionId, partnerId },
        });

        if (!submission) {
            throw new NotFoundException("提交记录不存在");
        }

        // 只能修改被拒绝的提交
        if (submission.status !== SubmissionStatus.REJECTED) {
            throw new BadRequestException("只能修改被拒绝的提交");
        }

        // 获取任务配置
        const config = getExternalTaskConfig(submission.taskType);
        if (!config) {
            throw new BadRequestException("任务配置不存在");
        }

        // 验证必填项
        if (config.requireLink && dto.taskLink !== undefined) {
            if (!dto.taskLink) {
                throw new BadRequestException("该任务类型需要提供任务链接");
            }
            submission.taskLink = dto.taskLink;
        }

        if (dto.proofImages !== undefined) {
            if (config.requireImages && (!dto.proofImages || dto.proofImages.length === 0)) {
                throw new BadRequestException("该任务类型需要上传证明图片");
            }

            // 验证图片数量
            if (dto.proofImages && dto.proofImages.length > 0) {
                if (config.minImages && dto.proofImages.length < config.minImages) {
                    throw new BadRequestException(`至少需要上传${config.minImages}张图片`);
                }
                if (config.maxImages && dto.proofImages.length > config.maxImages) {
                    throw new BadRequestException(`最多只能上传${config.maxImages}张图片`);
                }
            }

            submission.proofImages = dto.proofImages;
        }

        if (dto.remark !== undefined) {
            submission.remark = dto.remark;
        }

        // 重置状态为待审核
        submission.status = SubmissionStatus.PENDING;
        submission.reviewerId = null;
        submission.reviewTime = null;
        submission.reviewRemark = null;

        await this.submissionRepository.save(submission);

        this.logger.log(`提交修改成功，重新进入审核: submissionCode=${submission.submissionCode}`);

        return submission;
    }

    /**
     * 查询我的提交记录
     */
    async getMySubmissions(
        partnerId: string,
        dto: QuerySubmissionsDto,
    ): Promise<{ items: ExternalTaskSubmissionEntity[]; total: number; page: number; pageSize: number }> {
        const { page = 1, pageSize = 20, status, taskType } = dto;

        const queryBuilder = this.submissionRepository
            .createQueryBuilder("submission")
            .where("submission.partnerId = :partnerId", { partnerId });

        if (status) {
            queryBuilder.andWhere("submission.status = :status", { status });
        }

        if (taskType) {
            queryBuilder.andWhere("submission.taskType = :taskType", { taskType });
        }

        queryBuilder
            .orderBy("submission.createdAt", "DESC")
            .skip((page - 1) * pageSize)
            .take(pageSize);

        const [items, total] = await queryBuilder.getManyAndCount();

        return {
            items,
            total,
            page,
            pageSize,
        };
    }

    /**
     * 查询提交记录（管理后台）
     */
    async getSubmissions(
        dto: QuerySubmissionsDto,
    ): Promise<{ items: ExternalTaskSubmissionEntity[]; total: number; page: number; pageSize: number }> {
        const { page = 1, pageSize = 20, status, taskType, partnerId, startDate, endDate } = dto;

        const queryBuilder = this.submissionRepository.createQueryBuilder("submission");

        if (status) {
            queryBuilder.andWhere("submission.status = :status", { status });
        }

        if (taskType) {
            queryBuilder.andWhere("submission.taskType = :taskType", { taskType });
        }

        if (partnerId) {
            queryBuilder.andWhere("submission.partnerId = :partnerId", { partnerId });
        }

        if (startDate && endDate) {
            queryBuilder.andWhere("submission.createdAt BETWEEN :startDate AND :endDate", {
                startDate: new Date(startDate),
                endDate: new Date(endDate),
            });
        } else if (startDate) {
            queryBuilder.andWhere("submission.createdAt >= :startDate", { startDate: new Date(startDate) });
        } else if (endDate) {
            queryBuilder.andWhere("submission.createdAt <= :endDate", { endDate: new Date(endDate) });
        }

        queryBuilder
            .orderBy("submission.createdAt", "DESC")
            .skip((page - 1) * pageSize)
            .take(pageSize);

        const [items, total] = await queryBuilder.getManyAndCount();

        return {
            items,
            total,
            page,
            pageSize,
        };
    }

    /**
     * 获取提交详情
     */
    async getSubmissionById(id: string): Promise<ExternalTaskSubmissionEntity> {
        const submission = await this.submissionRepository.findOne({ where: { id } });

        if (!submission) {
            throw new NotFoundException("提交记录不存在");
        }

        return submission;
    }

    /**
     * 获取提交详情（带合伙人信息）
     */
    async getSubmissionWithPartnerInfo(id: string): Promise<any> {
        const submission = await this.getSubmissionById(id);

        // 这里返回提交信息，合伙人信息由 Controller 层通过 PartnerService 获取
        return submission;
    }

    /**
     * 审核通过
     */
    async approveSubmission(
        id: string,
        reviewerId: string,
        dto: ApproveSubmissionDto,
    ): Promise<ExternalTaskSubmissionEntity> {
        this.logger.log(`审核通过外部任务: id=${id}, reviewerId=${reviewerId}`);

        const submission = await this.getSubmissionById(id);

        // 检查状态
        if (submission.status !== SubmissionStatus.PENDING) {
            throw new BadRequestException("该提交已被审核，无法重复审核");
        }

        // 获取任务配置
        const config = getExternalTaskConfig(submission.taskType);
        if (!config) {
            throw new BadRequestException("任务配置不存在");
        }

        // 调用积分引擎发放积分
        let taskLogId: string;
        try {
            taskLogId = await this.taskEngineService.processExternalTaskEvent({
                submissionId: submission.id,
                partnerId: submission.partnerId,
                uid: submission.uid,
                taskType: submission.taskType,
                pointsReward: config.pointsReward,
                timestamp: Date.now(),
            });
        } catch (error) {
            this.logger.error(`发放积分失败: ${error.message}`, error.stack);
            throw new BadRequestException(`发放积分失败: ${error.message}`);
        }

        // 更新提交记录
        submission.status = SubmissionStatus.APPROVED;
        submission.reviewerId = reviewerId;
        submission.reviewTime = new Date();
        submission.reviewRemark = dto.reviewRemark || null;
        submission.pointsAwarded = config.pointsReward;
        submission.taskLogId = taskLogId;

        await this.submissionRepository.save(submission);

        this.logger.log(`外部任务审核通过: submissionCode=${submission.submissionCode}, points=${config.pointsReward}`);

        return submission;
    }

    /**
     * 审核拒绝
     */
    async rejectSubmission(
        id: string,
        reviewerId: string,
        dto: RejectSubmissionDto,
    ): Promise<ExternalTaskSubmissionEntity> {
        this.logger.log(`审核拒绝外部任务: id=${id}, reviewerId=${reviewerId}`);

        const submission = await this.getSubmissionById(id);

        // 检查状态
        if (submission.status !== SubmissionStatus.PENDING) {
            throw new BadRequestException("该提交已被审核，无法重复审核");
        }

        // 更新提交记录
        submission.status = SubmissionStatus.REJECTED;
        submission.reviewerId = reviewerId;
        submission.reviewTime = new Date();
        submission.reviewRemark = dto.reviewRemark;

        await this.submissionRepository.save(submission);

        this.logger.log(`外部任务审核拒绝: submissionCode=${submission.submissionCode}`);

        return submission;
    }

    /**
     * 获取审核统计
     */
    async getStatistics(): Promise<{
        pendingCount: number;
        approvedCount: number;
        rejectedCount: number;
        todayReviewCount: number;
    }> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [pendingCount, approvedCount, rejectedCount, todayReviewCount] = await Promise.all([
            this.submissionRepository.count({ where: { status: SubmissionStatus.PENDING } }),
            this.submissionRepository.count({ where: { status: SubmissionStatus.APPROVED } }),
            this.submissionRepository.count({ where: { status: SubmissionStatus.REJECTED } }),
            this.submissionRepository.count({
                where: {
                    reviewTime: Between(today, tomorrow),
                },
            }),
        ]);

        return {
            pendingCount,
            approvedCount,
            rejectedCount,
            todayReviewCount,
        };
    }

    /**
     * 获取任务列表（带完成状态）
     */
    async getTaskList(partnerId: string): Promise<any[]> {
        this.logger.log(`获取任务列表: partnerId=${partnerId}`);

        // 获取所有启用的任务配置
        const configs = getEnabledExternalTaskConfigs();

        // 获取所有任务类型
        const taskTypes = configs.map((config) => config.taskType);

        // 查询用户的完成情况（审核中 + 审核通过）
        const submissions = await this.submissionRepository.find({
            where: {
                partnerId,
                taskType: In(taskTypes),
                status: In([SubmissionStatus.PENDING, SubmissionStatus.APPROVED]),
            },
            select: ["taskType", "status"],
        });

        // 统计每个任务类型的完成次数
        const completionMap = new Map<string, { pending: number; approved: number }>();
        submissions.forEach((submission) => {
            const key = submission.taskType;
            if (!completionMap.has(key)) {
                completionMap.set(key, { pending: 0, approved: 0 });
            }
            const stats = completionMap.get(key);
            if (submission.status === SubmissionStatus.PENDING) {
                stats.pending++;
            } else if (submission.status === SubmissionStatus.APPROVED) {
                stats.approved++;
            }
        });

        // 构建任务列表
        const taskList = configs
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((config) => {
                const stats = completionMap.get(config.taskType) || { pending: 0, approved: 0 };
                const completedCount = stats.pending + stats.approved;
                const isCompleted =
                    config.maxCompletionCount > 0 && completedCount >= config.maxCompletionCount;

                return {
                    taskType: config.taskType,
                    category: config.category,
                    source: config.source,
                    name: config.name,
                    description: config.description,
                    pointsReward: config.pointsReward,
                    maxCompletionCount: config.maxCompletionCount,
                    completedCount,
                    pendingCount: stats.pending,
                    approvedCount: stats.approved,
                    isCompleted,
                    canSubmit: !isCompleted,
                    buttonText: config.buttonText,
                    actionUrl: config.actionUrl,
                    requireLink: config.requireLink,
                    requireImages: config.requireImages,
                    minImages: config.minImages,
                    maxImages: config.maxImages,
                };
            });

        return taskList;
    }
}

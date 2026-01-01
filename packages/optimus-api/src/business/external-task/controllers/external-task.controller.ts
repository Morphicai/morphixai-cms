import {
    Controller,
    Post,
    Get,
    Put,
    Body,
    Query,
    Param,
    UseGuards,
    Req,
    UseInterceptors,
    UploadedFile,
    Logger,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody, ApiQuery, ApiConsumes } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { ExternalTaskService } from "../services/external-task.service";
import { SubmitExternalTaskDto } from "../dto/submit-external-task.dto";
import { QuerySubmissionsDto } from "../dto/query-submissions.dto";
import { UpdateSubmissionDto } from "../dto/update-submission.dto";
import { ClientUserAuthGuard } from "../../../shared/guards/client-user-auth.guard";
import { AllowAnonymous } from "../../../shared/decorators/allow-anonymous.decorator";
import { RequireClientUserAuth } from "../../../shared/decorators/require-client-user-auth.decorator";
import { ResultData } from "../../../shared/utils/result";
import { ApiResult } from "../../../shared/decorators/api-result.decorator";
import { getEnabledExternalTaskConfigs } from "../constants/external-task-configs.constant";
import { PartnerService } from "../../partner/partner.service";
import { StorageConfigService } from "../../../system/oss/storage-config.service";
import { IStorageService } from "../../../system/oss/interfaces/storage.interface";
import { RetryHandler } from "../../../system/oss/utils/error-handler";

@ApiTags("外部任务（C端）")
@ApiBearerAuth()
@Controller("api/external-task")
export class ExternalTaskController {
    private readonly logger = new Logger(ExternalTaskController.name);
    private storageService: IStorageService;

    constructor(
        private readonly externalTaskService: ExternalTaskService,
        private readonly partnerService: PartnerService,
        private readonly storageConfigService: StorageConfigService,
    ) {
        try {
            this.storageService = this.storageConfigService.getStorageService();
            this.logger.log("Storage service initialized for external task uploads");
        } catch (error) {
            this.logger.warn("Storage service not yet initialized, will retry on first upload");
        }
    }

    /**
     * 确保存储服务已初始化
     */
    private ensureStorageService(): IStorageService {
        if (!this.storageService) {
            this.storageService = this.storageConfigService.getStorageService();
            this.logger.log("Storage service initialized on demand");
        }
        return this.storageService;
    }

    /**
     * 上传任务凭证图片
     * POST /api/external-task/upload-proof
     */
    @Post("upload-proof")
    @AllowAnonymous()
    @UseGuards(ClientUserAuthGuard)
    @RequireClientUserAuth()
    @UseInterceptors(FileInterceptor("file"))
    @ApiOperation({
        summary: "上传任务凭证图片（需要 ClientUserAuthGuard 认证）",
        description: "用户上传外部任务的凭证图片，返回图片URL。支持 jpg、png、gif 格式，单个文件最大10MB",
    })
    @ApiConsumes("multipart/form-data")
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                file: {
                    type: "string",
                    format: "binary",
                    description: "凭证图片文件",
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: "上传成功",
        schema: {
            example: {
                code: 200,
                message: "上传成功",
                data: {
                    url: "https://cdn.example.com/external-task/proof/1733472000001234.jpg",
                    filename: "proof_image.jpg",
                    size: 102400,
                },
            },
        },
    })
    @ApiResponse({ status: 400, description: "文件格式不支持或文件过大" })
    @ApiResponse({ status: 404, description: "用户未加入合伙人计划" })
    @ApiResult()
    async uploadProof(@Req() req: any, @UploadedFile() file: Express.Multer.File): Promise<ResultData> {
        const userId = req.clientUser?.userId;

        // 验证用户是否是合伙人
        const profile = await this.partnerService.getProfileByUserId(userId);
        if (!profile) {
            return ResultData.fail(404, "您还未加入合伙人计划");
        }

        // 验证文件
        if (!file) {
            return ResultData.fail(400, "请上传文件");
        }

        // 验证文件类型（只允许图片）
        const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return ResultData.fail(400, "只支持 jpg、png、gif、webp 格式的图片");
        }

        // 验证文件大小（最大10MB）
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return ResultData.fail(400, "文件大小不能超过10MB");
        }

        try {
            // 确保存储服务已初始化
            const storageService = this.ensureStorageService();

            // 使用存储服务上传文件
            const uploadOptions = {
                business: JSON.stringify({
                    type: "external-task-proof",
                    partnerId: profile.partnerId,
                    uid: profile.uid,
                    uploadTime: Date.now(),
                }),
            };

            // 使用重试机制上传文件
            const fileResult = await RetryHandler.withRetry(
                () => storageService.uploadFile(file, uploadOptions),
                3, // 最大重试3次
                1000, // 初始延迟1秒
                true, // 使用指数退避
            );

            this.logger.log(`External task proof uploaded: ${fileResult.url}`);

            return ResultData.ok(
                {
                    url: fileResult.url,
                    filename: file.originalname,
                    size: file.size,
                },
                "上传成功",
            );
        } catch (error) {
            this.logger.error(`Upload failed: ${error.message}`, error.stack);
            return ResultData.fail(500, `上传失败: ${error.message}`);
        }
    }

    /**
     * 获取任务列表（带完成状态）
     * GET /api/external-task/task-list
     */
    @Get("task-list")
    @AllowAnonymous()
    @UseGuards(ClientUserAuthGuard)
    @RequireClientUserAuth()
    @ApiOperation({
        summary: "获取任务列表（需要 ClientUserAuthGuard 认证）",
        description: "获取所有启用的外部任务及其完成状态，用于前端展示任务列表",
    })
    @ApiResponse({
        status: 200,
        description: "成功获取任务列表",
        schema: {
            example: {
                code: 200,
                message: "success",
                data: [
                    {
                        taskType: "DOUYIN_SHORT_VIDEO",
                        category: "外部专项激励",
                        source: "抖音短视频",
                        name: "抖音短视频",
                        description: "通过任意链接发表视频",
                        pointsReward: 2000,
                        maxCompletionCount: 10,
                        completedCount: 3,
                        pendingCount: 1,
                        approvedCount: 2,
                        isCompleted: false,
                        canSubmit: true,
                        buttonText: "点击跳转",
                        actionUrl: "https://www.douyin.com",
                        requireLink: true,
                        requireImages: true,
                        minImages: 1,
                        maxImages: 5,
                    },
                ],
            },
        },
    })
    @ApiResponse({ status: 404, description: "用户未加入合伙人计划" })
    @ApiResult()
    async getTaskList(@Req() req: any): Promise<ResultData> {
        const userId = req.clientUser?.userId;

        // 通过 userId 查询合伙人档案
        const profile = await this.partnerService.getProfileByUserId(userId);
        if (!profile) {
            return ResultData.fail(404, "您还未加入合伙人计划");
        }

        const taskList = await this.externalTaskService.getTaskList(profile.partnerId);

        return ResultData.ok(taskList);
    }

    /**
     * 获取可用的任务类型列表
     * GET /api/external-task/types
     */
    @Get("types")
    @AllowAnonymous()
    @UseGuards(ClientUserAuthGuard)
    @RequireClientUserAuth()
    @ApiOperation({
        summary: "获取可用的任务类型列表（需要 ClientUserAuthGuard 认证）",
        description: "获取所有启用的外部任务类型及其配置信息",
    })
    @ApiResponse({
        status: 200,
        description: "成功获取任务类型列表",
        schema: {
            example: {
                code: 200,
                message: "success",
                data: [
                    {
                        taskType: "SOCIAL_SHARE",
                        name: "社交媒体分享",
                        description: "在社交媒体（Twitter、Facebook等）分享游戏内容",
                        pointsReward: 50,
                        requireLink: true,
                        requireImages: true,
                        minImages: 1,
                        maxImages: 5,
                    },
                ],
            },
        },
    })
    @ApiResult()
    async getTaskTypes(): Promise<ResultData> {
        const configs = getEnabledExternalTaskConfigs();
        return ResultData.ok(
            configs.map((config) => ({
                taskType: config.taskType,
                name: config.name,
                description: config.description,
                pointsReward: config.pointsReward,
                requireLink: config.requireLink,
                requireImages: config.requireImages,
                minImages: config.minImages,
                maxImages: config.maxImages,
                maxCompletionCount: config.maxCompletionCount,
            })),
        );
    }

    /**
     * 提交外部任务
     * POST /api/biz/external-task/submit
     */
    @Post("submit")
    @AllowAnonymous()
    @UseGuards(ClientUserAuthGuard)
    @RequireClientUserAuth()
    @ApiOperation({
        summary: "提交外部任务（需要 ClientUserAuthGuard 认证）",
        description: "用户提交外部任务，等待审核。需要用户已加入合伙人计划",
    })
    @ApiBody({
        type: SubmitExternalTaskDto,
        examples: {
            socialShare: {
                summary: "社交媒体分享",
                value: {
                    taskType: "SOCIAL_SHARE",
                    taskLink: "https://twitter.com/user/status/123456",
                    proofImages: ["https://cdn.example.com/image1.jpg", "https://cdn.example.com/image2.jpg"],
                    remark: "分享到Twitter，获得了100个点赞",
                },
            },
            contentCreation: {
                summary: "内容创作",
                value: {
                    taskType: "CONTENT_CREATION",
                    taskLink: "https://youtube.com/watch?v=xxx",
                    remark: "创作了游戏攻略视频",
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: "提交成功",
        schema: {
            example: {
                code: 200,
                message: "提交成功，请等待审核",
                data: {
                    submissionCode: "ES1733472000001234",
                    taskType: "SOCIAL_SHARE",
                    status: "PENDING",
                    createdAt: "2025-12-07T10:00:00.000Z",
                },
            },
        },
    })
    @ApiResponse({ status: 400, description: "请求参数错误" })
    @ApiResponse({ status: 404, description: "用户未加入合伙人计划" })
    @ApiResult()
    async submitTask(@Req() req: any, @Body() dto: SubmitExternalTaskDto): Promise<ResultData> {
        const userId = req.clientUser?.userId;

        // 通过 userId 查询合伙人档案
        const profile = await this.partnerService.getProfileByUserId(userId);
        if (!profile) {
            return ResultData.fail(404, "您还未加入合伙人计划，无法提交外部任务");
        }

        const submission = await this.externalTaskService.submitTask(profile.partnerId, profile.uid, dto);

        return ResultData.ok(
            {
                submissionCode: submission.submissionCode,
                taskType: submission.taskType,
                status: submission.status,
                createdAt: submission.createdAt,
            },
            "提交成功，请等待审核",
        );
    }

    /**
     * 查询我的提交记录
     * GET /api/biz/external-task/my-submissions
     */
    @Get("my-submissions")
    @AllowAnonymous()
    @UseGuards(ClientUserAuthGuard)
    @RequireClientUserAuth()
    @ApiOperation({
        summary: "查询我的提交记录（需要 ClientUserAuthGuard 认证）",
        description: "查询当前用户的所有外部任务提交记录，支持分页和筛选",
    })
    @ApiQuery({ name: "page", required: false, description: "页码，从1开始", example: 1 })
    @ApiQuery({ name: "pageSize", required: false, description: "每页数量，默认20", example: 20 })
    @ApiQuery({
        name: "status",
        required: false,
        description: "状态筛选：PENDING/APPROVED/REJECTED",
        example: "PENDING",
    })
    @ApiQuery({ name: "taskType", required: false, description: "任务类型筛选", example: "SOCIAL_SHARE" })
    @ApiResponse({
        status: 200,
        description: "成功获取提交记录",
        schema: {
            example: {
                code: 200,
                message: "success",
                data: {
                    items: [
                        {
                            id: "1",
                            submissionCode: "ES1733472000001234",
                            taskType: "SOCIAL_SHARE",
                            taskLink: "https://twitter.com/user/status/123456",
                            proofImages: ["https://cdn.example.com/image1.jpg"],
                            remark: "分享到Twitter",
                            status: "PENDING",
                            reviewRemark: null,
                            pointsAwarded: null,
                            createdAt: "2025-12-07T10:00:00.000Z",
                            reviewTime: null,
                        },
                    ],
                    total: 10,
                    page: 1,
                    pageSize: 20,
                },
            },
        },
    })
    @ApiResponse({ status: 404, description: "用户未加入合伙人计划" })
    @ApiResult()
    async getMySubmissions(@Req() req: any, @Query() dto: QuerySubmissionsDto): Promise<ResultData> {
        const userId = req.clientUser?.userId;

        // 通过 userId 查询合伙人档案
        const profile = await this.partnerService.getProfileByUserId(userId);
        if (!profile) {
            return ResultData.fail(404, "您还未加入合伙人计划");
        }

        const result = await this.externalTaskService.getMySubmissions(profile.partnerId, dto);

        return ResultData.ok(result);
    }

    /**
     * 修改被拒绝的提交
     * PUT /api/external-task/submissions/:id
     */
    @Put("submissions/:id")
    @AllowAnonymous()
    @UseGuards(ClientUserAuthGuard)
    @RequireClientUserAuth()
    @ApiOperation({
        summary: "修改被拒绝的提交（需要 ClientUserAuthGuard 认证）",
        description: "用户可以修改被拒绝的任务提交，修改后重新进入审核流程",
    })
    @ApiBody({
        type: UpdateSubmissionDto,
        examples: {
            updateLink: {
                summary: "修改任务链接",
                value: {
                    taskLink: "https://twitter.com/user/status/new123456",
                    remark: "已更新为正确的链接",
                },
            },
            updateImages: {
                summary: "修改证明图片",
                value: {
                    proofImages: ["https://cdn.example.com/new_image1.jpg", "https://cdn.example.com/new_image2.jpg"],
                    remark: "已重新上传清晰的截图",
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: "修改成功",
        schema: {
            example: {
                code: 200,
                message: "修改成功，已重新提交审核",
                data: {
                    submissionCode: "ES1733472000001234",
                    status: "PENDING",
                },
            },
        },
    })
    @ApiResponse({ status: 400, description: "只能修改被拒绝的提交" })
    @ApiResponse({ status: 404, description: "提交记录不存在" })
    @ApiResult()
    async updateSubmission(
        @Req() req: any,
        @Param("id") id: string,
        @Body() dto: UpdateSubmissionDto,
    ): Promise<ResultData> {
        const userId = req.clientUser?.userId;

        // 通过 userId 查询合伙人档案
        const profile = await this.partnerService.getProfileByUserId(userId);
        if (!profile) {
            return ResultData.fail(404, "您还未加入合伙人计划");
        }

        const submission = await this.externalTaskService.updateRejectedSubmission(profile.partnerId, id, dto);

        return ResultData.ok(
            {
                submissionCode: submission.submissionCode,
                status: submission.status,
            },
            "修改成功，已重新提交审核",
        );
    }
}

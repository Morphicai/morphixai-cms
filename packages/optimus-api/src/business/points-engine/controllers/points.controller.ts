import { Controller, Get, Post, Body, Query, UseGuards, Req, Logger } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse, ApiBody } from "@nestjs/swagger";
import { PointsService } from "../services/points.service";
import { TaskEngineService } from "../services/task-engine.service";
import { QueryPointsDto } from "../dto/query-points.dto";
import { NotifyTaskCompletionDto } from "../dto/notify-task-completion.dto";
import { ClientUserAuthGuard } from "../../../shared/guards/client-user-auth.guard";
import { JwtAuthGuard } from "../../../shared/guards/auth.guard";
import { AllowAnonymous } from "../../../shared/decorators/allow-anonymous.decorator";
import { RequireClientUserAuth } from "../../../shared/decorators/require-client-user-auth.decorator";
import { ResultData } from "../../../shared/utils/result";
import { ApiResult } from "../../../shared/decorators/api-result.decorator";
import { PartnerService } from "../../partner/partner.service";

/**
 * 积分控制器
 */
@ApiTags("积分系统")
@ApiBearerAuth()
@Controller("biz/points")
export class PointsController {
    private readonly logger = new Logger(PointsController.name);

    constructor(
        private readonly pointsService: PointsService,
        private readonly taskEngineService: TaskEngineService,
        private readonly partnerService: PartnerService,
    ) {}

    /**
     * 获取当前用户积分（C端接口）
     * GET /api/biz/points/me
     */
    @Get("me")
    @AllowAnonymous()
    @UseGuards(ClientUserAuthGuard)
    @RequireClientUserAuth()
    @ApiOperation({
        summary: "获取我的积分（需要 ClientUserAuthGuard 认证）",
        description: "C端用户查询自己的积分和明细",
    })
    @ApiQuery({
        name: "includeDetail",
        required: false,
        description: "是否包含积分明细",
        example: false,
    })
    @ApiResponse({
        status: 200,
        description: "成功获取积分",
        schema: {
            example: {
                code: 200,
                message: "success",
                data: {
                    totalPoints: 400,
                    detail: [
                        {
                            taskCode: "INVITE_V1",
                            taskType: "INVITE_SUCCESS",
                            points: 300,
                            businessParams: {
                                inviterPartnerCode: "LP123456",
                                downlinePartnerCode: "LP789012",
                            },
                            createdAt: "2025-12-06T11:00:00.000Z",
                        },
                        {
                            taskCode: "REGISTER_V1",
                            taskType: "REGISTER",
                            points: 100,
                            businessParams: {
                                partnerCode: "LP123456",
                            },
                            createdAt: "2025-12-06T10:00:00.000Z",
                        },
                    ],
                },
            },
        },
    })
    @ApiResponse({ status: 404, description: "用户未加入合伙人计划" })
    @ApiResult()
    async getMyPoints(@Req() req: any, @Query() dto: QueryPointsDto): Promise<ResultData> {
        const userId = req.clientUser?.userId;

        this.logger.log(`C端查询用户积分: userId=${userId}`);

        // 通过 userId 查询合伙人档案
        const profile = await this.partnerService.getProfileByUserId(userId);
        if (!profile) {
            return ResultData.fail(404, "用户未加入合伙人计划");
        }

        const partnerId = profile.partnerId;
        this.logger.log(`查询用户积分: partnerId=${partnerId}`);

        if (dto.includeDetail) {
            // 返回积分明细
            const detail = await this.pointsService.getUserPointsDetail(partnerId);
            const totalPoints = detail.reduce((sum, item) => sum + item.points, 0);

            return ResultData.ok({
                totalPoints,
                detail,
            });
        } else {
            // 只返回总积分
            const totalPoints = await this.pointsService.getUserPoints(partnerId);

            return ResultData.ok({
                totalPoints,
            });
        }
    }

    /**
     * 通知任务完成（C端接口）
     * POST /api/biz/points/notify
     */
    @Post("notify")
    @AllowAnonymous()
    @UseGuards(ClientUserAuthGuard)
    @RequireClientUserAuth()
    @ApiOperation({
        summary: "通知任务完成（需要 ClientUserAuthGuard 认证）",
        description: "C端通知后端某个任务已完成，系统会根据任务配置自动计算并记录积分",
    })
    @ApiBody({
        type: NotifyTaskCompletionDto,
        examples: {
            gameLevelUp: {
                summary: "游戏升级任务",
                value: {
                    taskCode: "GAME_LEVEL_UP",
                    businessParams: {
                        level: 10,
                    },
                    eventTime: 1733472000000,
                },
            },
            firstRecharge: {
                summary: "首次充值任务",
                value: {
                    taskCode: "FIRST_RECHARGE",
                    businessParams: {
                        amount: 100,
                        currency: "USD",
                    },
                    eventTime: 1733472000000,
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: "任务完成通知已接收",
        schema: {
            example: {
                code: 200,
                message: "任务完成通知已接收",
                data: {
                    processed: true,
                    message: "任务已处理",
                },
            },
        },
    })
    @ApiResponse({ status: 400, description: "任务代码无效或参数错误" })
    @ApiResponse({ status: 404, description: "用户未加入合伙人计划" })
    @ApiResult()
    async notifyTaskCompletion(@Req() req: any, @Body() dto: NotifyTaskCompletionDto): Promise<ResultData> {
        const userId = req.clientUser?.userId;

        this.logger.log(`C端通知任务完成: userId=${userId}, taskCode=${dto.taskCode}`);

        // 通过 userId 查询合伙人档案
        const profile = await this.partnerService.getProfileByUserId(userId);
        if (!profile) {
            return ResultData.fail(404, "用户未加入合伙人计划");
        }

        // 构造通用事件并处理
        const event = {
            taskCode: dto.taskCode,
            partnerId: profile.partnerId,
            partnerCode: profile.partnerCode,
            uid: profile.uid,
            timestamp: dto.eventTime,
            businessParams: dto.businessParams || {},
        };

        try {
            await this.taskEngineService.processGameActionEvent(event);

            return ResultData.ok(
                {
                    processed: true,
                    message: "任务已处理",
                },
                "任务完成通知已接收",
            );
        } catch (error) {
            this.logger.error(`处理任务完成通知失败: ${error.message}`, error.stack);
            return ResultData.fail(400, `处理任务失败: ${error.message}`);
        }
    }

    /**
     * 查询指定用户积分（管理后台）
     * GET /api/biz/points/admin/:partnerId
     */
    @Get("admin/:partnerId")
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: "查询指定用户积分（管理后台，需要JWT认证）",
        description: "管理员查询指定合伙人的积分和明细",
    })
    @ApiQuery({
        name: "includeDetail",
        required: false,
        description: "是否包含积分明细",
        example: false,
    })
    @ApiResponse({
        status: 200,
        description: "成功获取积分",
        schema: {
            example: {
                code: 200,
                message: "success",
                data: {
                    totalPoints: 400,
                    detail: [
                        {
                            taskCode: "INVITE_V1",
                            taskType: "INVITE_SUCCESS",
                            points: 300,
                            businessParams: {
                                inviterPartnerCode: "LP123456",
                                downlinePartnerCode: "LP789012",
                            },
                            createdAt: "2025-12-06T11:00:00.000Z",
                        },
                    ],
                },
            },
        },
    })
    @ApiResponse({ status: 404, description: "合伙人不存在" })
    @ApiResult()
    async getUserPoints(@Req() req: any, @Query() dto: QueryPointsDto): Promise<ResultData> {
        const partnerId = req.params.partnerId;

        this.logger.log(`管理员查询用户积分: partnerId=${partnerId}`);

        // 验证合伙人是否存在
        const profile = await this.partnerService.getProfileById(partnerId);
        if (!profile) {
            return ResultData.fail(404, "合伙人不存在");
        }

        if (dto.includeDetail) {
            const detail = await this.pointsService.getUserPointsDetail(partnerId);
            const totalPoints = detail.reduce((sum, item) => sum + item.points, 0);

            return ResultData.ok({
                totalPoints,
                detail,
            });
        } else {
            const totalPoints = await this.pointsService.getUserPoints(partnerId);

            return ResultData.ok({
                totalPoints,
            });
        }
    }

    /**
     * 获取缓存统计信息（调试接口）
     * GET /api/biz/points/cache/stats
     */
    @Get("cache/stats")
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: "获取缓存统计信息（调试用）",
        description: "查看积分缓存的命中率和大小",
    })
    @ApiResponse({
        status: 200,
        description: "缓存统计信息",
        schema: {
            example: {
                code: 200,
                message: "success",
                data: {
                    points: {
                        size: 150,
                        hitRate: 0.85,
                    },
                    detail: {
                        size: 80,
                        hitRate: 0.78,
                    },
                },
            },
        },
    })
    @ApiResult()
    async getCacheStats(): Promise<ResultData> {
        const stats = this.pointsService.getCacheStats();
        return ResultData.ok(stats);
    }

    /**
     * 手动清除指定用户的缓存（调试接口）
     * POST /api/biz/points/cache/invalidate/:partnerId
     */
    @Post("cache/invalidate/:partnerId")
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: "清除指定用户的缓存（调试用）",
        description: "手动使指定用户的积分缓存失效",
    })
    @ApiResponse({
        status: 200,
        description: "缓存已清除",
    })
    @ApiResult()
    async invalidateUserCache(@Req() req: any): Promise<ResultData> {
        const partnerId = req.params.partnerId;

        this.logger.log(`手动清除用户缓存: partnerId=${partnerId}`);

        this.pointsService.invalidateUserCache(partnerId);

        return ResultData.ok(null, "缓存已清除");
    }

    /**
     * 按月统计积分（C端接口）
     * GET /api/biz/points/monthly-summary
     */
    @Get("monthly-summary")
    @AllowAnonymous()
    @UseGuards(ClientUserAuthGuard)
    @RequireClientUserAuth()
    @ApiOperation({
        summary: "按月统计积分（需要 ClientUserAuthGuard 认证）",
        description: "C端用户查询自己的积分按月统计，包括本月、上月和历史记录",
    })
    @ApiResponse({
        status: 200,
        description: "成功获取月度统计",
        schema: {
            example: {
                code: 200,
                message: "success",
                data: {
                    thisMonth: {
                        earned: "500",
                        spent: "0",
                    },
                    lastMonth: {
                        earned: "300",
                        spent: "0",
                    },
                    history: [
                        {
                            month: "2025-12",
                            earned: "500",
                            spent: "0",
                        },
                        {
                            month: "2025-11",
                            earned: "300",
                            spent: "0",
                        },
                    ],
                },
            },
        },
    })
    @ApiResponse({ status: 404, description: "用户未加入合伙人计划" })
    @ApiResult()
    async getMonthlySummary(@Req() req: any): Promise<ResultData> {
        const userId = req.clientUser?.userId;

        this.logger.log(`C端查询月度积分统计: userId=${userId}`);

        // 通过 userId 查询合伙人档案
        const profile = await this.partnerService.getProfileByUserId(userId);
        if (!profile) {
            return ResultData.fail(404, "用户未加入合伙人计划");
        }

        const summary = await this.pointsService.getMonthlySummary(profile.partnerId);

        return ResultData.ok(summary);
    }
}

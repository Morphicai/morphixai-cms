import { Controller, Get, Post, Param, Body, Query, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery, ApiParam } from "@nestjs/swagger";
import { ExternalTaskService } from "../services/external-task.service";
import { QuerySubmissionsDto } from "../dto/query-submissions.dto";
import { ApproveSubmissionDto } from "../dto/approve-submission.dto";
import { RejectSubmissionDto } from "../dto/reject-submission.dto";
import { JwtAuthGuard } from "../../../shared/guards/auth.guard";
import { RolesGuard } from "../../../shared/guards/roles.guard";
import { PartnerService } from "../../partner/partner.service";

@ApiTags("外部任务（管理后台）")
@ApiBearerAuth()
@Controller("admin/external-task")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExternalTaskAdminController {
    constructor(
        private readonly externalTaskService: ExternalTaskService,
        private readonly partnerService: PartnerService,
    ) {}

    /**
     * 查询提交记录列表（管理后台）
     */
    @Get("submissions")
    @ApiOperation({ summary: "查询提交记录列表" })
    @ApiQuery({ name: "page", required: false, description: "页码", example: 1 })
    @ApiQuery({ name: "pageSize", required: false, description: "每页数量", example: 20 })
    @ApiQuery({ name: "status", required: false, description: "状态筛选", example: "PENDING" })
    @ApiQuery({ name: "taskType", required: false, description: "任务类型筛选" })
    @ApiQuery({ name: "partnerId", required: false, description: "合伙人ID筛选" })
    @ApiResponse({
        status: 200,
        description: "成功获取提交记录列表",
    })
    async getSubmissions(@Query() dto: QuerySubmissionsDto) {
        const result = await this.externalTaskService.getSubmissions(dto);

        return {
            success: true,
            data: result,
        };
    }

    /**
     * 获取提交详情（带合伙人信息）
     */
    @Get("submissions/:id")
    @ApiOperation({ summary: "获取提交详情（含合伙人信息）" })
    @ApiParam({ name: "id", description: "提交记录ID" })
    @ApiResponse({
        status: 200,
        description: "成功获取提交详情",
        schema: {
            example: {
                success: true,
                data: {
                    submission: {
                        id: "1",
                        submissionCode: "ES1733472000001234",
                        taskType: "DOUYIN_SHORT_VIDEO",
                        partnerId: "123",
                        uid: "user123",
                        taskLink: "https://www.douyin.com/video/xxx",
                        proofImages: ["https://cdn.example.com/image1.jpg"],
                        remark: "已完成视频发布",
                        status: "PENDING",
                        createdAt: "2025-12-07T10:00:00.000Z",
                    },
                    partner: {
                        partnerId: "123",
                        uid: "user123",
                        teamName: "测试团队",
                        level: 1,
                        totalPoints: 50000,
                        availablePoints: 30000,
                        totalInvites: 10,
                        directInvites: 5,
                        createdAt: "2025-01-01T00:00:00.000Z",
                    },
                },
            },
        },
    })
    async getSubmissionById(@Param("id") id: string) {
        const submission = await this.externalTaskService.getSubmissionById(id);

        // 获取合伙人信息
        let partnerInfo = null;
        try {
            partnerInfo = await this.partnerService.getProfileById(submission.partnerId);
        } catch (error) {
            // 合伙人信息获取失败不影响主流程
            console.error("获取合伙人信息失败:", error);
        }

        return {
            success: true,
            data: {
                submission,
                partner: partnerInfo,
            },
        };
    }

    /**
     * 审核通过
     */
    @Post("submissions/:id/approve")
    @ApiOperation({ summary: "审核通过" })
    @ApiParam({ name: "id", description: "提交记录ID" })
    @ApiResponse({
        status: 200,
        description: "审核通过成功",
        schema: {
            example: {
                success: true,
                message: "审核通过",
                data: {
                    submissionCode: "ES1733472000001234",
                    status: "APPROVED",
                    pointsAwarded: 2000,
                },
            },
        },
    })
    async approveSubmission(@Param("id") id: string, @Req() req: any, @Body() dto: ApproveSubmissionDto) {
        const reviewerId = req.user.id;

        const submission = await this.externalTaskService.approveSubmission(id, reviewerId, dto);

        return {
            success: true,
            message: "审核通过",
            data: {
                submissionCode: submission.submissionCode,
                status: submission.status,
                pointsAwarded: submission.pointsAwarded,
            },
        };
    }

    /**
     * 审核拒绝
     */
    @Post("submissions/:id/reject")
    @ApiOperation({ summary: "审核拒绝" })
    @ApiParam({ name: "id", description: "提交记录ID" })
    @ApiResponse({
        status: 200,
        description: "审核拒绝成功",
        schema: {
            example: {
                success: true,
                message: "审核拒绝",
                data: {
                    submissionCode: "ES1733472000001234",
                    status: "REJECTED",
                },
            },
        },
    })
    async rejectSubmission(@Param("id") id: string, @Req() req: any, @Body() dto: RejectSubmissionDto) {
        const reviewerId = req.user.id;

        const submission = await this.externalTaskService.rejectSubmission(id, reviewerId, dto);

        return {
            success: true,
            message: "审核拒绝",
            data: {
                submissionCode: submission.submissionCode,
                status: submission.status,
            },
        };
    }

    /**
     * 获取审核统计
     */
    @Get("statistics")
    @ApiOperation({ summary: "获取审核统计" })
    @ApiResponse({
        status: 200,
        description: "成功获取统计数据",
        schema: {
            example: {
                success: true,
                data: {
                    pendingCount: 25,
                    approvedCount: 150,
                    rejectedCount: 10,
                    todayReviewCount: 30,
                },
            },
        },
    })
    async getStatistics() {
        const statistics = await this.externalTaskService.getStatistics();

        return {
            success: true,
            data: statistics,
        };
    }
}

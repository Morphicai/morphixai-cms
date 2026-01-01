import { Controller, Get, Put, Post, Delete, Query, Param, Body, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../../shared/guards/auth.guard";
import { RolesGuard } from "../../../shared/guards/roles.guard";
import { SuperAdminGuard } from "../../../shared/guards/super-admin.guard";
import { ConfigService } from "@nestjs/config";
import { PartnerService } from "../partner.service";
import { StatisticsService } from "../statistics.service";
import { HierarchyService } from "../hierarchy.service";
import { ChannelService } from "../channel.service";
import { QueryPartnersDto } from "../dto/query-partners.dto";
import { QueryTeamDto } from "../dto/query-team.dto";
import { FreezePartnerDto } from "../dto/freeze-partner.dto";
import { CorrectUplinkDto } from "../dto/correct-uplink.dto";
import { UpdateRemarkDto } from "../dto/update-remark.dto";
import { ClearPartnerDataDto } from "../dto/clear-partner-data.dto";
import { ClearAllPartnerDataDto } from "../dto/clear-all-partner-data.dto";
import { ResultData } from "../../../shared/utils/result";
import { ForbiddenException } from "@nestjs/common";

/**
 * 合伙人管理后台控制器
 * 提供给管理员使用的接口
 */
@ApiTags("合伙人管理后台")
@ApiBearerAuth()
@Controller("biz/partner/admin")
@UseGuards(JwtAuthGuard)
export class PartnerAdminController {
    constructor(
        private readonly partnerService: PartnerService,
        private readonly statisticsService: StatisticsService,
        private readonly hierarchyService: HierarchyService,
        private readonly channelService: ChannelService,
        private readonly configService: ConfigService,
    ) {}

    /**
     * 获取总览数据
     */
    @Get("dashboard")
    @ApiOperation({ summary: "获取合伙人系统总览数据" })
    async getDashboard() {
        const dashboard = await this.statisticsService.getDashboard();
        return ResultData.ok(dashboard);
    }

    /**
     * 查询合伙人列表
     */
    @Get("partners")
    @ApiOperation({ summary: "查询合伙人列表" })
    async getPartners(@Query() dto: QueryPartnersDto) {
        const result = await this.partnerService.queryPartners(dto);
        return ResultData.ok(result);
    }

    /**
     * 获取合伙人详情
     */
    @Get("partners/:partnerId")
    @ApiOperation({ summary: "获取合伙人详情" })
    @ApiParam({ name: "partnerId", description: "合伙人ID" })
    async getPartnerDetail(@Param("partnerId") partnerId: string) {
        const profile = await this.partnerService.getProfileByIdWithUplink(partnerId);
        return ResultData.ok(profile);
    }

    /**
     * 获取合伙人的团队成员
     */
    @Get("partners/:partnerId/team")
    @ApiOperation({ summary: "获取合伙人的团队成员" })
    @ApiParam({ name: "partnerId", description: "合伙人ID" })
    async getPartnerTeam(@Param("partnerId") partnerId: string, @Query() dto: QueryTeamDto) {
        const level = (dto.depth || 1) as 1 | 2;
        const result = await this.hierarchyService.getDownlines(partnerId, level, {
            page: dto.page,
            pageSize: dto.pageSize,
        });
        return ResultData.ok(result);
    }

    /**
     * 获取合伙人的积分明细
     */
    @Get("partners/:partnerId/points")
    @ApiOperation({ summary: "获取合伙人的积分明细" })
    @ApiParam({ name: "partnerId", description: "合伙人ID" })
    async getPartnerPoints(
        @Param("partnerId") partnerId: string,
        @Query("page") page = 1,
        @Query("pageSize") pageSize = 20,
    ) {
        const result = await this.statisticsService.getPartnerPoints(partnerId, page, pageSize);
        return ResultData.ok(result);
    }

    /**
     * 获取合伙人的任务日志
     */
    @Get("partners/:partnerId/task-logs")
    @ApiOperation({ summary: "获取合伙人的任务日志" })
    @ApiParam({ name: "partnerId", description: "合伙人ID" })
    async getPartnerTaskLogs(
        @Param("partnerId") partnerId: string,
        @Query("page") page = 1,
        @Query("pageSize") pageSize = 20,
    ) {
        const result = await this.statisticsService.getPartnerTaskLogs(partnerId, page, pageSize);
        return ResultData.ok(result);
    }

    /**
     * 分析合伙人的邀请任务一致性
     */
    @Get("partners/:partnerId/analyze-invite-tasks")
    @ApiOperation({ summary: "分析合伙人的邀请任务一致性" })
    @ApiParam({ name: "partnerId", description: "合伙人ID" })
    async analyzeInviteTasks(@Param("partnerId") partnerId: string) {
        const result = await this.partnerService.analyzeInviteTasks(partnerId);
        return ResultData.ok(result);
    }

    /**
     * 修复合伙人缺失的邀请任务
     */
    @Post("partners/:partnerId/fix-invite-tasks")
    @ApiOperation({ summary: "修复合伙人缺失的邀请任务" })
    @ApiParam({ name: "partnerId", description: "合伙人ID" })
    async fixInviteTasks(@Param("partnerId") partnerId: string, @Req() req: any) {
        const adminId = req.user.id;
        const result = await this.partnerService.fixMissingInviteTasks(partnerId, adminId);
        return ResultData.ok(result);
    }

    /**
     * 获取合伙人的渠道列表
     */
    @Get("partners/:partnerId/channels")
    @ApiOperation({ summary: "获取合伙人的渠道列表" })
    @ApiParam({ name: "partnerId", description: "合伙人ID" })
    async getPartnerChannels(@Param("partnerId") partnerId: string) {
        const channels = await this.channelService.getChannels(partnerId);
        return ResultData.ok(channels);
    }

    /**
     * 冻结合伙人
     */
    @Put("partners/:partnerId/freeze")
    @ApiOperation({ summary: "冻结合伙人" })
    @ApiParam({ name: "partnerId", description: "合伙人ID" })
    async freezePartner(@Param("partnerId") partnerId: string, @Body() dto: FreezePartnerDto, @Req() req: any) {
        const adminId = req.user.id;
        await this.partnerService.freezePartner(partnerId, adminId, dto.reason);
        return ResultData.ok();
    }

    /**
     * 解冻合伙人
     */
    @Put("partners/:partnerId/unfreeze")
    @ApiOperation({ summary: "解冻合伙人" })
    @ApiParam({ name: "partnerId", description: "合伙人ID" })
    async unfreezePartner(@Param("partnerId") partnerId: string, @Req() req: any) {
        const adminId = req.user.id;
        await this.partnerService.unfreezePartner(partnerId, adminId);
        return ResultData.ok();
    }

    /**
     * 纠正上级关系
     */
    @Post("partners/:partnerId/correct-uplink")
    @ApiOperation({ summary: "纠正上级关系" })
    @ApiParam({ name: "partnerId", description: "合伙人ID" })
    async correctUplink(@Param("partnerId") partnerId: string, @Body() dto: CorrectUplinkDto, @Req() req: any) {
        const adminId = req.user.id;
        await this.hierarchyService.correctUplink(partnerId, dto.newParentId, adminId, dto.reason);
        return ResultData.ok();
    }

    /**
     * 更新备注
     */
    @Put("partners/:partnerId/remark")
    @ApiOperation({ summary: "更新备注" })
    @ApiParam({ name: "partnerId", description: "合伙人ID" })
    async updateRemark(@Param("partnerId") partnerId: string, @Body() dto: UpdateRemarkDto, @Req() req: any) {
        const adminId = req.user.id;
        await this.partnerService.updateRemark(partnerId, dto.remark, adminId);
        return ResultData.ok();
    }

    /**
     * 刷新积分缓存
     */
    @Post("cache/refresh")
    @ApiOperation({
        summary: "刷新积分缓存",
        description: "清空所有合伙人的积分缓存，下次查询时会重新计算",
    })
    @ApiResponse({ status: 200, description: "刷新成功" })
    async refreshCache(@Req() req: any) {
        const adminId = req.user.id;
        await this.partnerService.refreshAllCache(adminId);

        return ResultData.ok({
            message: "积分缓存已刷新",
            refreshedBy: adminId,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * 清空单个合伙人数据（危险操作）
     * 需要环境变量 ENABLE_PARTNER_DATA_CLEAR=true 且只有超级管理员可用
     */
    @Delete("partners/:partnerId/clear-data")
    @UseGuards(SuperAdminGuard)
    @ApiOperation({
        summary: "清空单个合伙人数据（危险操作，仅超级管理员）",
        description:
            "清空指定合伙人的所有业务数据，包括：层级关系、推广渠道、任务记录、积分等。需要环境变量 ENABLE_PARTNER_DATA_CLEAR=true",
    })
    @ApiParam({ name: "partnerId", description: "合伙人ID" })
    @ApiResponse({ status: 200, description: "清空成功" })
    @ApiResponse({ status: 403, description: "功能未启用或权限不足" })
    async clearPartnerData(@Param("partnerId") partnerId: string, @Body() dto: ClearPartnerDataDto, @Req() req: any) {
        // 检查环境变量是否启用此功能
        const isEnabled = this.configService.get<string>("ENABLE_PARTNER_DATA_CLEAR") === "true";

        if (!isEnabled) {
            throw new ForbiddenException("合伙人数据清空功能未启用，请在环境变量中设置 ENABLE_PARTNER_DATA_CLEAR=true");
        }

        const adminId = req.user.id;
        await this.partnerService.clearPartnerData(partnerId, adminId, dto.reason);

        return ResultData.ok({
            message: "合伙人数据已清空",
            partnerId,
            clearedBy: adminId,
            reason: dto.reason,
        });
    }

    /**
     * 清空所有合伙人数据（极度危险操作）
     * 需要环境变量 ENABLE_PARTNER_DATA_CLEAR=true 且只有超级管理员可用
     */
    @Delete("partners/clear-all-data")
    @UseGuards(SuperAdminGuard)
    @ApiOperation({
        summary: "清空所有合伙人数据（极度危险操作，仅超级管理员）",
        description:
            "清空所有合伙人的业务数据，包括：层级关系、推广渠道、任务记录、积分等。需要环境变量 ENABLE_PARTNER_DATA_CLEAR=true 且必须输入确认文本",
    })
    @ApiResponse({ status: 200, description: "清空成功" })
    @ApiResponse({ status: 403, description: "功能未启用或权限不足" })
    @ApiResponse({ status: 400, description: "确认文本错误" })
    async clearAllPartnerData(@Body() dto: ClearAllPartnerDataDto, @Req() req: any) {
        // 检查环境变量是否启用此功能
        const isEnabled = this.configService.get<string>("ENABLE_PARTNER_DATA_CLEAR") === "true";

        if (!isEnabled) {
            throw new ForbiddenException("合伙人数据清空功能未启用，请在环境变量中设置 ENABLE_PARTNER_DATA_CLEAR=true");
        }

        const adminId = req.user.id;
        const result = await this.partnerService.clearAllPartnerData(adminId, dto.reason, dto.confirmText);

        return ResultData.ok({
            message: "所有合伙人数据已清空",
            ...result,
            clearedBy: adminId,
            reason: dto.reason,
        });
    }
}

import { Controller, Post, Get, Put, Body, Query, Param, UseGuards, Req, UseInterceptors } from "@nestjs/common";
import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiExtraModels,
    ApiResponse,
    ApiBody,
    ApiParam,
    ApiQuery,
} from "@nestjs/swagger";
import { PartnerService } from "./partner.service";
import { ChannelService } from "./channel.service";
import { StatisticsService } from "./statistics.service";
import { HierarchyService } from "./hierarchy.service";
import { JoinPartnerDto } from "./dto/join-partner.dto";
import { CreateChannelDto } from "./dto/create-channel.dto";
import { QueryTeamDto } from "./dto/query-team.dto";
import { QueryPartnersDto } from "./dto/query-partners.dto";
import { FreezePartnerDto } from "./dto/freeze-partner.dto";
import { CorrectUplinkDto } from "./dto/correct-uplink.dto";
import { UpdateRemarkDto } from "./dto/update-remark.dto";
import { UpdateMiraDto } from "./dto/update-mira.dto";
import { UpdateStarDto } from "./dto/update-star.dto";
import { SetUplinkDto } from "./dto/set-uplink.dto";
import { UpdateTeamNameDto } from "./dto/update-team-name.dto";
import { ClientUserAuthGuard } from "../../shared/guards/client-user-auth.guard";
import { JwtAuthGuard } from "../../shared/guards/auth.guard";
import { RequireClientUserAuth } from "../../shared/decorators/require-client-user-auth.decorator";
import { AllowAnonymous } from "../../shared/decorators/allow-anonymous.decorator";
import { ResultData } from "../../shared/utils/result";
import { ApiResult } from "../../shared/decorators/api-result.decorator";
import { OperationLog } from "../../shared/decorators/operation-log.decorator";
import { OperationLogInterceptor } from "../../shared/interceptors/operation-log.interceptor";

@ApiTags("合伙人计划")
@ApiBearerAuth()
@ApiExtraModels(ResultData)
@Controller("biz/partner")
@UseInterceptors(OperationLogInterceptor)
export class PartnerController {
    constructor(
        private readonly partnerService: PartnerService,
        private readonly channelService: ChannelService,
        private readonly statisticsService: StatisticsService,
        private readonly hierarchyService: HierarchyService,
    ) {}

    /**
     * 加入合伙人计划
     * POST /api/biz/partner/join
     */
    @Post("join")
    @AllowAnonymous()
    @UseGuards(ClientUserAuthGuard)
    @RequireClientUserAuth()
    @ApiOperation({
        summary: "加入合伙人计划（需要 ClientUserAuthGuard 认证）",
        description: `用户加入合伙人计划，支持灵活的加入方式：
        
**自建团队模式**：
- 不传 inviterCode，用户自己创建团队，无上级关系
- 可选传入 teamName 设置团队名称

**通过邀请加入**：
- 传入 inviterCode（邀请人的合伙人编号，如 LP123456）
- 可选传入 channelCode（推广渠道码）
- 可选传入 teamName 设置团队名称
- 系统会验证邀请人和渠道的有效性

**幂等性与上级设置**：
- 如果用户已是合伙人，返回现有档案
- 如果已是合伙人但没有上级，且本次传入了 inviterCode，会自动设置上级
- 如果已有上级，则忽略本次的 inviterCode`,
    })
    @ApiBody({
        type: JoinPartnerDto,
        examples: {
            self: {
                summary: "自建团队",
                value: {
                    userRegisterTime: 1733472000000,
                    teamName: "我的战队",
                    username: "张三",
                },
            },
            selfWithoutTeamName: {
                summary: "自建团队（不设置团队名称）",
                value: {
                    userRegisterTime: 1733472000000,
                    username: "李四",
                },
            },
            invite: {
                summary: "通过邀请加入（无渠道）",
                value: {
                    inviterCode: "LP123456",
                    userRegisterTime: 1733472000000,
                    username: "王五",
                },
            },
            inviteWithChannel: {
                summary: "通过推广链接加入（有渠道和团队名称）",
                value: {
                    inviterCode: "LP123456",
                    channelCode: "ABC123",
                    userRegisterTime: 1733472000000,
                    teamName: "精英战队",
                    username: "赵六",
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: "成功加入合伙人计划",
        schema: {
            example: {
                code: 200,
                message: "success",
                data: {
                    partnerId: 1,
                    uid: "wemade_user_123",
                    username: "张三",
                    partnerCode: "LP123456",
                    status: "active",
                    currentStar: "NEW",
                    totalMira: 0,
                    joinTime: "2025-12-05T10:00:00.000Z",
                    lastUpdateTime: "2025-12-05T10:00:00.000Z",
                    remark: null,
                    extraData: null,
                    teamName: "我的战队",
                },
            },
        },
    })
    @ApiResponse({ status: 400, description: "请求参数错误" })
    @ApiResponse({ status: 404, description: "邀请人不存在或渠道无效" })
    @ApiResult()
    @OperationLog({
        module: "partner",
        action: "join",
        description: "加入合伙人计划",
        recordResponse: false,
    })
    async joinPartner(@Body() dto: JoinPartnerDto, @Req() req: any): Promise<ResultData> {
        const userId = req.clientUser?.userId;
        const profile = await this.partnerService.joinPartner(userId, dto);
        return ResultData.ok(profile);
    }

    /**
     * 获取我的合伙人档案
     * GET /api/biz/partner/profile
     */
    @Get("profile")
    @AllowAnonymous()
    @UseGuards(ClientUserAuthGuard)
    @RequireClientUserAuth()
    @ApiOperation({
        summary: "获取我的合伙人档案（需要 ClientUserAuthGuard 认证）",
        description: "获取当前登录用户的合伙人档案信息，包括合伙人编号、星级、积分等，以及上级信息",
    })
    @ApiResponse({
        status: 200,
        description: "成功获取档案",
        schema: {
            example: {
                code: 200,
                message: "success",
                data: {
                    partnerId: 1,
                    uid: "wemade_user_123",
                    username: "张三",
                    partnerCode: "LP123456",
                    status: "active",
                    currentStar: "S1",
                    totalMira: 1000,
                    joinTime: "2025-12-01T10:00:00.000Z",
                    lastUpdateTime: "2025-12-05T10:00:00.000Z",
                    remark: null,
                    extraData: null,
                    teamName: "我的战队",
                    uplink: {
                        partnerId: "10",
                        partnerCode: "LP999999",
                        uid: "wemade_user_999",
                    },
                },
            },
        },
    })
    @ApiResponse({ status: 404, description: "合伙人档案不存在" })
    @ApiResult()
    async getProfile(@Req() req: any): Promise<ResultData> {
        const userId = req.clientUser?.userId;
        const profile = await this.partnerService.getProfileWithUplink(userId);

        if (!profile) {
            return ResultData.fail(404, "合伙人档案不存在");
        }

        return ResultData.ok(profile);
    }

    /**
     * 获取我的团队列表
     * GET /api/biz/partner/team
     */
    @Get("team")
    @AllowAnonymous()
    @UseGuards(ClientUserAuthGuard)
    @RequireClientUserAuth()
    @ApiOperation({
        summary: "获取我的团队列表（需要 ClientUserAuthGuard 认证）",
        description: "获取当前合伙人的团队成员列表，支持按深度过滤和分页。depth=2时返回树状结构（包含children）",
    })
    @ApiQuery({
        name: "depth",
        required: false,
        description: "深度：1=一级下线，2=包含二级下线的树状结构，默认为1",
        example: 1,
    })
    @ApiQuery({ name: "page", required: true, description: "页码，从1开始", example: 1 })
    @ApiQuery({ name: "pageSize", required: true, description: "每页数量", example: 10 })
    @ApiResponse({
        status: 200,
        description: "成功获取团队列表",
        schema: {
            example: {
                code: 200,
                message: "success",
                data: {
                    items: [
                        {
                            partnerId: "2",
                            uid: "wemade_user_456",
                            partnerCode: "LP234567",
                            currentStar: "NEW",
                            joinTime: "2025-12-02T10:00:00.000Z",
                            sourceChannelId: "1",
                            children: [
                                {
                                    partnerId: "3",
                                    uid: "wemade_user_789",
                                    partnerCode: "LP345678",
                                    currentStar: "NEW",
                                    joinTime: "2025-12-03T10:00:00.000Z",
                                    sourceChannelId: "1",
                                },
                            ],
                        },
                    ],
                    total: 1,
                    page: 1,
                    pageSize: 10,
                },
            },
        },
    })
    @ApiResponse({ status: 404, description: "合伙人档案不存在" })
    @ApiResult()
    async getTeam(@Query() queryDto: QueryTeamDto, @Req() req: any): Promise<ResultData> {
        const userId = req.clientUser?.userId;

        // 通过userId查询partnerId
        const profile = await this.partnerService.getProfileByUserId(userId);
        if (!profile) {
            return ResultData.fail(404, "合伙人档案不存在");
        }

        // 如果没有指定depth，默认查询一级下线
        const depth = queryDto.depth || 1;

        const result = await this.statisticsService.getTeamMembers(profile.partnerId, depth, {
            page: queryDto.page,
            pageSize: queryDto.pageSize,
        });

        return ResultData.ok(result);
    }

    /**
     * 获取我的团队概览
     * GET /api/biz/partner/overview
     */
    @Get("overview")
    @AllowAnonymous()
    @UseGuards(ClientUserAuthGuard)
    @RequireClientUserAuth()
    @ApiOperation({
        summary: "获取我的团队概览（需要 ClientUserAuthGuard 认证）",
        description: "获取当前合伙人的团队统计概览，包括一级和二级下线总数",
    })
    @ApiResponse({
        status: 200,
        description: "成功获取团队概览",
        schema: {
            example: {
                code: 200,
                message: "success",
                data: {
                    totalL1: 5,
                    totalL2: 12,
                },
            },
        },
    })
    @ApiResponse({ status: 404, description: "合伙人档案不存在" })
    @ApiResult()
    async getOverview(@Req() req: any): Promise<ResultData> {
        const userId = req.clientUser?.userId;

        // 通过userId查询partnerId
        const profile = await this.partnerService.getProfileByUserId(userId);
        if (!profile) {
            return ResultData.fail(404, "合伙人档案不存在");
        }

        const overview = await this.statisticsService.getTeamOverview(profile.partnerId);

        return ResultData.ok(overview);
    }

    /**
     * 创建推广渠道
     * POST /api/biz/partner/channels
     */
    @Post("channels")
    @AllowAnonymous()
    @UseGuards(ClientUserAuthGuard)
    @RequireClientUserAuth()
    @ApiOperation({
        summary: "创建推广渠道（需要 ClientUserAuthGuard 认证）",
        description:
            "为当前合伙人创建新的推广渠道。可以自定义6位渠道码（大写字母+数字），或不传则自动生成。shortUrl 返回短链token（6位字符），前端需拼接完整URL",
    })
    @ApiBody({
        type: CreateChannelDto,
        examples: {
            autoGenerate: {
                summary: "自动生成渠道码",
                value: {
                    name: "抖音直播间",
                },
            },
            customCode: {
                summary: "自定义渠道码",
                value: {
                    name: "微信群1群",
                    channelCode: "WX0001",
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: "成功创建渠道",
        schema: {
            example: {
                code: 200,
                message: "success",
                data: {
                    id: 1,
                    partnerId: 1,
                    channelCode: "ABC123",
                    name: "抖音直播间",
                    shortUrl: "aB3xY9",
                    status: "active",
                    createdAt: "2025-12-05T10:00:00.000Z",
                    updatedAt: "2025-12-05T10:00:00.000Z",
                },
            },
        },
    })
    @ApiResponse({ status: 400, description: "请求参数错误或渠道码已存在" })
    @ApiResponse({ status: 403, description: "合伙人已被冻结" })
    @ApiResponse({ status: 404, description: "合伙人档案不存在" })
    @ApiResult()
    @OperationLog({
        module: "partner",
        action: "create_channel",
        description: "创建推广渠道",
        recordResponse: false,
    })
    async createChannel(@Body() dto: CreateChannelDto, @Req() req: any): Promise<ResultData> {
        const userId = req.clientUser?.userId;

        // 通过userId查询partnerId
        const profile = await this.partnerService.getProfileByUserId(userId);
        if (!profile) {
            return ResultData.fail(404, "合伙人档案不存在");
        }

        const channel = await this.channelService.createChannel(profile.partnerId, dto.name, dto.channelCode);

        return ResultData.ok(channel);
    }

    /**
     * 设置上级
     * POST /api/biz/partner/set-uplink
     */
    @Post("set-uplink")
    @AllowAnonymous()
    @UseGuards(ClientUserAuthGuard)
    @RequireClientUserAuth()
    @ApiOperation({
        summary: "设置上级（需要 ClientUserAuthGuard 认证）",
        description: "为当前合伙人设置上级，只能通过邀请人编号设置。注意：已有上级的合伙人无法再次设置",
    })
    @ApiBody({
        type: SetUplinkDto,
        examples: {
            withoutChannel: {
                summary: "设置上级（无渠道）",
                value: {
                    inviterCode: "LP123456",
                },
            },
            withChannel: {
                summary: "设置上级（有渠道）",
                value: {
                    inviterCode: "LP123456",
                    channelCode: "ABC123",
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: "成功设置上级",
        schema: {
            example: {
                code: 200,
                message: "上级设置成功",
                data: null,
            },
        },
    })
    @ApiResponse({ status: 400, description: "已有上级或邀请人无效" })
    @ApiResponse({ status: 404, description: "合伙人档案不存在" })
    @ApiResult()
    @OperationLog({
        module: "partner",
        action: "set_uplink",
        description: "设置上级",
        recordResponse: false,
    })
    async setUplink(@Body() dto: SetUplinkDto, @Req() req: any): Promise<ResultData> {
        const userId = req.clientUser?.userId;
        await this.partnerService.setUplink(userId, dto.inviterCode, dto.channelCode);
        return ResultData.ok(null, "上级设置成功");
    }

    /**
     * 更新团队名称
     * PUT /api/biz/partner/team-name
     */
    @Put("team-name")
    @AllowAnonymous()
    @UseGuards(ClientUserAuthGuard)
    @RequireClientUserAuth()
    @ApiOperation({
        summary: "更新团队名称（需要 ClientUserAuthGuard 认证）",
        description: "更新当前合伙人的团队名称",
    })
    @ApiBody({
        type: UpdateTeamNameDto,
        examples: {
            example1: {
                summary: "更新团队名称",
                value: {
                    teamName: "我的战队",
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: "成功更新团队名称",
        schema: {
            example: {
                code: 200,
                message: "团队名称已更新",
                data: null,
            },
        },
    })
    @ApiResponse({ status: 404, description: "合伙人档案不存在" })
    @ApiResult()
    @OperationLog({
        module: "partner",
        action: "update_team_name",
        description: "更新团队名称",
        recordResponse: false,
    })
    async updateTeamName(@Body() dto: UpdateTeamNameDto, @Req() req: any): Promise<ResultData> {
        const userId = req.clientUser?.userId;
        await this.partnerService.updateTeamName(userId, dto.teamName);
        return ResultData.ok(null, "团队名称已更新");
    }

    /**
     * 获取我的渠道列表
     * GET /api/biz/partner/channels
     */
    @Get("channels")
    @AllowAnonymous()
    @UseGuards(ClientUserAuthGuard)
    @RequireClientUserAuth()
    @ApiOperation({
        summary: "获取我的渠道列表（需要 ClientUserAuthGuard 认证）",
        description: "获取当前合伙人创建的所有推广渠道",
    })
    @ApiResponse({
        status: 200,
        description: "成功获取渠道列表",
        schema: {
            example: {
                code: 200,
                message: "success",
                data: [
                    {
                        id: 1,
                        partnerId: 1,
                        channelCode: "CH001",
                        name: "抖音直播间",
                        shortUrl: "aB3xY9",
                        status: "active",
                        createdAt: "2025-12-05T10:00:00.000Z",
                        updatedAt: "2025-12-05T10:00:00.000Z",
                    },
                    {
                        id: 2,
                        partnerId: 1,
                        channelCode: "CH002",
                        name: "微信群1群",
                        shortUrl: "cD5zW2",
                        status: "disabled",
                        createdAt: "2025-12-04T10:00:00.000Z",
                        updatedAt: "2025-12-05T09:00:00.000Z",
                    },
                ],
            },
        },
    })
    @ApiResponse({ status: 404, description: "合伙人档案不存在" })
    @ApiResult()
    async getChannels(@Req() req: any): Promise<ResultData> {
        const userId = req.clientUser?.userId;

        // 通过userId查询partnerId
        const profile = await this.partnerService.getProfileByUserId(userId);
        if (!profile) {
            return ResultData.fail(404, "合伙人档案不存在");
        }

        const channels = await this.channelService.getChannels(profile.partnerId);

        return ResultData.ok(channels);
    }

    /**
     * 禁用渠道
     * PUT /api/biz/partner/channels/:channelId/disable
     */
    @Put("channels/:channelId/disable")
    @AllowAnonymous()
    @UseGuards(ClientUserAuthGuard)
    @RequireClientUserAuth()
    @ApiOperation({
        summary: "禁用渠道（需要 ClientUserAuthGuard 认证）",
        description: "禁用指定的推广渠道，禁用后该渠道无法用于新的推广，但保留历史数据",
    })
    @ApiParam({ name: "channelId", description: "渠道ID", example: "1" })
    @ApiResponse({
        status: 200,
        description: "成功禁用渠道",
        schema: {
            example: {
                code: 200,
                message: "渠道已禁用",
                data: null,
            },
        },
    })
    @ApiResponse({ status: 403, description: "无权操作该渠道" })
    @ApiResponse({ status: 404, description: "渠道不存在或合伙人档案不存在" })
    @ApiResult()
    @OperationLog({
        module: "partner",
        action: "disable_channel",
        description: "禁用渠道",
        recordResponse: false,
    })
    async disableChannel(@Param("channelId") channelId: string, @Req() req: any): Promise<ResultData> {
        const userId = req.clientUser?.userId;

        // 通过userId查询partnerId
        const profile = await this.partnerService.getProfileByUserId(userId);
        if (!profile) {
            return ResultData.fail(404, "合伙人档案不存在");
        }

        // 验证渠道所有权并禁用
        await this.channelService.disableChannel(channelId, profile.partnerId);

        return ResultData.ok(null, "渠道已禁用");
    }

    // ==================== 管理后台接口（JWT认证） ====================

    /**
     * 查询合伙人列表（管理后台）
     * GET /api/biz/partner/admin/partners
     */
    @Get("admin/partners")
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: "查询合伙人列表（管理后台，需要JWT认证）",
        description: "管理员查询合伙人列表，支持按合伙人编号、状态过滤和分页",
    })
    @ApiQuery({ name: "partnerCode", required: false, description: "合伙人编号", example: "LP123456" })
    @ApiQuery({ name: "status", required: false, description: "状态：active/frozen/deleted", example: "active" })
    @ApiQuery({ name: "page", required: true, description: "页码，从1开始", example: 1 })
    @ApiQuery({ name: "pageSize", required: true, description: "每页数量", example: 10 })
    @ApiResponse({
        status: 200,
        description: "成功获取合伙人列表",
        schema: {
            example: {
                code: 200,
                message: "success",
                data: {
                    list: [
                        {
                            partnerId: 1,
                            uid: "wemade_user_123",
                            username: "张三",
                            partnerCode: "LP123456",
                            status: "active",
                            currentStar: "S1",
                            totalMira: 1000,
                            joinTime: "2025-12-01T10:00:00.000Z",
                            remark: "优质合伙人",
                            teamName: "精英战队",
                        },
                    ],
                    total: 1,
                    page: 1,
                    pageSize: 10,
                },
            },
        },
    })
    @ApiResult()
    async queryPartners(@Query() queryDto: QueryPartnersDto): Promise<ResultData> {
        const result = await this.partnerService.queryPartners(queryDto);
        return ResultData.ok(result);
    }

    /**
     * 获取合伙人详情（管理后台）
     * GET /api/biz/partner/admin/partners/:partnerId
     */
    @Get("admin/partners/:partnerId")
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: "获取合伙人详情（管理后台，需要JWT认证）",
        description: "管理员获取指定合伙人的详细信息，包括上级信息",
    })
    @ApiParam({ name: "partnerId", description: "合伙人ID", example: "1" })
    @ApiResponse({
        status: 200,
        description: "成功获取合伙人详情",
        schema: {
            example: {
                code: 200,
                message: "success",
                data: {
                    partnerId: 1,
                    uid: "wemade_user_123",
                    username: "张三",
                    partnerCode: "LP123456",
                    status: "active",
                    currentStar: "S1",
                    totalMira: 1000,
                    joinTime: "2025-12-01T10:00:00.000Z",
                    lastUpdateTime: "2025-12-05T10:00:00.000Z",
                    remark: "优质合伙人",
                    extraData: null,
                    teamName: "精英战队",
                    uplink: {
                        partnerId: "10",
                        partnerCode: "LP999999",
                        uid: "wemade_user_999",
                    },
                },
            },
        },
    })
    @ApiResponse({ status: 404, description: "合伙人不存在" })
    @ApiResult()
    async getPartnerDetail(@Param("partnerId") partnerId: string): Promise<ResultData> {
        const profile = await this.partnerService.getProfileByIdWithUplink(partnerId);
        return ResultData.ok(profile);
    }

    /**
     * 获取合伙人团队（管理后台）
     * GET /api/biz/partner/admin/partners/:partnerId/team
     */
    @Get("admin/partners/:partnerId/team")
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: "获取合伙人团队（管理后台，需要JWT认证）",
        description: "管理员查看指定合伙人的团队成员列表，支持按深度过滤和分页。depth=2时返回树状结构（包含children）",
    })
    @ApiParam({ name: "partnerId", description: "合伙人ID", example: "1" })
    @ApiQuery({
        name: "depth",
        required: false,
        description: "深度：1=一级下线，2=包含二级下线的树状结构，默认为1",
        example: 1,
    })
    @ApiQuery({ name: "page", required: true, description: "页码，从1开始", example: 1 })
    @ApiQuery({ name: "pageSize", required: true, description: "每页数量", example: 10 })
    @ApiResponse({
        status: 200,
        description: "成功获取团队列表",
        schema: {
            example: {
                code: 200,
                message: "success",
                data: {
                    items: [
                        {
                            partnerId: "2",
                            uid: "wemade_user_456",
                            partnerCode: "LP234567",
                            currentStar: "NEW",
                            joinTime: "2025-12-02T10:00:00.000Z",
                            sourceChannelId: "1",
                            children: [
                                {
                                    partnerId: "3",
                                    uid: "wemade_user_789",
                                    partnerCode: "LP345678",
                                    currentStar: "NEW",
                                    joinTime: "2025-12-03T10:00:00.000Z",
                                    sourceChannelId: "1",
                                },
                            ],
                        },
                    ],
                    total: 1,
                    page: 1,
                    pageSize: 10,
                },
            },
        },
    })
    @ApiResult()
    async getPartnerTeam(@Param("partnerId") partnerId: string, @Query() queryDto: QueryTeamDto): Promise<ResultData> {
        const depth = queryDto.depth || 1;
        const result = await this.statisticsService.getTeamMembers(partnerId, depth, {
            page: queryDto.page,
            pageSize: queryDto.pageSize,
        });
        return ResultData.ok(result);
    }

    /**
     * 冻结合伙人（管理后台）
     * PUT /api/biz/partner/admin/partners/:partnerId/freeze
     */
    @Put("admin/partners/:partnerId/freeze")
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: "冻结合伙人（管理后台，需要JWT认证）" })
    @ApiResult()
    @OperationLog({
        module: "partner",
        action: "freeze",
        description: "冻结合伙人",
        recordResponse: false,
    })
    async freezePartner(
        @Param("partnerId") partnerId: string,
        @Body() dto: FreezePartnerDto,
        @Req() req: any,
    ): Promise<ResultData> {
        const adminId = req.user?.userId || "unknown";
        await this.partnerService.freezePartner(partnerId, adminId, dto.reason);
        return ResultData.ok(null, "合伙人已冻结");
    }

    /**
     * 解冻合伙人（管理后台）
     * PUT /api/biz/partner/admin/partners/:partnerId/unfreeze
     */
    @Put("admin/partners/:partnerId/unfreeze")
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: "解冻合伙人（管理后台，需要JWT认证）" })
    @ApiResult()
    @OperationLog({
        module: "partner",
        action: "unfreeze",
        description: "解冻合伙人",
        recordResponse: false,
    })
    async unfreezePartner(@Param("partnerId") partnerId: string, @Req() req: any): Promise<ResultData> {
        const adminId = req.user?.userId || "unknown";
        await this.partnerService.unfreezePartner(partnerId, adminId);
        return ResultData.ok(null, "合伙人已解冻");
    }

    /**
     * 纠正上级关系（管理后台）
     * POST /api/biz/partner/admin/partners/:partnerId/correct-uplink
     */
    @Post("admin/partners/:partnerId/correct-uplink")
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: "纠正上级关系（管理后台，需要JWT认证）" })
    @ApiResult()
    @OperationLog({
        module: "partner",
        action: "correct_uplink",
        description: "纠正上级关系",
        recordResponse: false,
    })
    async correctUplink(
        @Param("partnerId") partnerId: string,
        @Body() dto: CorrectUplinkDto,
        @Req() req: any,
    ): Promise<ResultData> {
        const adminId = req.user?.userId || "unknown";
        await this.hierarchyService.correctUplink(partnerId, dto.newParentId, adminId, dto.reason);
        return ResultData.ok(null, "上级关系已纠正");
    }

    /**
     * 更新备注（管理后台）
     * PUT /api/biz/partner/admin/partners/:partnerId/remark
     */
    @Put("admin/partners/:partnerId/remark")
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: "更新备注（管理后台，需要JWT认证）" })
    @ApiResult()
    @OperationLog({
        module: "partner",
        action: "update_remark",
        description: "更新合伙人备注",
        recordResponse: false,
    })
    async updateRemark(
        @Param("partnerId") partnerId: string,
        @Body() dto: UpdateRemarkDto,
        @Req() req: any,
    ): Promise<ResultData> {
        const adminId = req.user?.userId || "unknown";
        await this.partnerService.updateRemark(partnerId, dto.remark, adminId);
        return ResultData.ok(null, "备注已更新");
    }

    /**
     * 更新MIRA积分（积分引擎回调）
     * POST /api/biz/partner/admin/partners/:partnerId/update-mira
     */
    @Post("admin/partners/:partnerId/update-mira")
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: "更新MIRA积分（积分引擎回调，需要JWT认证）" })
    @ApiResult()
    @OperationLog({
        module: "partner",
        action: "update_mira",
        description: "更新合伙人MIRA积分",
        recordResponse: false,
    })
    async updateMira(@Param("partnerId") partnerId: string, @Body() dto: UpdateMiraDto): Promise<ResultData> {
        await this.partnerService.updateMira(partnerId, dto.totalMira);
        return ResultData.ok(null, "MIRA积分已更新");
    }

    /**
     * 更新星级（积分引擎回调）
     * POST /api/biz/partner/admin/partners/:partnerId/update-star
     */
    @Post("admin/partners/:partnerId/update-star")
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: "更新星级（积分引擎回调，需要JWT认证）" })
    @ApiResult()
    @OperationLog({
        module: "partner",
        action: "update_star",
        description: "更新合伙人星级",
        recordResponse: false,
    })
    async updateStar(@Param("partnerId") partnerId: string, @Body() dto: UpdateStarDto): Promise<ResultData> {
        await this.partnerService.updateStar(partnerId, dto.currentStar);
        return ResultData.ok(null, "星级已更新");
    }

    /**
     * 获取团队高级统计（C端接口）
     * GET /api/biz/partner/team/statistics
     */
    @Get("team/statistics")
    @AllowAnonymous()
    @UseGuards(ClientUserAuthGuard)
    @RequireClientUserAuth()
    @ApiOperation({
        summary: "获取团队高级统计（需要 ClientUserAuthGuard 认证）",
        description:
            "获取当前合伙人的团队高级统计。注意：thisMonthMira 是我本月获得的积分（来自所有贡献者），不是团队成员各自积分的总和",
    })
    @ApiResponse({
        status: 200,
        description: "成功获取团队统计",
        schema: {
            example: {
                code: 200,
                message: "success",
                data: {
                    totalMembers: 10,
                    activeMembers30Days: 8,
                    effectiveMembers: 6,
                    thisMonthMira: "1500",
                    thisMonthRecharge: "0",
                },
            },
        },
    })
    @ApiResponse({ status: 404, description: "合伙人档案不存在" })
    @ApiResult()
    async getTeamStatistics(@Req() req: any): Promise<ResultData> {
        const userId = req.clientUser?.userId;

        // 通过userId查询partnerId
        const profile = await this.partnerService.getProfileByUserId(userId);
        if (!profile) {
            return ResultData.fail(404, "合伙人档案不存在");
        }

        const statistics = await this.statisticsService.getTeamAdvancedStatistics(profile.partnerId);

        return ResultData.ok(statistics);
    }

    /**
     * 获取团队成员列表（含统计信息）（C端接口）
     * GET /api/biz/partner/team/members-with-stats
     */
    @Get("team/members-with-stats")
    @AllowAnonymous()
    @UseGuards(ClientUserAuthGuard)
    @RequireClientUserAuth()
    @ApiOperation({
        summary: "获取团队成员列表（含统计信息）（需要 ClientUserAuthGuard 认证）",
        description:
            "获取团队成员对我的积分贡献列表。注意：cumulativeMira 和 thisMonthMira 是该成员为我贡献的积分，不是成员自己的积分。例如：邀请任务中，被邀请人为我贡献300分；注册任务中，我自己为自己贡献300分",
    })
    @ApiQuery({ name: "page", required: true, description: "页码，从1开始", example: 1 })
    @ApiQuery({ name: "pageSize", required: true, description: "每页数量", example: 10 })
    @ApiResponse({
        status: 200,
        description: "成功获取成员贡献列表",
        schema: {
            example: {
                code: 200,
                message: "success",
                data: {
                    items: [
                        {
                            partnerId: "1",
                            uid: "wemade_user_123",
                            partnerCode: "LP123456",
                            currentStar: "S1",
                            joinTime: "2025-12-01T10:00:00.000Z",
                            lastActiveTime: "2025-12-06T15:30:00.000Z",
                            cumulativeMira: "300",
                            thisMonthMira: "100",
                            isSelf: true,
                        },
                        {
                            partnerId: "2",
                            uid: "wemade_user_456",
                            partnerCode: "LP234567",
                            currentStar: "NEW",
                            joinTime: "2025-12-02T10:00:00.000Z",
                            lastActiveTime: "2025-12-06T14:20:00.000Z",
                            cumulativeMira: "300",
                            thisMonthMira: "300",
                            isSelf: false,
                        },
                    ],
                    total: 10,
                    page: 1,
                    pageSize: 10,
                },
            },
        },
    })
    @ApiResponse({ status: 404, description: "合伙人档案不存在" })
    @ApiResult()
    async getTeamMembersWithStats(@Query() queryDto: QueryTeamDto, @Req() req: any): Promise<ResultData> {
        const userId = req.clientUser?.userId;

        // 通过userId查询partnerId
        const profile = await this.partnerService.getProfileByUserId(userId);
        if (!profile) {
            return ResultData.fail(404, "合伙人档案不存在");
        }

        const result = await this.statisticsService.getTeamMembersWithStats(profile.partnerId, {
            page: queryDto.page,
            pageSize: queryDto.pageSize,
        });

        return ResultData.ok(result);
    }

    /**
     * 获取指定成员的团队列表（C端接口）
     * GET /api/biz/partner/team/:partnerId
     *
     * 注意：此路由定义在最后，避免与静态路由（如 team/statistics, team/members-with-stats）冲突
     */
    @Get("team/:partnerId")
    @AllowAnonymous()
    @UseGuards(ClientUserAuthGuard)
    @RequireClientUserAuth()
    @ApiOperation({
        summary: "获取指定成员的一级下线列表（需要 ClientUserAuthGuard 认证）",
        description:
            "查看指定合伙人的一级下线成员列表。注意：1) 只能查询一级下线，不支持depth参数；2) 目标合伙人必须是当前用户的下线",
    })
    @ApiParam({ name: "partnerId", description: "合伙人ID（必须是当前用户的下线）", example: "1" })
    @ApiQuery({ name: "page", required: true, description: "页码，从1开始", example: 1 })
    @ApiQuery({ name: "pageSize", required: true, description: "每页数量", example: 10 })
    @ApiResponse({
        status: 200,
        description: "成功获取团队列表",
        schema: {
            example: {
                code: 200,
                message: "success",
                data: {
                    items: [
                        {
                            partnerId: "3",
                            uid: "wemade_user_789",
                            partnerCode: "LP345678",
                            currentStar: "NEW",
                            joinTime: "2025-12-03T10:00:00.000Z",
                            sourceChannelId: "1",
                        },
                    ],
                    total: 1,
                    page: 1,
                    pageSize: 10,
                },
            },
        },
    })
    @ApiResponse({ status: 403, description: "无权限查看该合伙人的团队" })
    @ApiResponse({ status: 404, description: "合伙人档案不存在" })
    @ApiResult()
    async getTeamByPartnerId(
        @Param("partnerId") partnerId: string,
        @Query() queryDto: QueryTeamDto,
        @Req() req: any,
    ): Promise<ResultData> {
        const currentUserId = req.clientUser?.userId;

        // 获取当前用户档案
        const currentProfile = await this.partnerService.getProfileByUserId(currentUserId);
        if (!currentProfile) {
            return ResultData.fail(404, "当前用户档案不存在");
        }

        // 验证目标合伙人是否是当前用户的下线
        const isDownline = await this.statisticsService.isDownline(currentProfile.partnerId, partnerId);
        if (!isDownline) {
            return ResultData.fail(403, "无权限查看该合伙人的团队，只能查看自己下线的团队");
        }

        // 固定查询一级下线，忽略depth参数
        const result = await this.statisticsService.getTeamMembers(partnerId, 1, {
            page: queryDto.page,
            pageSize: queryDto.pageSize,
        });

        return ResultData.ok(result);
    }

    /**
     * 获取单个渠道统计（C端接口）
     * GET /api/biz/partner/channels/:channelId/statistics
     */
    @Get("channels/:channelId/statistics")
    @AllowAnonymous()
    @UseGuards(ClientUserAuthGuard)
    @RequireClientUserAuth()
    @ApiOperation({
        summary: "获取单个渠道统计（需要 ClientUserAuthGuard 认证）",
        description: "获取指定推广渠道的统计信息，包括成员数、总MIRA、本月MIRA、转化率等",
    })
    @ApiParam({ name: "channelId", description: "渠道ID", example: "1" })
    @ApiResponse({
        status: 200,
        description: "成功获取渠道统计",
        schema: {
            example: {
                code: 200,
                message: "success",
                data: {
                    memberCount: 5,
                    totalMira: "0",
                    thisMonthMira: "0",
                    conversionRate: 0,
                },
            },
        },
    })
    @ApiResponse({ status: 403, description: "无权访问该渠道" })
    @ApiResponse({ status: 404, description: "渠道不存在或合伙人档案不存在" })
    @ApiResult()
    async getChannelStatistics(@Param("channelId") channelId: string, @Req() req: any): Promise<ResultData> {
        const userId = req.clientUser?.userId;

        // 通过userId查询partnerId
        const profile = await this.partnerService.getProfileByUserId(userId);
        if (!profile) {
            return ResultData.fail(404, "合伙人档案不存在");
        }

        const statistics = await this.channelService.getChannelStatistics(channelId, profile.partnerId);

        return ResultData.ok(statistics);
    }

    /**
     * 获取所有渠道汇总统计（C端接口）
     * GET /api/biz/partner/channels/summary
     */
    @Get("channels/summary")
    @AllowAnonymous()
    @UseGuards(ClientUserAuthGuard)
    @RequireClientUserAuth()
    @ApiOperation({
        summary: "获取所有渠道汇总统计（需要 ClientUserAuthGuard 认证）",
        description: "获取当前合伙人所有推广渠道的汇总统计信息",
    })
    @ApiResponse({
        status: 200,
        description: "成功获取渠道汇总统计",
        schema: {
            example: {
                code: 200,
                message: "success",
                data: {
                    totalChannels: 3,
                    activeChannels: 2,
                    totalMembers: 15,
                    totalMira: "0",
                    thisMonthMira: "0",
                    channels: [
                        {
                            channelId: "1",
                            channelCode: "CH001",
                            name: "抖音直播间",
                            memberCount: 8,
                            totalMira: "0",
                            thisMonthMira: "0",
                        },
                        {
                            channelId: "2",
                            channelCode: "CH002",
                            name: "微信群1群",
                            memberCount: 7,
                            totalMira: "0",
                            thisMonthMira: "0",
                        },
                    ],
                },
            },
        },
    })
    @ApiResponse({ status: 404, description: "合伙人档案不存在" })
    @ApiResult()
    async getChannelsSummary(@Req() req: any): Promise<ResultData> {
        const userId = req.clientUser?.userId;

        // 通过userId查询partnerId
        const profile = await this.partnerService.getProfileByUserId(userId);
        if (!profile) {
            return ResultData.fail(404, "合伙人档案不存在");
        }

        const summary = await this.channelService.getChannelsSummary(profile.partnerId);

        return ResultData.ok(summary);
    }
}

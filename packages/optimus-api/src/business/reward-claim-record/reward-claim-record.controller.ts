import { Controller, Get, Post, Put, Delete, Body, Query, Req, UseInterceptors } from "@nestjs/common";
import { Request } from "express";
import { ApiTags, ApiOperation, ApiExtraModels } from "@nestjs/swagger";

import { RewardClaimRecordService } from "./reward-claim-record.service";
import { RewardClaimRecordEntity } from "./entities/reward-claim-record.entity";
import {
    CreateRewardClaimRecordDto,
    UpdateRewardClaimStatusDto,
    QueryRewardClaimRecordDto,
    QueryMyRewardClaimRecordDto,
    DeleteRewardClaimRecordDto,
    RewardClaimRecordListResponseDto,
    RewardClaimRecordInfoDto,
} from "./dto";

import { ResultData } from "../../shared/utils/result";
import { ApiResult } from "../../shared/decorators/api-result.decorator";
import { OperationLog } from "../../shared/decorators/operation-log.decorator";
import { OperationLogInterceptor } from "../../shared/interceptors/operation-log.interceptor";
import { ClientUserAuth } from "../../shared/decorators/auth-mode.decorator";

@ApiTags("奖励发放记录")
@ApiExtraModels(ResultData, RewardClaimRecordEntity, RewardClaimRecordListResponseDto, RewardClaimRecordInfoDto)
@Controller("biz/reward-claim-record")
@UseInterceptors(OperationLogInterceptor)
export class RewardClaimRecordController {
    constructor(private readonly rewardClaimRecordService: RewardClaimRecordService) {}

    @Post()
    @ClientUserAuth() // 使用统一的客户端用户认证，支持 GameWemade 签名
    @ApiOperation({ summary: "创建奖励发放记录（需要客户端用户认证）" })
    @ApiResult(RewardClaimRecordInfoDto)
    @OperationLog({
        module: "reward-claim-record",
        action: "create",
        description: "创建奖励发放记录",
    })
    async create(@Body() createDto: CreateRewardClaimRecordDto, @Req() req: Request): Promise<ResultData> {
        // 用户信息已经通过统一守卫验证
        const user = (req as any).clientUser;
        if (!user || !user.userId) {
            throw new Error("用户信息未找到");
        }

        return await this.rewardClaimRecordService.create(user.userId, createDto);
    }

    @Put("status")
    @ClientUserAuth() // 使用统一的客户端用户认证，支持 GameWemade 签名
    @ApiOperation({ summary: "更新奖励发放状态（需要客户端用户认证）" })
    @ApiResult(RewardClaimRecordInfoDto)
    @OperationLog({
        module: "reward-claim-record",
        action: "update-status",
        description: "更新奖励发放状态",
    })
    async updateStatus(@Body() updateDto: UpdateRewardClaimStatusDto, @Req() req: Request): Promise<ResultData> {
        // 用户信息已经通过统一守卫验证
        const user = (req as any).clientUser;
        if (!user || !user.userId) {
            throw new Error("用户信息未找到");
        }

        return await this.rewardClaimRecordService.updateStatus(user.userId, updateDto);
    }

    @Get("my")
    @ClientUserAuth() // 使用统一的客户端用户认证，支持 GameWemade 签名
    @ApiOperation({ summary: "查询用户奖励发放记录（需要客户端用户认证）" })
    @ApiResult(RewardClaimRecordListResponseDto)
    async getMyRecords(@Query() queryDto: QueryMyRewardClaimRecordDto, @Req() req: Request): Promise<ResultData> {
        // 用户信息已经通过统一守卫验证
        const user = (req as any).clientUser;
        if (!user || !user.userId) {
            throw new Error("用户信息未找到");
        }

        return await this.rewardClaimRecordService.findByUid(
            user.userId,
            queryDto.activityCode,
            queryDto.page,
            queryDto.pageSize,
        );
    }

    @Get()
    @ApiOperation({ summary: "查询奖励发放记录列表（管理员）" })
    @ApiResult(RewardClaimRecordListResponseDto)
    async list(@Query() queryDto: QueryRewardClaimRecordDto): Promise<ResultData> {
        return await this.rewardClaimRecordService.list(queryDto);
    }

    @Delete()
    @ApiOperation({ summary: "删除奖励发放记录（管理员）" })
    @ApiResult()
    @OperationLog({
        module: "reward-claim-record",
        action: "delete",
        description: "删除奖励发放记录",
    })
    async delete(@Body() deleteDto: DeleteRewardClaimRecordDto): Promise<ResultData> {
        return await this.rewardClaimRecordService.delete(deleteDto.id);
    }
}

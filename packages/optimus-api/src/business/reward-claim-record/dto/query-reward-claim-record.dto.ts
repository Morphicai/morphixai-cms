import { IsOptional, IsString, IsNumber, Min, IsEnum } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { RewardClaimStatus } from "../enums/reward-claim-status.enum";
import { ActivityType } from "../enums/activity-type.enum";

/**
 * 查询奖励发放记录列表请求 DTO（管理员）
 */
export class QueryRewardClaimRecordDto {
    @ApiPropertyOptional({ description: "用户ID" })
    @IsOptional()
    @IsString()
    uid?: string;

    @ApiPropertyOptional({ description: "活动代码" })
    @IsOptional()
    @IsString()
    activityCode?: string;

    @ApiPropertyOptional({ description: "活动类型筛选", enum: ActivityType })
    @IsOptional()
    @IsEnum(ActivityType)
    activityType?: ActivityType;

    @ApiPropertyOptional({ description: "状态筛选", enum: RewardClaimStatus })
    @IsOptional()
    @IsEnum(RewardClaimStatus)
    status?: RewardClaimStatus;

    @ApiPropertyOptional({ description: "页码，从1开始", example: 1, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ description: "每页数量", example: 10, default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    pageSize?: number;
}

/**
 * 查询用户奖励发放记录请求 DTO（玩家）
 */
export class QueryMyRewardClaimRecordDto {
    @ApiPropertyOptional({ description: "活动代码，如果提供则查询指定活动的记录，否则查询所有活动" })
    @IsOptional()
    @IsString()
    activityCode?: string;

    @ApiPropertyOptional({ description: "页码，从1开始", example: 1, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ description: "每页数量", example: 20, default: 20, maximum: 100 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    pageSize?: number;
}

/**
 * 奖励发放记录信息响应 DTO
 */
export class RewardClaimRecordInfoDto {
    @ApiPropertyOptional({ description: "记录ID" })
    id: number;

    @ApiPropertyOptional({ description: "用户ID" })
    uid: string;

    @ApiPropertyOptional({ description: "活动代码" })
    activityCode: string;

    @ApiPropertyOptional({ description: "角色ID" })
    roleId: string;

    @ApiPropertyOptional({ description: "服务器ID" })
    serverId: string;

    @ApiPropertyOptional({ description: "领取状态" })
    status: RewardClaimStatus;

    @ApiPropertyOptional({ description: "开始领取时间" })
    claimStartTime: Date;

    @ApiPropertyOptional({ description: "成功时间" })
    claimSuccessTime?: Date;

    @ApiPropertyOptional({ description: "失败时间" })
    claimFailTime?: Date;

    @ApiPropertyOptional({ description: "失败原因" })
    failReason?: string;

    @ApiPropertyOptional({ description: "奖励信息数组" })
    rewards: Array<{ id: string; name: string; quantity: number }>;

    @ApiPropertyOptional({ description: "创建时间" })
    createDate: Date;

    @ApiPropertyOptional({ description: "更新时间" })
    updateDate: Date;
}

/**
 * 奖励发放记录列表响应 DTO
 */
export class RewardClaimRecordListResponseDto {
    @ApiPropertyOptional({ description: "奖励发放记录列表" })
    items: RewardClaimRecordInfoDto[];

    @ApiPropertyOptional({ description: "总数量" })
    total: number;

    @ApiPropertyOptional({ description: "当前页码" })
    page: number;

    @ApiPropertyOptional({ description: "每页数量" })
    pageSize: number;
}

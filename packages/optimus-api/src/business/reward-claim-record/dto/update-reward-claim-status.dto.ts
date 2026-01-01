import { IsString, IsNotEmpty, IsEnum, IsOptional, IsIn } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { RewardClaimStatus } from "../enums/reward-claim-status.enum";

/**
 * 更新奖励发放状态请求 DTO
 */
export class UpdateRewardClaimStatusDto {
    @ApiProperty({ description: "活动代码", example: "welfare_claim_2024" })
    @IsString()
    @IsNotEmpty()
    activityCode: string;

    @ApiProperty({
        description: "目标状态（只能为 claimed 或 failed）",
        enum: [RewardClaimStatus.CLAIMED, RewardClaimStatus.FAILED],
        example: RewardClaimStatus.CLAIMED,
    })
    @IsIn([RewardClaimStatus.CLAIMED, RewardClaimStatus.FAILED], {
        message: "状态只能是 claimed 或 failed",
    })
    @IsNotEmpty()
    status: RewardClaimStatus.CLAIMED | RewardClaimStatus.FAILED;

    @ApiPropertyOptional({ description: "失败原因（状态为failed时必填）", example: "发放失败：系统错误" })
    @IsOptional()
    @IsString()
    failureReason?: string;
}

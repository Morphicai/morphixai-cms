import { IsString, IsNotEmpty, IsArray, ArrayMinSize, ValidateNested, IsNumber, Min, NotEquals } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

/**
 * 奖励项 DTO
 */
export class RewardItemDto {
    @ApiProperty({ description: "奖励ID", example: "reward_001" })
    @IsString()
    @IsNotEmpty({ message: "奖励ID不能为空" })
    @NotEquals("", { message: "奖励ID不能为空字符串" })
    id: string;

    @ApiProperty({ description: "奖励名称", example: "元宝" })
    @IsString()
    @IsNotEmpty({ message: "奖励名称不能为空" })
    @NotEquals("", { message: "奖励名称不能为空字符串" })
    name: string;

    @ApiProperty({ description: "奖励数量", example: 11800 })
    @IsNumber({}, { message: "奖励数量必须是数字" })
    @Min(1, { message: "奖励数量必须大于0" })
    quantity: number;
}

/**
 * 创建奖励发放记录请求 DTO
 */
export class CreateRewardClaimRecordDto {
    @ApiProperty({ description: "活动代码", example: "welfare_claim_2024" })
    @IsString()
    @IsNotEmpty()
    activityCode: string;

    @ApiProperty({ description: "角色ID", example: "role_123" })
    @IsString()
    @IsNotEmpty()
    roleId: string;

    @ApiProperty({ description: "服务器ID", example: "server_001" })
    @IsString()
    @IsNotEmpty()
    serverId: string;

    @ApiProperty({
        description: "奖励信息数组",
        type: [RewardItemDto],
        example: [{ id: "reward_001", name: "元宝", quantity: 11800 }],
    })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => RewardItemDto)
    rewards: RewardItemDto[];
}

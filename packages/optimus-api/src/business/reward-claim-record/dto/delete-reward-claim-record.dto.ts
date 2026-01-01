import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

/**
 * 删除奖励发放记录 DTO
 */
export class DeleteRewardClaimRecordDto {
    @ApiProperty({ description: "记录ID", example: "1" })
    @IsNotEmpty({ message: "记录ID不能为空" })
    @IsString({ message: "记录ID必须是字符串" })
    id: string;
}

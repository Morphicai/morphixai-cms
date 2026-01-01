import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SetUplinkDto {
    @ApiProperty({
        description: "邀请人编号",
        example: "LP123456",
    })
    @IsString()
    @IsNotEmpty()
    inviterCode: string;

    @ApiPropertyOptional({
        description: "推广渠道码（可选）",
        example: "CH001",
    })
    @IsOptional()
    @IsString()
    channelCode?: string;
}

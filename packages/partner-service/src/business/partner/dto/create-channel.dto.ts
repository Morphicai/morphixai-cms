import { IsString, IsNotEmpty, MaxLength, IsOptional, Matches } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateChannelDto {
    @ApiProperty({
        description: "渠道名称",
        example: "抖音直播间",
        maxLength: 64,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(64)
    name: string;

    @ApiPropertyOptional({
        description: "渠道码（可选，不传则自动生成6位字母+数字）",
        example: "ABC123",
        maxLength: 6,
        minLength: 6,
    })
    @IsOptional()
    @IsString()
    @Matches(/^[A-Z0-9]{6}$/, {
        message: "渠道码必须是6位大写字母和数字的组合",
    })
    channelCode?: string;
}

import { IsOptional, IsString, IsNumber, MinLength, MaxLength, Matches } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class JoinPartnerDto {
    @ApiPropertyOptional({
        description: "邀请人编号（可选，不传则自建团队）",
        example: "LP123456",
    })
    @IsOptional()
    @IsString()
    inviterCode?: string;

    @ApiPropertyOptional({
        description: "推广渠道码（可选，需配合邀请人编号使用）",
        example: "ABC123",
    })
    @IsOptional()
    @IsString()
    channelCode?: string;

    @ApiProperty({
        description: "用户在游戏中的注册时间（毫秒时间戳）",
        example: 1733472000000,
    })
    @IsNumber()
    userRegisterTime: number;

    @ApiPropertyOptional({
        description: "团队名称（可选，2-12个字符，不支持特殊字符）",
        example: "我的战队",
        minLength: 2,
        maxLength: 12,
    })
    @IsOptional()
    @IsString()
    @MinLength(2, { message: "团队名称最少2个字符" })
    @MaxLength(12, { message: "团队名称最多12个字符" })
    @Matches(/^[\u4e00-\u9fa5a-zA-Z0-9]+$/, {
        message: "团队名称只能包含中文、英文字母和数字，不支持特殊字符",
    })
    teamName?: string;

    @ApiPropertyOptional({
        description: "用户名（可选，用于冗余存储）",
        example: "张三",
    })
    @IsOptional()
    @IsString()
    @MaxLength(100, { message: "用户名最多100个字符" })
    username?: string;
}

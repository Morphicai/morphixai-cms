import { IsString, IsEmail, IsOptional, MinLength, MaxLength, Matches } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class RegisterDto {
    @ApiPropertyOptional({ description: "用户名（3-20个字符，字母数字下划线）" })
    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(20)
    @Matches(/^[a-zA-Z0-9_]+$/, { message: "用户名只能包含字母、数字和下划线" })
    username?: string;

    @ApiPropertyOptional({ description: "邮箱" })
    @IsOptional()
    @IsEmail({}, { message: "邮箱格式不正确" })
    email?: string;

    @ApiPropertyOptional({ description: "手机号" })
    @IsOptional()
    @IsString()
    @Matches(/^1[3-9]\d{9}$/, { message: "手机号格式不正确" })
    phone?: string;

    @ApiProperty({ description: "密码（6-20个字符）" })
    @IsString()
    @MinLength(6)
    @MaxLength(20)
    password: string;

    @ApiPropertyOptional({ description: "昵称" })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    nickname?: string;
}

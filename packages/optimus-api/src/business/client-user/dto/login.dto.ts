import { IsString, IsEmail, IsOptional, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class LoginDto {
    @ApiPropertyOptional({ description: "用户名" })
    @IsOptional()
    @IsString()
    username?: string;

    @ApiPropertyOptional({ description: "邮箱" })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({ description: "手机号" })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ description: "密码" })
    @IsString()
    @MinLength(6)
    password: string;
}

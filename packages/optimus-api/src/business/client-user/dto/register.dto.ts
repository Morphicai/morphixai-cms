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

    @ApiProperty({ description: "密码（明文 6-20 字符；客户端会 AES 加密后传输，密文约 44-64 字符）" })
    @IsString()
    @MinLength(6)
    // 上限按"密文"给：前端 encryptPasswordFields 加密后是 base64，40+ 字符。
    // 之前写 20 是按明文想的，结果 ValidationPipe 跑在 controller 解密之前，
    // 所有走加密链路的注册全被 400 拒掉——加密注册从来没成功过。
    // 明文的 6-20 约束在 controller 解密后补验。
    @MaxLength(128)
    password: string;

    @ApiPropertyOptional({ description: "昵称" })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    nickname?: string;
}

import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, MinLength, MaxLength } from "class-validator";
import { Type } from "class-transformer";

export class LoginUser {
    @ApiProperty({
        default: "admin",
        description: "账号",
    })
    @IsString({ message: "account 类型错误" })
    @IsNotEmpty({ message: "账号不能为空" })
    readonly account: string;

    @ApiProperty({ default: "admin", description: "密码" })
    @IsString({ message: "password 类型错误" })
    @IsNotEmpty({ message: "密码不能为空" })
    readonly password: string;

    @ApiProperty({ description: "验证码唯一标识" })
    @IsString({ message: "验证码 captchaId 类型错误" })
    @IsNotEmpty({ message: "验证码 captchaId 不能为空" })
    readonly captchaId: string;

    @ApiProperty({ default: "1234", description: "用户输入的验证码" })
    @MinLength(4, { message: "验证码至少4位喔" })
    @MaxLength(4, { message: "验证码最大不能超过4位喔" })
    @Type(() => String)
    readonly verifyCode: string;
}

import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

export class ChangePasswordDto {
    @ApiProperty({ description: "旧密码" })
    @IsString({ message: "password 类型错误" })
    @IsNotEmpty({ message: "旧密码不能为空" })
    readonly password: string;

    @ApiProperty({ description: "新密码" })
    @IsString({ message: "newPassword 类型错误" })
    @IsNotEmpty({ message: "新密码不能为空" })
    readonly newPassword: string;
}

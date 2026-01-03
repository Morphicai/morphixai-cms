import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class InitializeSystemDto {
    @ApiProperty({ description: "管理员账号", required: true })
    @IsString({ message: "account 类型错误，正确类型 string" })
    @IsNotEmpty({ message: "account 不能为空" })
    @MinLength(5, { message: "账号至少5个字符" })
    @MaxLength(20, { message: "账号最多20个字符" })
    readonly account: string;

    @ApiProperty({ description: "管理员密码", required: true })
    @IsString({ message: "password 类型错误，正确类型 string" })
    @IsNotEmpty({ message: "password 不能为空" })
    @MinLength(6, { message: "密码至少6个字符" })
    readonly password: string;

    @ApiProperty({ description: "管理员姓名", required: false })
    @IsString({ message: "姓名类型错误" })
    @IsOptional()
    @MaxLength(30)
    readonly fullName?: string;

    @ApiProperty({ description: "管理员邮箱", required: false })
    @IsString({ message: "email 类型错误，正确类型 string" })
    @IsEmail()
    @IsOptional()
    readonly email?: string;

    @ApiProperty({ description: "管理员手机号", required: false })
    @IsString({ message: "phoneNum 类型错误，正确类型 string" })
    @IsOptional()
    readonly phoneNum?: string;

    @ApiProperty({ description: "站点名称", required: false })
    @IsString()
    @IsOptional()
    @MaxLength(100)
    readonly siteName?: string;

    @ApiProperty({ description: "站点描述", required: false })
    @IsString()
    @IsOptional()
    @MaxLength(500)
    readonly siteDescription?: string;
}

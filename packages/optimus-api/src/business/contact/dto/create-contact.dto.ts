import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsMobilePhone, IsString } from "class-validator";

export class CreateContactDto {
    @ApiProperty({ description: "电子邮件" })
    @IsString({ message: "email 类型错误，正确类型 string" })
    @IsNotEmpty({ message: "email 不能为空" })
    readonly email: string;

    @ApiProperty({ description: "手机号" })
    @IsString({ message: "phoneNum 类型错误，正确类型 string" })
    @IsMobilePhone("zh-CN", { strictMode: false }, { message: "请输入正确的手机号" })
    @IsOptional()
    readonly phoneNum: string;

    @ApiProperty({ description: "公司地址" })
    @IsString({ message: "address 类型错误，必须为 string 类型" })
    readonly address: string;

    @ApiProperty({ description: "英文公司地址" })
    @IsString({ message: "engAddress 类型错误，必须为 string 类型" })
    readonly engAddress: string;
}

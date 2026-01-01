import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateContactFeedbackDto {
    @ApiProperty({ description: "电子邮件" })
    @IsString({ message: "email 类型错误，正确类型 string" })
    @IsNotEmpty({ message: "email 不能为空" })
    readonly email: string;

    @ApiProperty({ description: "昵称" })
    @IsString({ message: "nickName 类型错误，正确类型 string" })
    @IsOptional()
    readonly nickName: string;

    @ApiProperty({ description: "意见信息" })
    @IsString({ message: "message 类型错误，必须为 string 类型" })
    readonly message: string;
}

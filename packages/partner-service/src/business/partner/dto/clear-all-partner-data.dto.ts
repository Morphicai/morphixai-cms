import { IsString, IsNotEmpty, MinLength, Equals } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ClearAllPartnerDataDto {
    @ApiProperty({
        description: "清空原因（必填，至少20个字符）",
        example: "测试环境数据清理，准备重新开始测试",
        minLength: 20,
    })
    @IsString()
    @IsNotEmpty({ message: "清空原因不能为空" })
    @MinLength(20, { message: "清空原因至少需要20个字符" })
    reason: string;

    @ApiProperty({
        description: '确认文本（必须输入 "CLEAR_ALL_PARTNER_DATA"）',
        example: "CLEAR_ALL_PARTNER_DATA",
    })
    @IsString()
    @IsNotEmpty({ message: "确认文本不能为空" })
    @Equals("CLEAR_ALL_PARTNER_DATA", { message: '确认文本必须为 "CLEAR_ALL_PARTNER_DATA"' })
    confirmText: string;
}

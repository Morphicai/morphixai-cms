import { IsString, IsNotEmpty, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ClearPartnerDataDto {
    @ApiProperty({
        description: "清空原因（必填，至少10个字符）",
        example: "测试数据清理，该合伙人为测试账号",
        minLength: 10,
    })
    @IsString()
    @IsNotEmpty({ message: "清空原因不能为空" })
    @MinLength(10, { message: "清空原因至少需要10个字符" })
    reason: string;
}

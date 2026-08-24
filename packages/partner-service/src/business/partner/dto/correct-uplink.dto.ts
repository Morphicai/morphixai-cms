import { IsString, IsNotEmpty, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CorrectUplinkDto {
    @ApiProperty({
        description: "新的上级合伙人ID",
        example: "1234567890",
    })
    @IsString()
    @IsNotEmpty()
    newParentId: string;

    @ApiProperty({
        description: "纠错原因",
        example: "用户申诉，原上级关系错误",
        maxLength: 500,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    reason: string;
}

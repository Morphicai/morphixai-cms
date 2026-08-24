import { IsString, IsNotEmpty, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateRemarkDto {
    @ApiProperty({
        description: "备注内容",
        example: "重点关注合伙人",
        maxLength: 255,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    remark: string;
}

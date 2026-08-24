import { IsString, IsNotEmpty, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class FreezePartnerDto {
    @ApiProperty({
        description: "冻结原因",
        example: "违规推广行为",
        maxLength: 500,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    reason: string;
}

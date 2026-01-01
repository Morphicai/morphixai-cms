import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class UpdateMiraDto {
    @ApiProperty({ description: "MIRA总积分", example: "1000" })
    @IsNotEmpty({ message: "totalMira不能为空" })
    @IsString({ message: "totalMira必须是字符串" })
    totalMira: string;
}

import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class UpdateStarDto {
    @ApiProperty({ description: "当前星级", example: "S1" })
    @IsNotEmpty({ message: "currentStar不能为空" })
    @IsString({ message: "currentStar必须是字符串" })
    currentStar: string;
}

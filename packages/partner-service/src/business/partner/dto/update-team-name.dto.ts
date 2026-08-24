import { IsString, IsNotEmpty, MinLength, MaxLength, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateTeamNameDto {
    @ApiProperty({
        description: "团队名称（2-12个字符，不支持特殊字符）",
        example: "我的战队",
        minLength: 2,
        maxLength: 12,
    })
    @IsString()
    @IsNotEmpty({ message: "团队名称不能为空" })
    @MinLength(2, { message: "团队名称最少2个字符" })
    @MaxLength(12, { message: "团队名称最多12个字符" })
    @Matches(/^[\u4e00-\u9fa5a-zA-Z0-9]+$/, {
        message: "团队名称只能包含中文、英文字母和数字，不支持特殊字符",
    })
    teamName: string;
}

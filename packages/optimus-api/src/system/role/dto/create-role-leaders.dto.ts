import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsString, IsNotEmpty } from "class-validator";

export class CreateRoleLeadersDto {
    @ApiProperty({ description: "角色ID" })
    @IsString({ message: "角色ID类型错误" })
    roleId: string;

    @ApiProperty({ description: "负责人的 UserId" })
    @IsArray({ message: "负责人必须使用 List" })
    @IsNotEmpty({ each: true, message: "负责人不能为空" })
    leaders: number[];
}

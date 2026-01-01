import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional, IsArray, IsNumber, IsNotEmpty } from "class-validator";
export class CreateRoleDto {
    @ApiProperty({ description: "角色名称" })
    @IsString({ message: "remark 类型错误, 正确类型 string" })
    @Length(2, 20, { message: "name 字符长度在 2~20" })
    name: string;

    @ApiProperty({ description: "角色备注", required: false })
    @IsString({ message: "remark 类型错误, 正确类型 string" })
    @Length(0, 100, { message: "name 字符长度在 0~100" })
    @IsOptional()
    remark?: string;

    @ApiProperty({ description: "当前角色所拥有的权限编码组" })
    @IsArray({ message: "menuCodes 类型错误，正确类型 string[]" })
    @IsString({ each: true, message: "权限编码组内类型错误" })
    @IsNotEmpty({ each: true, message: "权限编码不能为空" })
    menuCodes: string[];
}

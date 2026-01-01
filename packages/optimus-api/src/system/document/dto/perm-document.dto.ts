import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsOptional } from "class-validator";

export class PermDocumentDto {
    @ApiProperty({ description: "开启权限控制后的用户名单", required: false })
    @IsArray({ message: "权限列表中的用户名单必须为数组类型" })
    @IsOptional()
    readonly accountIdPerms?: number[];

    @ApiProperty({ description: "开启权限控制后的角色名单", required: false })
    @IsArray({ message: "权限列表中的角色名单必须为数组类型" })
    @IsOptional()
    readonly roleIdPerms?: number[];
}

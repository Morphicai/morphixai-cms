import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsOptional } from "class-validator";
import { ReqListQuery } from "../../../shared/utils/req-list-query";

export class FindAllDocumentDto extends ReqListQuery {
    @ApiProperty({ description: "文案中心 Key", required: false })
    readonly docKey?: string;

    @ApiProperty({ description: "描述当前 Item 来源", required: false })
    readonly source?: string;

    @ApiProperty({ description: "当前文案 Item 类型", required: false })
    readonly type?: string;

    @ApiProperty({ description: "开启权限控制后的用户名单", required: false })
    @IsArray({ message: "权限列表中的用户名单必须为数组类型" })
    @IsOptional()
    readonly accountIdPerms?: number[];

    @ApiProperty({ description: "开启权限控制后的角色名单", required: false })
    @IsArray({ message: "权限列表中的角色名单必须为数组类型" })
    @IsOptional()
    readonly roleIdPerms?: number[];
}

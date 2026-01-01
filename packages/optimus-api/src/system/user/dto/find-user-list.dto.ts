import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
import { ReqListQuery } from "../../../shared/utils/req-list-query";

export class FindUserListDto extends ReqListQuery {
    @ApiProperty({ description: "账号模糊搜索", required: false })
    @IsOptional()
    account?: string;

    @ApiProperty({ description: "姓名模糊搜索", required: false })
    @IsOptional()
    fullName?: string;

    @ApiProperty({
        description: "按账号状态查询用户 - 0禁用状态，1启用状态",
        enum: [0, 1],
        required: false,
    })
    @IsOptional()
    status?: 0 | 1;

    @ApiProperty({ description: "拥有角色id", required: false })
    @IsOptional()
    roleId?: string;

    @ApiProperty({
        description: "当前已废弃 - 当 roleId 不为空时有效，查询用户是否有当前权限 0-无当前角色 1-有当前角色",
        required: false,
    })
    @IsOptional()
    hasCurrRole?: 0 | 1;
}

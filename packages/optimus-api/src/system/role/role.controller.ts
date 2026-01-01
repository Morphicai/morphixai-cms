import { Controller, Get, Post, Put, Param, Delete, Body, Query, Req, UseInterceptors } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiExtraModels, ApiBearerAuth } from "@nestjs/swagger";

import { ResultData } from "../../shared/utils/result";
import { ApiResult } from "../../shared/decorators/api-result.decorator";
import { OperationLog } from "../../shared/decorators/operation-log.decorator";
import { OperationLogInterceptor } from "../../shared/interceptors/operation-log.interceptor";

import { RoleService } from "./role.service";
import { RoleEntity } from "./entities/role.entity";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { CreateRoleLeadersDto } from "./dto/create-role-leaders.dto";
import { RemoveRoleLeadersDto } from "./dto/remove-role-leaders.dto";
import { FindRoleListDto } from "./dto/find-role-list.dto";

@ApiTags("角色模块")
@ApiExtraModels(RoleEntity)
@ApiBearerAuth()
@Controller("role")
@UseInterceptors(OperationLogInterceptor)
export class RoleController {
    constructor(private readonly roleService: RoleService) {}

    @Get("list")
    @ApiOperation({ summary: "查询 role 列表" })
    @ApiResult(RoleEntity, true, true)
    async findList(@Req() req, @Query() search: FindRoleListDto): Promise<ResultData> {
        return await this.roleService.findList(req.user.type, req.user.id, search);
    }

    @Get("one/:id/perms")
    @ApiOperation({ summary: "查询单个角色详情及权限菜单" })
    @ApiResult(RoleEntity)
    async findOne(@Param("id") id: string): Promise<ResultData> {
        return await this.roleService.findOnePerm(id);
    }

    @Post()
    @ApiOperation({ summary: "创建角色" })
    @ApiResult(RoleEntity)
    @OperationLog({
        module: "role",
        action: "create",
        description: "创建角色",
    })
    async create(@Body() dto: CreateRoleDto, @Req() req): Promise<ResultData> {
        return await this.roleService.create(dto, req.user);
    }

    @Put()
    @ApiOperation({ summary: "更新角色" })
    @ApiResult()
    @OperationLog({
        module: "role",
        action: "update",
        description: "更新角色 {id}",
    })
    async update(@Body() dto: UpdateRoleDto): Promise<ResultData> {
        return await this.roleService.update(dto);
    }

    @Delete(":id")
    @ApiOperation({ summary: "删除角色" })
    @ApiResult()
    @OperationLog({
        module: "role",
        action: "delete",
        description: "删除角色 {id}",
    })
    async delete(@Param("id") id: string): Promise<ResultData> {
        return await this.roleService.delete(id);
    }

    @Get("leaders/:roleId")
    @ApiOperation({ summary: "查询单个角色的负责人" })
    @ApiResult(RoleEntity)
    findAllLeadersByRoleId(@Param("roleId") roleId: string): Promise<ResultData> {
        return this.roleService.findAllLeadersByRoleId(roleId);
    }

    @Post("createRoleLeaders")
    @ApiOperation({ summary: "为角色设置负责人，允许有多个负责人" })
    @ApiResult(RoleEntity)
    @OperationLog({
        module: "role",
        action: "set_leaders",
        description: "设置角色负责人",
    })
    createRoleLeaders(@Body() dto: CreateRoleLeadersDto): Promise<ResultData> {
        return this.roleService.createRoleLeaders(dto);
    }

    @Post("removeRoleLeaders")
    @ApiOperation({ summary: "移除角色负责人" })
    @ApiResult(RoleEntity)
    @OperationLog({
        module: "role",
        action: "remove_leaders",
        description: "移除角色负责人",
    })
    removeRoleLeaders(@Body() dto: RemoveRoleLeadersDto): Promise<ResultData> {
        return this.roleService.removeRoleLeaders(dto);
    }
}

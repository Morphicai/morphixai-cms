/**
 * 用户控制器使用示例
 * 展示如何使用操作日志装饰器
 *
 * 使用步骤：
 * 1. 在控制器类上添加 @UseInterceptors(OperationLogInterceptor)
 * 2. 在需要记录日志的方法上添加 @OperationLog 装饰器
 * 3. 配置模块名、操作类型和描述
 */

import {
    Controller,
    Query,
    Get,
    Param,
    Put,
    Body,
    Post,
    UseInterceptors,
    UploadedFile,
    HttpCode,
    Req,
    Delete,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiConsumes, ApiQuery, ApiExtraModels } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";

import { UserService } from "./user.service";
import { UserEntity } from "./user.entity";

import { ResultData } from "../../shared/utils/result";
import { ApiResult } from "../../shared/decorators/api-result.decorator";
import { OperationLog } from "../../shared/decorators/operation-log.decorator";
import { OperationLogInterceptor } from "../../shared/interceptors/operation-log.interceptor";

import { FindUserListDto } from "./dto/find-user-list.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CreateOrUpdateRoleUsersDto } from "./dto/createupdate-role-users.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";

@ApiTags("用户账号相关")
@ApiBearerAuth()
@ApiExtraModels(ResultData, UserEntity)
@Controller("user")
@UseInterceptors(OperationLogInterceptor) // 👈 启用操作日志拦截器
export class UserControllerExample {
    constructor(private readonly userService: UserService) {}

    @Get("list")
    @ApiOperation({ summary: "查询用户列表" })
    @ApiResult(UserEntity, true, true)
    findList(@Query() dto: FindUserListDto): Promise<ResultData> {
        return this.userService.findList(dto);
    }

    @Get("one/info")
    @ApiOperation({ summary: "根据id查询用户信息" })
    @ApiQuery({ name: "id" })
    @ApiResult(UserEntity)
    async findOne(@Query("id") id: string, @Req() req): Promise<ResultData> {
        return await this.userService.findOne(id || req.user.id);
    }

    @Delete(":id")
    @ApiOperation({ summary: "虚拟删除" })
    @ApiResult()
    @OperationLog({
        module: "user",
        action: "delete",
        description: "删除用户 {id}",
    })
    delete(@Param("id") userId: string): Promise<ResultData> {
        return this.userService.delete(userId);
    }

    @Get(":id/role")
    @ApiOperation({ summary: "查询用户角色id集合" })
    @ApiResult(Number, true)
    async findUserRole(@Param("id") id: string): Promise<ResultData> {
        return await this.userService.findUserRole(id);
    }

    @Post("role/update")
    @ApiOperation({ summary: "角色添加/取消关联用户" })
    @ApiResult()
    @OperationLog({
        module: "user",
        action: "update_role",
        description: "更新用户角色关联",
    })
    async createOrCancelUserRole(@Body() dto: CreateOrUpdateRoleUsersDto): Promise<ResultData> {
        return await this.userService.createOrCancelUserRole(dto.userIds, dto.roleId, dto.type);
    }

    @Put()
    @ApiOperation({ summary: "更新用户信息" })
    @ApiResult()
    @OperationLog({
        module: "user",
        action: "update",
        description: "更新用户信息 {id}",
    })
    async update(@Body() dto: UpdateUserDto): Promise<ResultData> {
        return await this.userService.update(dto);
    }

    @Put("/status/change")
    @ApiOperation({ summary: "更改用户可用状态" })
    @ApiResult()
    @OperationLog({
        module: "user",
        action: "change_status",
        description: "更改用户状态 {id}",
    })
    async updateStatus(@Body() dto: UpdateStatusDto, @Req() req): Promise<ResultData> {
        return await this.userService.updateStatus(dto.id, dto.status, req.user.id);
    }

    @Put("/password/reset/:userId")
    @ApiOperation({ summary: "重置用户密码" })
    @ApiResult()
    @OperationLog({
        module: "user",
        action: "reset_password",
        description: "重置用户密码 {userId}",
    })
    async resetPassword(@Param("userId") userId: string): Promise<ResultData> {
        return await this.userService.updatePassword(userId, "", true);
    }

    @Post("/import")
    @ApiOperation({ summary: "excel 批量导入用户" })
    @ApiConsumes("multipart/form-data")
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                file: {
                    type: "string",
                    format: "binary",
                },
            },
        },
    })
    @HttpCode(200)
    @UseInterceptors(FileInterceptor("file"))
    @ApiResult(UserEntity, true)
    @OperationLog({
        module: "user",
        action: "import",
        description: "批量导入用户",
        recordResponse: false, // 不记录响应数据（数据量大）
    })
    async importUsers(@UploadedFile() file: Express.Multer.File): Promise<ResultData> {
        return await this.userService.importUsers(file);
    }
}

import { Controller, Get, Post, Body, Req } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { PermService } from "./perm.service";
import { ResultData } from "../../shared/utils/result";
import { AllowNoPerm } from "../../shared/decorators/perm.decorator";

@ApiTags("权限管理")
@Controller("perm")
export class PermController {
    constructor(private readonly permService: PermService) {}

    /**
     * 获取用户权限编码列表（简化版本）
     */
    @Get("user/codes")
    @AllowNoPerm()
    @ApiOperation({ summary: "获取用户权限编码列表" })
    async getUserPermissionCodes(@Req() req): Promise<ResultData> {
        try {
            const permissionCodes = await this.permService.findUserPermissionCodes(req.user.id, req.user.type);
            return ResultData.ok(permissionCodes);
        } catch (error) {
            return ResultData.fail(500, "获取权限失败", error.message);
        }
    }

    /**
     * 批量验证权限
     */
    @Post("user/verify")
    @AllowNoPerm()
    @ApiOperation({ summary: "批量验证权限" })
    async verifyPermissions(@Req() req, @Body() body: { permissions: string[] }): Promise<ResultData> {
        try {
            const userPermissions = await this.permService.findUserPermissionCodes(req.user.id, req.user.type);

            const result = {};
            body.permissions.forEach((permission) => {
                result[permission] = userPermissions.includes("*") || userPermissions.includes(permission);
            });

            return ResultData.ok(result);
        } catch (error) {
            return ResultData.fail(500, "权限验证失败", error.message);
        }
    }

    /**
     * 检查单个权限
     */
    @Get("user/check/:permission")
    @AllowNoPerm()
    @ApiOperation({ summary: "检查单个权限" })
    async checkPermission(@Req() req): Promise<ResultData> {
        try {
            const permission = req.params.permission;
            const userPermissions = await this.permService.findUserPermissionCodes(req.user.id, req.user.type);

            const hasPermission = userPermissions.includes("*") || userPermissions.includes(permission);
            return ResultData.ok(hasPermission);
        } catch (error) {
            return ResultData.fail(500, "权限检查失败", error.message);
        }
    }
}

import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { lastValueFrom } from "rxjs";
import { Request, Router } from "express";
import { getConnection } from "typeorm";

import { ResultData } from "../../shared/utils/result";
import { UserType } from "../../shared/enums/user.enum";

import { RouteDto } from "./dto/route.dto";

@Injectable()
export class PermService {
    private readonly isProduction: boolean = false;
    constructor(private readonly http: HttpService, private readonly config: ConfigService) {
        this.isProduction = process.env.NODE_ENV === "production";
    }

    // 从 express router 堆栈中拿到所有路由，供前端选择，设置相应的权限
    // 但是从堆栈拿出来的数据路由是没有描述
    async findAppAllRoutesByStack(req: Request): Promise<ResultData> {
        const router = req.app._router as Router;
        const routes = router.stack
            .map((layer) => {
                if (layer.route) {
                    const path = layer.route.path;
                    const method = layer.route.stack[0].method.toUpperCase();
                    return { path, method };
                }
                return null;
            })
            .filter((v) => !!v);
        return ResultData.ok(routes);
    }

    async findAppAllRoutesBySwaggerApi(): Promise<RouteDto[]> {
        // 暂时这样
        const { data } = await lastValueFrom(
            this.http.get(`http://localhost:${this.config.get("app.port")}/api/docs-json`),
        );
        const routes = [];
        if (data?.paths) {
            // 将 swagger 数据转换成需要的数据
            const paths = data.paths;
            Object.keys(paths).forEach((path) => {
                Object.keys(paths[path]).forEach((method) => {
                    const route = {
                        path: path.replace(/\{/g, ":").replace(/\}/g, ""),
                        method: method.toUpperCase(),
                        desc: paths[path][method].summary,
                    };
                    routes.push(route);
                });
            });
        }
        return routes;
    }

    async findAppAllRoutes() {
        const routes = await this.findAppAllRoutesBySwaggerApi();
        return ResultData.ok(routes);
    }

    /**
     * 获取用户权限编码列表（新增方法）
     * @param userId 用户ID
     * @param userType 用户类型
     * @returns 权限编码数组
     */
    async findUserPermissionCodes(userId: string, userType: UserType): Promise<string[]> {
        // 超级管理员拥有所有权限
        if (userType === UserType.SUPER_ADMIN) {
            return ["*"]; // 特殊标识，前端需要特殊处理
        }

        // 查询用户权限编码
        const permissionCodes = await this.queryUserPermissionCodes(userId);

        return permissionCodes;
    }

    /**
     * 查询用户权限编码（从数据库）
     * @param userId 用户ID
     * @returns 权限编码数组
     */
    private async queryUserPermissionCodes(userId: string): Promise<string[]> {
        // 直接从角色菜单表查询权限编码
        const permissionResults = await getConnection()
            .createQueryBuilder()
            .select(["rm.permission_code"])
            .from("sys_user_role", "ur")
            .leftJoin("sys_role_menu", "rm", "ur.role_id = rm.role_id")
            .where("ur.user_id = :userId AND rm.permission_code IS NOT NULL", { userId })
            .getRawMany();

        // 提取权限编码
        const permissionCodes = permissionResults
            .map((result) => result.permission_code)
            .filter((code) => code && code.trim() !== "");

        return [...new Set(permissionCodes)]; // 去重
    }
}

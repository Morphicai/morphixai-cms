import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserType } from "../enums/user.enum";

/**
 * 超级管理员守卫
 * 只允许超级管理员访问被保护的路由
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException("未登录或用户信息不存在");
        }

        // 检查是否是超级管理员
        if (user.type !== UserType.SUPER_ADMIN) {
            throw new ForbiddenException("此操作仅限超级管理员");
        }

        return true;
    }
}

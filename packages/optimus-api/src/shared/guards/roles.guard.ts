import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { pathToRegexp } from "path-to-regexp";
import { ALLOW_ANONYMOUS } from "../decorators/allow-anonymous.decorator";
import { ALLOW_NO_PERM } from "../decorators/perm.decorator";
import { UserType } from "../enums/user.enum";

@Injectable()
export class RolesGuard implements CanActivate {
    private globalWhiteList = [];
    constructor(private readonly reflector: Reflector, private readonly config: ConfigService) {
        this.globalWhiteList = [].concat(this.config.get("perm.router.whitelist") || []);
    }

    async canActivate(ctx: ExecutionContext): Promise<boolean> {
        let allowAnon = false;
        // 首先 无 token 的 是不需要 对比权限
        if (this.reflector.getAllAndOverride<boolean>(ALLOW_ANONYMOUS, [ctx.getHandler(), ctx.getClass()])) {
            return true;
        }

        const req = ctx.switchToHttp().getRequest();
        // 白名单检测
        allowAnon = this.globalWhiteList.some((route) => {
            const toUpperCaseMethod = route.method.toUpperCase();
            const isMatchMethod = req.method.toUpperCase() === toUpperCaseMethod || toUpperCaseMethod === "*";
            // 请求方法类型相同
            if (isMatchMethod) {
                // 对比 url
                return Boolean(pathToRegexp(route.path).exec(req.url));
            }
            return false;
        });

        if (allowAnon) {
            return true;
        }
        // 函数请求头配置 AllowNoPerm 装饰器 无需验证权限
        if (this.reflector.getAllAndOverride<boolean>(ALLOW_NO_PERM, [ctx.getHandler(), ctx.getClass()])) {
            return true;
        }

        // 需要比对 该用户所拥有的 接口权限
        // 没有挈带 token 直接返回 false
        if (!req.user) {
            return false;
        }

        // 如果是超管，直接放行
        if (req.user.type === UserType.SUPER_ADMIN) {
            return true;
        }

        // 根据 SWAGGER JSON 获取 API 的权限实现方式
        // const permApis = await this.permService.findUserPerms(req.user.id);
        // // 查看当前 API，是否具有访问权限
        // allowAnon = permApis.some((route) => {
        //     if (req.method.toUpperCase() === route.method.toUpperCase()) {
        //         const reqUrl = req.url.split("?")[0];
        //         return Boolean(pathToRegexp(route.path).exec(reqUrl));
        //     }

        //     return false;
        // });

        // if (!allowAnon) {
        //     throw new HttpException("无权限访问接口", 403);
        // }

        return true;
    }
}

import { Controller, Get, HttpException, HttpStatus, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AnonymousAuth } from "../../shared/decorators/auth-mode.decorator";
import { ResultData } from "../../shared/utils/result";
import { ServiceRegistryService } from "./service-registry.service";

/**
 * zone 路由表的公开读口:主 zone(optimus-next)启动时拉它生成 rewrites。
 * 匿名是因为消费方是 next server 进程,没有用户 token 可带(service token 挂账中)。
 * 泄露面 = enabled zone 的内网地址,与 /health 同级;生产网关不转发本路径即可收口。
 */
const READ_LIMIT_PER_MINUTE = 30;
const buckets = new Map<string, { windowStart: number; count: number }>();
function checkRate(ip: string): boolean {
    const now = Date.now();
    const b = buckets.get(ip);
    if (!b || now - b.windowStart >= 60000) {
        buckets.set(ip, { windowStart: now, count: 1 });
        return true;
    }
    b.count += 1;
    return b.count <= READ_LIMIT_PER_MINUTE;
}

@ApiTags("服务治理")
@AnonymousAuth()
@Controller("public")
export class PublicZoneRoutesController {
    constructor(private readonly registry: ServiceRegistryService) {}

    @Get("zone-routes")
    @ApiOperation({ summary: "enabled zone 的路由表(主 zone 生成 rewrites 用)" })
    async zoneRoutes(@Req() req: Request): Promise<ResultData> {
        const ip = req.ip || "unknown";
        if (!checkRate(ip)) {
            throw new HttpException("请求太频繁，请稍后再试", HttpStatus.TOO_MANY_REQUESTS);
        }
        return ResultData.ok(await this.registry.listZoneRoutes());
    }
}

import { Controller, Get, HttpException, HttpStatus, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AnonymousAuth } from "../../shared/decorators/auth-mode.decorator";
import { ResultData } from "../../shared/utils/result";
import { ServiceRegistryService } from "./service-registry.service";

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

// 单独开控制器而不是塞进 PublicZoneRoutesController:zone 路由管页面级分区,
// 这个管 API 请求转发,语义不同的两张表挤进一个接口只会让消费方(proxy.ts / [...path]/route.ts)
// 的调用方混淆该拉哪张
@ApiTags("服务治理")
@AnonymousAuth()
@Controller("public")
export class PublicApiRoutesController {
    constructor(private readonly registry: ServiceRegistryService) {}

    @Get("api-routes")
    @ApiOperation({ summary: "enabled 服务的 API 路径路由表(C 端代理分流用)" })
    async apiRoutes(@Req() req: Request): Promise<ResultData> {
        const ip = req.ip || "unknown";
        if (!checkRate(ip)) {
            throw new HttpException("请求太频繁，请稍后再试", HttpStatus.TOO_MANY_REQUESTS);
        }
        return ResultData.ok(await this.registry.listApiRoutes());
    }
}

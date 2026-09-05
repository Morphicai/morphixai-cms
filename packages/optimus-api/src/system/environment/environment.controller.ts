import { Controller, Get, HttpException, HttpStatus, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AnonymousAuth } from "../../shared/decorators/auth-mode.decorator";
import { ResultData } from "../../shared/utils/result";
import { EnvironmentService } from "./environment.service";

/**
 * 环境基础信息的公开读口。匿名 + IP 限频,与其他公开接口(如 public-i18n)同款内存桶。
 *
 * 匿名是想清楚的:返回的三项(环境名/根域名/cookie 域)都是浏览器本来就能从
 * 自己所在的地址栏与 cookie 里观察到的信息,不放大任何权限。防滥用靠限频。
 */
const READ_LIMIT_PER_MINUTE = 120;
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

/** 测试用:清空限频桶,避免用例之间互相影响 */
export function __resetRateBuckets(): void {
    buckets.clear();
}

@ApiTags("C端公开数据")
@AnonymousAuth()
@Controller("environment")
export class EnvironmentController {
    constructor(private readonly environmentService: EnvironmentService) {}

    @Get()
    @ApiOperation({ summary: "查询当前部署环境的名称、根域名与 cookie 域" })
    getEnvironment(@Req() req: Request): ResultData {
        const ip = req.ip || "unknown";
        if (!checkRate(ip)) {
            throw new HttpException("请求太频繁，请稍后再试", HttpStatus.TOO_MANY_REQUESTS);
        }
        return ResultData.ok(this.environmentService.getInfo());
    }
}

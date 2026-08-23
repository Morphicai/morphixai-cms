import { Controller, Get, HttpException, HttpStatus, Param, Query, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AnonymousAuth } from "../../shared/decorators/auth-mode.decorator";
import { ResultData } from "../../shared/utils/result";
import { DEFAULT_LOCALE, I18nService } from "./i18n.service";

/** C 端/子应用读文案的公开口子。匿名 + IP 限频,与其他公开接口同款内存桶 */
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

@ApiTags("C端公开数据")
@AnonymousAuth()
@Controller("api/i18n")
export class PublicI18nController {
    constructor(private readonly i18nService: I18nService) {}

    @Get(":namespace")
    @ApiOperation({ summary: "读取 namespace 的多语言键值 map(缺失回退默认语言)" })
    async read(
        @Param("namespace") namespace: string,
        @Query("locale") locale = DEFAULT_LOCALE,
        @Req() req: Request,
    ): Promise<ResultData> {
        const ip = req.ip || "unknown";
        if (!checkRate(ip)) {
            throw new HttpException("请求太频繁，请稍后再试", HttpStatus.TOO_MANY_REQUESTS);
        }
        const map = await this.i18nService.publicRead(namespace, locale);
        return ResultData.ok({ namespace, locale, messages: map });
    }
}

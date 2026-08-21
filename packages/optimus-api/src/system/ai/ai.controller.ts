import { Body, Controller, HttpException, HttpStatus, Post, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";

import { Perm } from "../../shared/decorators/perm.decorator";
import { ResultData } from "../../shared/utils/result";
import { AiService } from "./ai.service";
import { AssistDto } from "./dto/assist.dto";

/**
 * 每次调用都花真金白银的模型额度，按用户限频兜底。
 * 内存计数就够——单实例部署，重启清零也无所谓（限频是防手抖连点和脚本滥用，
 * 不是计费系统）。真到多实例再上 redis，现在别为不存在的规模写代码。
 */
const RATE_LIMIT_PER_MINUTE = 6;
const rateBuckets = new Map<string, { windowStart: number; count: number }>();

function checkRate(userId: string): boolean {
    const now = Date.now();
    const bucket = rateBuckets.get(userId);
    if (!bucket || now - bucket.windowStart >= 60000) {
        rateBuckets.set(userId, { windowStart: now, count: 1 });
        return true;
    }
    bucket.count += 1;
    return bucket.count <= RATE_LIMIT_PER_MINUTE;
}

@ApiTags("智能辅助")
@Perm("ContentManagement")
@Controller("ai")
export class AiController {
    constructor(private readonly aiService: AiService) {}

    @Post("assist")
    @ApiOperation({ summary: "文章智能辅助（摘要/润色/续写）" })
    async assist(@Body() dto: AssistDto, @Req() req: Request): Promise<ResultData> {
        const userId = String((req as any).user?.id ?? "anonymous");
        if (!checkRate(userId)) {
            // 429 让前端能明确提示"太频繁",超限的这次不产生模型调用
            throw new HttpException("操作太频繁，请一分钟后再试", HttpStatus.TOO_MANY_REQUESTS);
        }
        return this.aiService.assist(dto.action, dto.text);
    }
}

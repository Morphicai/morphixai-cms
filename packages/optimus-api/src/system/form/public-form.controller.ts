import { Body, Controller, Get, HttpException, HttpStatus, NotFoundException, Param, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";

import { AllowAnonymous } from "../../shared/decorators/allow-anonymous.decorator";
import { ResultData } from "../../shared/utils/result";
import { FormService } from "./form.service";

/**
 * 公开填报接口——不登录才发得出问卷,这是这个模块的价值所在。
 * 两道闸:定义必须 enabled;IP 限频防灌水。未启用与不存在统一 404,
 * 不给外面探测"这个 slug 存不存在"的机会。
 *
 * 注意:上公网前还差验证码/token 这道闸(见 TASKS.md 遗留项),
 * 目前只在本机/内网环境跑。
 */
const SUBMIT_LIMIT_PER_MINUTE = 10;
const MAX_BODY_BYTES = 64 * 1024;
const ipBuckets = new Map<string, { windowStart: number; count: number }>();

function checkIpRate(ip: string): boolean {
    const now = Date.now();
    const b = ipBuckets.get(ip);
    if (!b || now - b.windowStart >= 60000) {
        ipBuckets.set(ip, { windowStart: now, count: 1 });
        return true;
    }
    b.count += 1;
    return b.count <= SUBMIT_LIMIT_PER_MINUTE;
}

@ApiTags("公开填报")
@AllowAnonymous()
@Controller("public/form")
export class PublicFormController {
    constructor(private readonly formService: FormService) {}

    @Get(":slug")
    async getForm(@Param("slug") slug: string): Promise<ResultData> {
        const form = await this.formService.findEnabledBySlug(slug);
        if (!form) throw new NotFoundException("表单不存在");
        return ResultData.ok({
            name: form.name,
            slug: form.slug,
            schema: form.schemaJson,
            schemaVersion: form.schemaVersion,
        });
    }

    @Post(":slug/entries")
    async submit(@Param("slug") slug: string, @Body() body: { data: unknown }, @Req() req: Request): Promise<ResultData> {
        const ip = String(req.ip ?? req.socket?.remoteAddress ?? "unknown");
        if (!checkIpRate(ip)) {
            throw new HttpException("提交太频繁，请稍后再试", HttpStatus.TOO_MANY_REQUESTS);
        }
        if (JSON.stringify(body?.data ?? {}).length > MAX_BODY_BYTES) {
            throw new HttpException("提交内容过大", HttpStatus.PAYLOAD_TOO_LARGE);
        }
        const form = await this.formService.findEnabledBySlug(slug);
        if (!form) throw new NotFoundException("表单不存在");
        return this.formService.submitEntry(form, body?.data, ip);
    }
}

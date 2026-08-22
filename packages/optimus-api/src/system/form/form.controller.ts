import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, HttpException, HttpStatus } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";

import { Perm } from "../../shared/decorators/perm.decorator";
import { ResultData } from "../../shared/utils/result";
import { FormService } from "./form.service";
import { AiService } from "../ai/ai.service";
import { validateSchema } from "./schema-validator";

/** AI 生成与人工保存走同一个校验门,模型没有任何入库特权 */
const GEN_LIMIT_PER_MINUTE = 6;
const genBuckets = new Map<string, { windowStart: number; count: number }>();
function checkGenRate(userId: string): boolean {
    const now = Date.now();
    const b = genBuckets.get(userId);
    if (!b || now - b.windowStart >= 60000) {
        genBuckets.set(userId, { windowStart: now, count: 1 });
        return true;
    }
    b.count += 1;
    return b.count <= GEN_LIMIT_PER_MINUTE;
}

@ApiTags("表单管理")
@Perm("FormManagement")
@Controller("form")
export class FormController {
    constructor(private readonly formService: FormService, private readonly aiService: AiService) {}

    @Get("list")
    list(@Query("page") page = "1", @Query("pageSize") pageSize = "20"): Promise<ResultData> {
        return this.formService.list(Number(page), Number(pageSize));
    }

    @Post()
    create(@Body() body: { name: string; slug: string; schemaJson: unknown }): Promise<ResultData> {
        return this.formService.create(body.name, body.slug, body.schemaJson);
    }

    @Put(":id")
    update(
        @Param("id") id: string,
        @Body() body: { name?: string; schemaJson?: unknown; enabled?: number },
    ): Promise<ResultData> {
        return this.formService.update(id, body);
    }

    @Delete(":id")
    remove(@Param("id") id: string): Promise<ResultData> {
        return this.formService.remove(id);
    }

    @Get(":id/entries")
    entries(
        @Param("id") id: string,
        @Query("page") page = "1",
        @Query("pageSize") pageSize = "20",
    ): Promise<ResultData> {
        return this.formService.listEntries(id, Number(page), Number(pageSize));
    }

    @Post("generate")
    @ApiOperation({ summary: "自然语言生成表单 schema 草稿" })
    async generate(@Body() body: { description: string }, @Req() req: Request): Promise<ResultData> {
        const userId = String((req as any).user?.id ?? "anonymous");
        if (!checkGenRate(userId)) {
            throw new HttpException("操作太频繁，请一分钟后再试", HttpStatus.TOO_MANY_REQUESTS);
        }
        const desc = String(body?.description ?? "").trim();
        if (!desc) return ResultData.fail(400, "description 不能为空");
        if (desc.length > 2000) return ResultData.fail(400, "描述最长 2000 字");

        const prompt = [
            "把下面的表单需求转成 JSON,只输出 JSON 本身(不要 markdown 代码块、不要解释)。",
            '格式: {"title":"...","fields":[{"key":"英文标识","label":"中文名","type":"类型","required":true}]}',
            '类型只能是: text/textarea/number/radio/checkbox/date/switch。',
            'radio/checkbox 必须带 "options":["..."]; number 可带 min/max。key 用小写驼峰。',
            "",
            `需求: ${desc}`,
        ].join("\n");

        const res = await this.aiService.complete(prompt);
        // complete 返回 { result };失败时原样透传
        if (res.code !== 200) return res;
        const raw = String((res.data as any)?.result ?? "");
        // 模型偶尔还是会包代码块,剥一层再解析
        const jsonText = raw.replace(/^```(json)?\s*/i, "").replace(/```\s*$/, "").trim();
        let parsed: unknown;
        try {
            parsed = JSON.parse(jsonText);
        } catch {
            return ResultData.fail(422, `模型输出不是合法 JSON,请重试或手工编写。原始输出: ${raw.slice(0, 500)}`);
        }
        const errors = validateSchema(parsed);
        if (errors.length) {
            return ResultData.fail(422, `生成的 schema 未通过校验: ${errors.join("; ")}。原始输出: ${jsonText.slice(0, 500)}`);
        }
        return ResultData.ok({ schema: parsed });
    }
}

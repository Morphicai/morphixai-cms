import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Perm } from "../../shared/decorators/perm.decorator";
import { ResultData } from "../../shared/utils/result";
import { I18nService } from "./i18n.service";

/** 多语言键值管理。权限码 I18nManagement,与菜单同源 */
@ApiTags("多语言管理")
@Perm("I18nManagement")
@Controller("system/i18n")
export class I18nController {
    constructor(private readonly i18nService: I18nService) {}

    @Get("namespaces")
    @ApiOperation({ summary: "namespace 列表(含键数)" })
    async namespaces(): Promise<ResultData> {
        return ResultData.ok(await this.i18nService.listNamespaces());
    }

    @Get("entries")
    @ApiOperation({ summary: "键值分页" })
    async entries(
        @Query("namespace") namespace: string,
        @Query("page") page = "1",
        @Query("pageSize") pageSize = "50",
        @Query("keyword") keyword?: string,
    ): Promise<ResultData> {
        return ResultData.ok(
            await this.i18nService.listEntries(namespace, Number(page), Number(pageSize), keyword),
        );
    }

    @Post("entries")
    @ApiOperation({ summary: "创建键" })
    async create(
        @Body() dto: { namespace: string; key: string; translations: Record<string, string>; remark?: string },
    ): Promise<ResultData> {
        return ResultData.ok(await this.i18nService.create(dto));
    }

    @Put("entries/:id")
    @ApiOperation({ summary: "更新键(译文/备注)" })
    async update(
        @Param("id") id: string,
        @Body() dto: { translations?: Record<string, string>; remark?: string },
    ): Promise<ResultData> {
        return ResultData.ok(await this.i18nService.update(id, dto));
    }

    @Delete("entries/:id")
    @ApiOperation({ summary: "删除键" })
    async remove(@Param("id") id: string): Promise<ResultData> {
        await this.i18nService.remove(id);
        return ResultData.ok(null);
    }

    @Get("missing")
    @ApiOperation({ summary: "列出某 locale 缺译文的键(agent 工具端点)" })
    async missing(
        @Query("namespace") namespace: string,
        @Query("locale") locale: string,
    ): Promise<ResultData> {
        return ResultData.ok(await this.i18nService.listMissing(namespace, locale));
    }

    @Put("translation")
    @ApiOperation({ summary: "按 namespace+key 写单条译文,只补缺失(agent 工具端点)" })
    async writeTranslation(
        @Body() dto: { namespace: string; key: string; locale: string; text: string },
    ): Promise<ResultData> {
        return ResultData.ok(await this.i18nService.writeTranslation(dto.namespace, dto.key, dto.locale, dto.text));
    }

}

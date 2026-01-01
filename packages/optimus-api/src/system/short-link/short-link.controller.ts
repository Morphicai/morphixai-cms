import { Controller, Get, Post, Put, Delete, Body, Query, Param, HttpCode, Req, UseInterceptors } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody, ApiQuery, ApiParam } from "@nestjs/swagger";
import { ShortLinkService } from "./short-link.service";
import {
    CreateShortLinkDto,
    UpdateShortLinkDto,
    QueryShortLinkDto,
    ShortLinkInfoDto,
    ShortLinkListResponseDto,
} from "./dto/short-link.dto";
import { ResultData } from "../../shared/utils/result";
import { ApiResult } from "../../shared/decorators/api-result.decorator";
import { OperationLog } from "../../shared/decorators/operation-log.decorator";
import { OperationLogInterceptor } from "../../shared/interceptors/operation-log.interceptor";

@ApiTags("短链管理")
@Controller("/system/short-link")
@UseInterceptors(OperationLogInterceptor)
export class ShortLinkController {
    constructor(private readonly shortLinkService: ShortLinkService) {}

    @Post()
    @HttpCode(200)
    @ApiOperation({ summary: "创建短链（仅超级管理员）" })
    @ApiBody({ type: CreateShortLinkDto })
    @ApiResult(ShortLinkInfoDto)
    @OperationLog({
        module: "short-link",
        action: "create",
        description: "创建短链",
        recordResponse: false,
    })
    async create(@Body() dto: CreateShortLinkDto, @Req() req: any): Promise<ResultData> {
        const userId = req.user?.id;
        const result = await this.shortLinkService.create(dto, userId);
        return ResultData.ok(result);
    }

    @Put(":id")
    @ApiOperation({ summary: "更新短链（仅超级管理员）" })
    @ApiParam({ name: "id", description: "短链ID" })
    @ApiBody({ type: UpdateShortLinkDto })
    @ApiResult(ShortLinkInfoDto)
    @OperationLog({
        module: "short-link",
        action: "update",
        description: "更新短链",
        recordResponse: false,
    })
    async update(@Param("id") id: number, @Body() dto: UpdateShortLinkDto): Promise<ResultData> {
        const result = await this.shortLinkService.update(id, dto);
        return ResultData.ok(result);
    }

    @Delete(":id")
    @ApiOperation({ summary: "删除短链（仅超级管理员）" })
    @ApiParam({ name: "id", description: "短链ID" })
    @OperationLog({
        module: "short-link",
        action: "delete",
        description: "删除短链",
        recordResponse: false,
    })
    async delete(@Param("id") id: number): Promise<ResultData> {
        await this.shortLinkService.delete(id);
        return ResultData.ok({ message: "删除成功" });
    }

    @Get()
    @ApiOperation({ summary: "查询短链列表（仅超级管理员）" })
    @ApiQuery({ type: QueryShortLinkDto })
    @ApiResult(ShortLinkListResponseDto)
    async findAll(@Query() dto: QueryShortLinkDto): Promise<ResultData> {
        const result = await this.shortLinkService.findAll(dto);
        return ResultData.ok(result);
    }

    @Get("raw")
    @ApiOperation({ summary: "查询短链列表-原始数据（用于管理后台，返回原始 target）" })
    @ApiQuery({ type: QueryShortLinkDto })
    async findAllRaw(@Query() dto: QueryShortLinkDto): Promise<ResultData> {
        const result = await this.shortLinkService.findAllRaw(dto);
        return ResultData.ok(result);
    }

    @Get(":id")
    @ApiOperation({ summary: "获取短链详情（仅超级管理员）" })
    @ApiParam({ name: "id", description: "短链ID" })
    @ApiResult(ShortLinkInfoDto)
    async findOne(@Param("id") id: number): Promise<ResultData> {
        const result = await this.shortLinkService.findOne(id);
        return ResultData.ok(result);
    }
}

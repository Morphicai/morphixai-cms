import { Controller, Get, Post, Put, Delete, Body, Query, Param, HttpCode } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody, ApiQuery, ApiParam } from "@nestjs/swagger";
import { DictionaryService } from "./dictionary.service";
import {
    CreateDictionaryDto,
    UpdateDictionaryDto,
    QueryDictionaryDto,
    DictionaryInfoDto,
    DictionaryListResponseDto,
    DictionaryCollectionResponseDto,
} from "./dto/dictionary.dto";
import { ResultData } from "../../shared/utils/result";
import { ApiResult } from "../../shared/decorators/api-result.decorator";
import { AllowNoPerm } from "../../shared/decorators/perm.decorator";

@ApiTags("字典管理")
@Controller("/system/dictionary")
export class DictionaryController {
    constructor(private readonly dictionaryService: DictionaryService) {}

    @Post()
    @HttpCode(200)
    @AllowNoPerm()
    @ApiOperation({ summary: "创建字典" })
    @ApiBody({ type: CreateDictionaryDto })
    @ApiResult(DictionaryInfoDto)
    async create(@Body() dto: CreateDictionaryDto): Promise<ResultData> {
        const result = await this.dictionaryService.create(dto);
        return ResultData.ok(result);
    }

    @Put(":id")
    @AllowNoPerm()
    @ApiOperation({ summary: "更新字典" })
    @ApiParam({ name: "id", description: "字典ID" })
    @ApiBody({ type: UpdateDictionaryDto })
    @ApiResult(DictionaryInfoDto)
    async update(@Param("id") id: number, @Body() dto: UpdateDictionaryDto): Promise<ResultData> {
        const result = await this.dictionaryService.update(id, dto);
        return ResultData.ok(result);
    }

    @Delete(":id")
    @AllowNoPerm()
    @ApiOperation({ summary: "删除字典" })
    @ApiParam({ name: "id", description: "字典ID" })
    async delete(@Param("id") id: number): Promise<ResultData> {
        await this.dictionaryService.delete(id);
        return ResultData.ok({ message: "删除成功" });
    }

    @Get()
    @AllowNoPerm()
    @ApiOperation({ summary: "查询字典列表" })
    @ApiQuery({ type: QueryDictionaryDto })
    @ApiResult(DictionaryListResponseDto)
    async findAll(@Query() dto: QueryDictionaryDto): Promise<ResultData> {
        const result = await this.dictionaryService.findAll(dto);
        return ResultData.ok(result);
    }

    @Get("collection/:collection")
    @AllowNoPerm()
    @ApiOperation({ summary: "按集合获取字典" })
    @ApiParam({ name: "collection", description: "集合名称" })
    @ApiResult(DictionaryCollectionResponseDto)
    async findByCollection(@Param("collection") collection: string): Promise<ResultData> {
        const result = await this.dictionaryService.findByCollection(collection);
        return ResultData.ok(result);
    }

    @Get(":collection/:key")
    @AllowNoPerm()
    @ApiOperation({ summary: "获取字典值" })
    @ApiParam({ name: "collection", description: "集合名称" })
    @ApiParam({ name: "key", description: "字典键" })
    async getValue(@Param("collection") collection: string, @Param("key") key: string): Promise<ResultData> {
        const result = await this.dictionaryService.getValue(collection, key);
        return ResultData.ok(result);
    }
}

import { Controller, Get, Post, Put, Delete, Body, Query, Param, HttpCode } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody, ApiQuery, ApiParam } from "@nestjs/swagger";
import { DictionaryCollectionService } from "./dictionary-collection.service";
import {
    CreateCollectionDto,
    UpdateCollectionDto,
    QueryCollectionDto,
    CollectionInfoDto,
    CollectionListResponseDto,
} from "./dto/dictionary-collection.dto";
import { ResultData } from "../../shared/utils/result";
import { ApiResult } from "../../shared/decorators/api-result.decorator";
import { Perm } from "../../shared/decorators/perm.decorator";

@ApiTags("字典集合管理")
// 数据集合的管理面(集合定义+行数据)统一挂 DataCollections 权限码。
// 原先每个方法 @AllowNoPerm 裸奔——方法级放行会盖掉类级 @Perm,所以全部摘除
@Perm("DataCollections")
@Controller("/system/dictionary-collection")
export class DictionaryCollectionController {
    constructor(private readonly collectionService: DictionaryCollectionService) {}

    @Post()
    @HttpCode(200)
    @ApiOperation({ summary: "创建集合" })
    @ApiBody({ type: CreateCollectionDto })
    @ApiResult(CollectionInfoDto)
    async create(@Body() dto: CreateCollectionDto): Promise<ResultData> {
        const result = await this.collectionService.create(dto);
        return ResultData.ok(result);
    }

    @Put(":id")
    @ApiOperation({ summary: "更新集合" })
    @ApiParam({ name: "id", description: "集合ID" })
    @ApiBody({ type: UpdateCollectionDto })
    @ApiResult(CollectionInfoDto)
    async update(@Param("id") id: number, @Body() dto: UpdateCollectionDto): Promise<ResultData> {
        const result = await this.collectionService.update(id, dto);
        return ResultData.ok(result);
    }

    @Delete(":id")
    @ApiOperation({ summary: "删除集合" })
    @ApiParam({ name: "id", description: "集合ID" })
    async delete(@Param("id") id: number): Promise<ResultData> {
        await this.collectionService.delete(id);
        return ResultData.ok({ message: "删除成功" });
    }

    @Get()
    @ApiOperation({ summary: "查询集合列表" })
    @ApiQuery({ type: QueryCollectionDto })
    @ApiResult(CollectionListResponseDto)
    async findAll(@Query() dto: QueryCollectionDto): Promise<ResultData> {
        const result = await this.collectionService.findAll(dto);
        return ResultData.ok(result);
    }

    @Get(":name")
    @ApiOperation({ summary: "根据名称获取集合" })
    @ApiParam({ name: "name", description: "集合名称" })
    @ApiResult(CollectionInfoDto)
    async findByName(@Param("name") name: string): Promise<ResultData> {
        const result = await this.collectionService.findByName(name);
        return ResultData.ok(result);
    }
}

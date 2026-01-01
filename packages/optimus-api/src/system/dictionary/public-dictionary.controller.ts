import { Controller, Get, Post, Put, Body, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam } from "@nestjs/swagger";
import { DictionaryService } from "./dictionary.service";
import { ResultData } from "../../shared/utils/result";
import { ApiResult } from "../../shared/decorators/api-result.decorator";
import { DictionaryCollectionResponseDto } from "./dto/dictionary.dto";

/**
 * C端字典数据DTO
 */
class PublicDictionaryItemDto {
    key: string;
    value: any;
}

/**
 * C端创建/更新字典DTO
 */
class PublicCreateDictionaryDto {
    key: string;
    value: any;
}

@ApiTags("C端公开数据")
@Controller("/api/dictionary")
export class PublicDictionaryController {
    constructor(private readonly dictionaryService: DictionaryService) {}

    @Get(":collection")
    @ApiOperation({ summary: "获取公开集合数据" })
    @ApiParam({ name: "collection", description: "集合名称" })
    @ApiResult(DictionaryCollectionResponseDto)
    async getCollection(@Param("collection") collection: string): Promise<ResultData> {
        // 检查集合是否公开
        await this.dictionaryService.checkPublicAccess(collection);

        const result = await this.dictionaryService.findByCollection(collection);
        return ResultData.ok(result);
    }

    @Get(":collection/:key")
    @ApiOperation({ summary: "获取公开集合中的单个数据" })
    @ApiParam({ name: "collection", description: "集合名称" })
    @ApiParam({ name: "key", description: "数据键" })
    async getValue(@Param("collection") collection: string, @Param("key") key: string): Promise<ResultData> {
        // 检查集合是否公开
        await this.dictionaryService.checkPublicAccess(collection);

        const result = await this.dictionaryService.getValue(collection, key);
        return ResultData.ok(result);
    }

    @Post(":collection")
    @ApiOperation({ summary: "在公开可写集合中创建数据" })
    @ApiParam({ name: "collection", description: "集合名称" })
    async createItem(
        @Param("collection") collection: string,
        @Body() dto: PublicCreateDictionaryDto,
    ): Promise<ResultData> {
        // 检查集合是否可写
        await this.dictionaryService.checkWriteAccess(collection);

        const result = await this.dictionaryService.create({
            collection,
            key: dto.key,
            value: dto.value,
        });

        return ResultData.ok(result);
    }

    @Put(":collection/:key")
    @ApiOperation({ summary: "更新公开可写集合中的数据" })
    @ApiParam({ name: "collection", description: "集合名称" })
    @ApiParam({ name: "key", description: "数据键" })
    async updateItem(
        @Param("collection") collection: string,
        @Param("key") key: string,
        @Body() body: { value: any },
    ): Promise<ResultData> {
        // 检查集合是否可写
        await this.dictionaryService.checkWriteAccess(collection);

        // 查找现有数据
        const existing = await this.dictionaryService["dictionaryRepository"].findOne({
            where: { collection, key },
        });

        if (!existing) {
            throw new Error("数据不存在");
        }

        const result = await this.dictionaryService.update(existing.id, {
            value: body.value,
        });

        return ResultData.ok(result);
    }
}

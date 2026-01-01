import { Controller, Get, Put, Delete, Body, Param, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam } from "@nestjs/swagger";
import { DictionaryService } from "./dictionary.service";
import { ResultData } from "../../shared/utils/result";
import { ApiResult } from "../../shared/decorators/api-result.decorator";
import { DictionaryCollectionResponseDto } from "./dto/dictionary.dto";

/**
 * 用户私有数据控制器
 * 用于存储用户个人偏好、设置等数据
 */
@ApiTags("用户私有数据")
@Controller("/api/user-data")
export class UserDictionaryController {
    constructor(private readonly dictionaryService: DictionaryService) {}

    @Get(":collection")
    @ApiOperation({ summary: "获取用户在集合中的所有数据" })
    @ApiParam({ name: "collection", description: "集合名称" })
    @ApiResult(DictionaryCollectionResponseDto)
    async getUserData(@Param("collection") collection: string, @Req() req: any): Promise<ResultData> {
        const userId = req.user?.id;
        if (!userId) {
            throw new Error("用户未登录");
        }

        const result = await this.dictionaryService.getUserData(collection, userId);
        return ResultData.ok(result);
    }

    @Get(":collection/:key")
    @ApiOperation({ summary: "获取用户的单个数据" })
    @ApiParam({ name: "collection", description: "集合名称" })
    @ApiParam({ name: "key", description: "数据键" })
    async getUserValue(
        @Param("collection") collection: string,
        @Param("key") key: string,
        @Req() req: any,
    ): Promise<ResultData> {
        const userId = req.user?.id;
        if (!userId) {
            throw new Error("用户未登录");
        }

        const result = await this.dictionaryService.getUserValue(collection, userId, key);
        return ResultData.ok(result);
    }

    @Put(":collection/:key")
    @ApiOperation({ summary: "设置用户数据" })
    @ApiParam({ name: "collection", description: "集合名称" })
    @ApiParam({ name: "key", description: "数据键" })
    async setUserValue(
        @Param("collection") collection: string,
        @Param("key") key: string,
        @Body() body: { value: any },
        @Req() req: any,
    ): Promise<ResultData> {
        const userId = req.user?.id;
        if (!userId) {
            throw new Error("用户未登录");
        }

        await this.dictionaryService.setUserValue(collection, userId, key, body.value);
        return ResultData.ok({ message: "设置成功" });
    }

    @Delete(":collection/:key")
    @ApiOperation({ summary: "删除用户数据" })
    @ApiParam({ name: "collection", description: "集合名称" })
    @ApiParam({ name: "key", description: "数据键" })
    async deleteUserValue(
        @Param("collection") collection: string,
        @Param("key") key: string,
        @Req() req: any,
    ): Promise<ResultData> {
        const userId = req.user?.id;
        if (!userId) {
            throw new Error("用户未登录");
        }

        await this.dictionaryService.deleteUserValue(collection, userId, key);
        return ResultData.ok({ message: "删除成功" });
    }
}

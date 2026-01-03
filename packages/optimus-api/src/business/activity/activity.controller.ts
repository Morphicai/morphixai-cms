import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from "@nestjs/swagger";
import { ActivityService } from "./activity.service";
import { ResultData } from "../../shared/utils/result";
import { ApiResult } from "../../shared/decorators/api-result.decorator";

@ApiTags("活动管理")
@Controller("biz/activity")
export class ActivityController {
    constructor(private readonly activityService: ActivityService) {}

    @Get()
    @ApiOperation({ summary: "获取活动列表" })
    @ApiQuery({ name: "page", required: false, type: Number, description: "页码，从1开始", example: 1 })
    @ApiQuery({ name: "pageSize", required: false, type: Number, description: "每页数量", example: 10 })
    @ApiResponse({ status: 200, description: "获取活动列表成功" })
    @ApiResult()
    async findAll(@Query("page") page?: string, @Query("pageSize") pageSize?: string): Promise<ResultData> {
        const pageNum = page ? parseInt(page, 10) : 1;
        const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 10;
        return await this.activityService.findAll(pageNum, pageSizeNum);
    }
}


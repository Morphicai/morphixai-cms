import { Controller, Get, Query, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiExtraModels } from "@nestjs/swagger";
import { OperationLogService, QueryOperationLogDto } from "../services/operation-log.service";
import { OperationLogEntity } from "../entities/operation-log.entity";
import { ResultData } from "../utils/result";
import { ApiResult } from "../decorators/api-result.decorator";
import { JwtAuthGuard } from "../guards/auth.guard";

/**
 * 操作日志控制器
 * 提供操作日志的查询接口
 */
@ApiTags("操作日志")
@ApiBearerAuth()
@ApiExtraModels(ResultData, OperationLogEntity)
@Controller("operation-log")
@UseGuards(JwtAuthGuard)
export class OperationLogController {
    constructor(private readonly operationLogService: OperationLogService) {}

    @Get("list")
    @ApiOperation({ summary: "查询操作日志列表" })
    @ApiQuery({ name: "page", required: false, description: "页码" })
    @ApiQuery({ name: "pageSize", required: false, description: "每页数量" })
    @ApiQuery({ name: "module", required: false, description: "模块名称" })
    @ApiQuery({ name: "action", required: false, description: "操作类型" })
    @ApiQuery({ name: "userId", required: false, description: "用户ID" })
    @ApiQuery({ name: "status", required: false, description: "状态" })
    @ApiQuery({ name: "keyword", required: false, description: "关键词" })
    @ApiResult(OperationLogEntity, true, true)
    async findList(@Query() query: QueryOperationLogDto): Promise<ResultData> {
        const { list, total } = await this.operationLogService.findLogs(query);
        return ResultData.ok({ list, total });
    }

    @Get("detail/:id")
    @ApiOperation({ summary: "查询操作日志详情" })
    @ApiResult(OperationLogEntity)
    async findOne(@Param("id") id: string): Promise<ResultData> {
        const log = await this.operationLogService.findLogById(+id);
        if (!log) {
            return ResultData.fail(404, "操作日志不存在");
        }
        return ResultData.ok(log);
    }

    @Get("user/:userId")
    @ApiOperation({ summary: "查询用户操作日志" })
    @ApiQuery({ name: "limit", required: false, description: "返回数量" })
    @ApiResult(OperationLogEntity, true)
    async findUserLogs(@Param("userId") userId: string, @Query("limit") limit?: number): Promise<ResultData> {
        const logs = await this.operationLogService.findUserLogs(userId, limit || 50);
        return ResultData.ok(logs);
    }

    @Get("module/:module")
    @ApiOperation({ summary: "查询模块操作日志" })
    @ApiQuery({ name: "limit", required: false, description: "返回数量" })
    @ApiResult(OperationLogEntity, true)
    async findModuleLogs(@Param("module") module: string, @Query("limit") limit?: number): Promise<ResultData> {
        const logs = await this.operationLogService.findModuleLogs(module, limit || 50);
        return ResultData.ok(logs);
    }

    @Get("statistics")
    @ApiOperation({ summary: "获取操作统计" })
    @ApiQuery({ name: "startDate", required: false, description: "开始日期" })
    @ApiQuery({ name: "endDate", required: false, description: "结束日期" })
    @ApiResult()
    async getStatistics(
        @Query("startDate") startDate?: string,
        @Query("endDate") endDate?: string,
    ): Promise<ResultData> {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        const stats = await this.operationLogService.getStatistics(start, end);
        return ResultData.ok(stats);
    }
}

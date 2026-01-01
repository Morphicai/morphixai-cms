import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Req, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { ArticleService } from "./article.service";
import { CreateArticleDto } from "./dto/create-article.dto";
import { UpdateArticleDto } from "./dto/update-article.dto";
import { FindAllArticleDto } from "./dto/find-all-article.dto";
import { UpdateScheduleDto } from "./dto/update-schedule.dto";
import { JwtAuthGuard } from "../../shared/guards/auth.guard";
import { ResultData } from "../../shared/utils/result";
import { ArticleOperationLogService } from "./services/article-operation-log.service";
import { OperationLog } from "../../shared/decorators/operation-log.decorator";

@ApiTags("文章管理")
@Controller("article")
@UseGuards(JwtAuthGuard)
export class ArticleController {
    constructor(
        private readonly articleService: ArticleService,
        private readonly operationLogService: ArticleOperationLogService,
    ) {}

    @Post()
    @ApiOperation({ summary: "创建文章" })
    @ApiResponse({ status: 201, description: "文章创建成功" })
    @OperationLog({
        module: "article",
        action: "create",
        description: "创建文章: {slug}",
        recordParams: true,
        recordResponse: true,
    })
    async create(@Body() createArticleDto: CreateArticleDto, @Req() req: any) {
        const article = await this.articleService.create(createArticleDto, req.user.id);
        return ResultData.ok(article, "文章创建成功");
    }

    @Get()
    @ApiOperation({ summary: "获取文章列表" })
    @ApiResponse({ status: 200, description: "获取文章列表成功" })
    async findAll(@Query() query: FindAllArticleDto) {
        const result = await this.articleService.findAll(query);
        return ResultData.ok(result, "获取文章列表成功");
    }

    @Get("deleted/list")
    @ApiOperation({ summary: "获取已删除文章列表" })
    @ApiResponse({ status: 200, description: "获取已删除文章列表成功" })
    async findDeleted(@Query() query: FindAllArticleDto) {
        const result = await this.articleService.findDeleted(query);
        return ResultData.ok(result, "获取已删除文章列表成功");
    }

    @Get("search")
    @ApiOperation({ summary: "搜索文章" })
    @ApiResponse({ status: 200, description: "搜索文章成功" })
    async search(@Query("keyword") keyword: string, @Query() query: FindAllArticleDto) {
        const result = await this.articleService.search(keyword, query);
        return ResultData.ok(result, "搜索文章成功");
    }

    @Get("slug/:slug")
    @ApiOperation({ summary: "根据slug获取文章详情" })
    @ApiResponse({ status: 200, description: "获取文章详情成功" })
    async findBySlug(@Param("slug") slug: string, @Req() req: any) {
        const userId = req.user?.id;
        const article = await this.articleService.findBySlugPublic(slug, userId);
        return ResultData.ok(article, "获取文章详情成功");
    }

    @Get(":id")
    @ApiOperation({ summary: "根据ID获取文章详情" })
    @ApiResponse({ status: 200, description: "获取文章详情成功" })
    async findOne(@Param("id") id: string, @Req() req: any) {
        const userId = req.user?.id;
        const article = await this.articleService.findOnePublic(+id, userId);
        return ResultData.ok(article, "获取文章详情成功");
    }

    @Put(":id")
    @ApiOperation({ summary: "更新文章" })
    @ApiResponse({ status: 200, description: "文章更新成功" })
    @OperationLog({
        module: "article",
        action: "update",
        description: "更新文章 ID: {id}",
        recordParams: true,
        recordResponse: true,
    })
    async update(@Param("id") id: string, @Body() updateArticleDto: UpdateArticleDto, @Req() req: any) {
        const article = await this.articleService.update(+id, updateArticleDto, req.user.id);
        return ResultData.ok(article, "文章更新成功");
    }

    @Post(":id/publish")
    @ApiOperation({ summary: "发布文章" })
    @ApiResponse({ status: 200, description: "文章发布成功" })
    @OperationLog({
        module: "article",
        action: "publish",
        description: "发布文章 ID: {id}",
        recordParams: true,
        recordResponse: true,
    })
    async publish(@Param("id") id: string) {
        const article = await this.articleService.publish(+id);
        return ResultData.ok(article, "文章发布成功");
    }

    @Post(":id/archive")
    @ApiOperation({ summary: "归档文章" })
    @ApiResponse({ status: 200, description: "文章归档成功" })
    @OperationLog({
        module: "article",
        action: "archive",
        description: "归档文章 ID: {id}",
        recordParams: true,
        recordResponse: true,
    })
    async archive(@Param("id") id: string) {
        const article = await this.articleService.archive(+id);
        return ResultData.ok(article, "文章归档成功");
    }

    @Delete(":id")
    @ApiOperation({ summary: "删除文章" })
    @ApiResponse({ status: 200, description: "文章删除成功" })
    @OperationLog({
        module: "article",
        action: "delete",
        description: "删除文章 ID: {id}",
        recordParams: true,
        recordResponse: false,
    })
    async remove(@Param("id") id: string, @Req() req: any) {
        await this.articleService.remove(+id, req.user.id);
        return ResultData.ok(null, "文章删除成功");
    }

    @Post(":id/restore")
    @ApiOperation({ summary: "恢复已删除的文章" })
    @ApiResponse({ status: 200, description: "文章恢复成功" })
    @OperationLog({
        module: "article",
        action: "restore",
        description: "恢复文章 ID: {id}",
        recordParams: true,
        recordResponse: true,
    })
    async restore(@Param("id") id: string) {
        const article = await this.articleService.restore(+id);
        return ResultData.ok(article, "文章恢复成功");
    }

    @Get(":id/can-permanent-delete")
    @ApiOperation({ summary: "检查文章是否可以永久删除" })
    @ApiResponse({ status: 200, description: "检查完成" })
    async canPermanentlyDelete(@Param("id") id: string) {
        const result = await this.articleService.canPermanentlyDelete(+id);
        return ResultData.ok(result, "检查完成");
    }

    @Delete(":id/permanent")
    @ApiOperation({ summary: "永久删除文章（仅限未发布过的文章）" })
    @ApiResponse({ status: 200, description: "文章永久删除成功" })
    @OperationLog({
        module: "article",
        action: "permanent_delete",
        description: "永久删除文章 ID: {id}",
        recordParams: true,
        recordResponse: false,
    })
    async permanentlyDelete(@Param("id") id: string) {
        await this.articleService.permanentlyDelete(+id);
        return ResultData.ok(null, "文章永久删除成功");
    }

    @Get("stats/summary")
    @ApiOperation({ summary: "获取文章统计信息" })
    @ApiResponse({ status: 200, description: "获取统计信息成功" })
    async getStats() {
        const stats = await this.articleService.getStats();
        return ResultData.ok(stats, "获取统计信息成功");
    }

    @Get("scheduled/pending")
    @ApiOperation({ summary: "获取待发布的预定文章列表" })
    @ApiResponse({ status: 200, description: "获取待发布文章列表成功" })
    async getPendingScheduled() {
        const articles = await this.articleService.findPendingScheduled();
        return ResultData.ok(articles, "获取待发布文章列表成功");
    }

    @Put(":id/schedule")
    @ApiOperation({ summary: "设置或更新预定发布时间" })
    @ApiResponse({ status: 200, description: "设置预定发布时间成功" })
    async updateSchedule(@Param("id") id: string, @Body() updateScheduleDto: UpdateScheduleDto, @Req() req: any) {
        const article = await this.articleService.updateScheduledTime(+id, updateScheduleDto.scheduledAt, req.user.id);
        return ResultData.ok(article, updateScheduleDto.scheduledAt ? "设置预定发布时间成功" : "取消预定发布成功");
    }

    @Delete(":id/schedule")
    @ApiOperation({ summary: "取消预定发布" })
    @ApiResponse({ status: 200, description: "取消预定发布成功" })
    async cancelSchedule(@Param("id") id: string, @Req() req: any) {
        const article = await this.articleService.cancelScheduledPublish(+id, req.user.id);
        return ResultData.ok(article, "取消预定发布成功");
    }

    @Get(":id/operation-logs")
    @ApiOperation({ summary: "获取文章操作日志" })
    @ApiResponse({ status: 200, description: "获取操作日志成功" })
    async getOperationLogs(@Param("id") id: string, @Query("limit") limit?: number) {
        const logs = await this.operationLogService.getArticleLogs(+id, limit || 50);
        return ResultData.ok(logs, "获取操作日志成功");
    }

    @Get(":id/operation-logs/:type")
    @ApiOperation({ summary: "获取文章特定类型的操作日志" })
    @ApiResponse({ status: 200, description: "获取操作日志成功" })
    async getOperationLogsByType(@Param("id") id: string, @Param("type") type: string, @Query("limit") limit?: number) {
        const logs = await this.operationLogService.getLogsByType(+id, type, limit || 50);
        return ResultData.ok(logs, "获取操作日志成功");
    }
}

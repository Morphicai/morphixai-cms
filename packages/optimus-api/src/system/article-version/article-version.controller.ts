import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { ArticleVersionService } from "./article-version.service";
import { CreateVersionDto } from "./dto/create-version.dto";
import { UpdateVersionDto } from "./dto/update-version.dto";
import { JwtAuthGuard } from "../../shared/guards/auth.guard";
import { ResultData } from "../../shared/utils/result";
import { OperationLog } from "../../shared/decorators/operation-log.decorator";

@ApiTags("文章版本管理")
@Controller("article/:articleId/version")
@UseGuards(JwtAuthGuard)
export class ArticleVersionController {
    constructor(private readonly versionService: ArticleVersionService) {}

    @Get()
    @ApiOperation({ summary: "获取文章版本列表" })
    @ApiResponse({ status: 200, description: "获取版本列表成功" })
    async getVersions(@Param("articleId") articleId: string) {
        const versions = await this.versionService.findByArticle(+articleId);
        return ResultData.ok(versions, "获取版本列表成功");
    }

    @Get("stats")
    @ApiOperation({ summary: "获取文章版本统计信息" })
    @ApiResponse({ status: 200, description: "获取统计信息成功" })
    async getVersionStats(@Param("articleId") articleId: string) {
        const stats = await this.versionService.getVersionStats(+articleId);
        return ResultData.ok(stats, "获取统计信息成功");
    }

    @Get(":versionId")
    @ApiOperation({ summary: "获取特定版本详情" })
    @ApiResponse({ status: 200, description: "获取版本详情成功" })
    async getVersion(@Param("articleId") articleId: string, @Param("versionId") versionId: string) {
        const version = await this.versionService.findOne(+articleId, +versionId);
        return ResultData.ok(version, "获取版本详情成功");
    }

    @Get(":versionId/can-delete")
    @ApiOperation({ summary: "检查版本是否可以删除" })
    @ApiResponse({ status: 200, description: "检查完成" })
    async canDeleteVersion(@Param("articleId") articleId: string, @Param("versionId") versionId: string) {
        const result = await this.versionService.canDeleteVersion(+versionId);
        return ResultData.ok(result, "检查完成");
    }

    @Get(":versionId/compare/:targetVersionId")
    @ApiOperation({ summary: "比较两个版本" })
    @ApiResponse({ status: 200, description: "版本比较成功" })
    async compareVersions(
        @Param("articleId") articleId: string,
        @Param("versionId") versionId: string,
        @Param("targetVersionId") targetVersionId: string,
    ) {
        const comparison = await this.versionService.compareVersions(+articleId, +versionId, +targetVersionId);
        return ResultData.ok(comparison, "版本比较成功");
    }

    @Post()
    @ApiOperation({ summary: "创建新版本（保存草稿）" })
    @ApiResponse({ status: 201, description: "版本创建成功" })
    @OperationLog({
        module: "article_version",
        action: "create",
        description: "创建文章版本 - 文章ID: {articleId}",
        recordParams: true,
        recordResponse: true,
    })
    async createVersion(
        @Param("articleId") articleId: string,
        @Body() createVersionDto: CreateVersionDto,
        @Req() req: any,
    ) {
        const version = await this.versionService.create(+articleId, createVersionDto, req.user.id);
        return ResultData.ok(version, "版本创建成功");
    }

    @Post(":versionId/revert")
    @ApiOperation({ summary: "回退到指定版本" })
    @ApiResponse({ status: 200, description: "版本回退成功" })
    @OperationLog({
        module: "article_version",
        action: "revert",
        description: "回退到版本 ID: {versionId}",
        recordParams: true,
        recordResponse: true,
    })
    async revertToVersion(
        @Param("articleId") articleId: string,
        @Param("versionId") versionId: string,
        @Req() req: any,
    ) {
        const version = await this.versionService.revertToVersion(+articleId, +versionId, req.user.id);
        return ResultData.ok(version, "版本回退成功");
    }

    @Post(":versionId/set-current")
    @ApiOperation({ summary: "设置为当前版本" })
    @ApiResponse({ status: 200, description: "设置当前版本成功" })
    @OperationLog({
        module: "article_version",
        action: "set_current",
        description: "设置当前版本 ID: {versionId}",
        recordParams: true,
        recordResponse: false,
    })
    async setCurrentVersion(@Param("articleId") articleId: string, @Param("versionId") versionId: string) {
        await this.versionService.setCurrentVersion(+articleId, +versionId);
        return ResultData.ok(null, "设置当前版本成功");
    }

    @Patch(":versionId")
    @ApiOperation({ summary: "更新版本" })
    @ApiResponse({ status: 200, description: "版本更新成功" })
    @OperationLog({
        module: "article_version",
        action: "update",
        description: "更新文章版本 ID: {versionId}",
        recordParams: true,
        recordResponse: true,
    })
    async updateVersion(@Param("versionId") versionId: string, @Body() updateVersionDto: UpdateVersionDto) {
        const version = await this.versionService.update(+versionId, updateVersionDto);
        return ResultData.ok(version, "版本更新成功");
    }

    @Delete(":versionId")
    @ApiOperation({ summary: "删除版本" })
    @ApiResponse({ status: 200, description: "版本删除成功" })
    @OperationLog({
        module: "article_version",
        action: "delete",
        description: "删除文章版本 ID: {versionId}",
        recordParams: true,
        recordResponse: false,
    })
    async deleteVersion(@Param("articleId") articleId: string, @Param("versionId") versionId: string) {
        await this.versionService.remove(+versionId);
        return ResultData.ok(null, "版本删除成功");
    }

    @Delete("drafts/bulk")
    @ApiOperation({ summary: "批量删除草稿版本" })
    @ApiResponse({ status: 200, description: "批量删除成功" })
    @OperationLog({
        module: "article_version",
        action: "bulk_delete_drafts",
        description: "批量删除草稿版本 - 文章ID: {articleId}",
        recordParams: true,
        recordResponse: true,
    })
    async bulkDeleteDrafts(@Param("articleId") articleId: string) {
        const result = await this.versionService.bulkDeleteDraftVersions(+articleId);
        return ResultData.ok(result, "批量删除成功");
    }
}

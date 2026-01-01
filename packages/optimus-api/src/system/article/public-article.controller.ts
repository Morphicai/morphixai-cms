import { Controller, Get, Query, Param, NotFoundException } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { ArticleService } from "./article.service";
import { FindAllArticleDto } from "./dto/find-all-article.dto";
import { PublicArticleDetailDto } from "./dto/public-article-detail.dto";
import { PaginatedArticleListDto } from "./dto/paginated-article-list.dto";
import { ResultData } from "../../shared/utils/result";
import { AllowAnonymous } from "../../shared/decorators/allow-anonymous.decorator";

@ApiTags("公开文章接口")
@Controller("public/articles")
@AllowAnonymous()
export class PublicArticleController {
    constructor(private readonly articleService: ArticleService) {}

    @Get()
    @ApiOperation({ summary: "获取已发布的文章列表（公开接口）" })
    @ApiResponse({ status: 200, description: "获取文章列表成功", type: PaginatedArticleListDto })
    @ApiQuery({ name: "page", required: false, description: "页码，默认为 1" })
    @ApiQuery({ name: "pageSize", required: false, description: "每页数量，默认为 10" })
    @ApiQuery({ name: "categoryCode", required: false, description: "分类标识符，支持查询子分类" })
    @ApiQuery({
        name: "categoryId",
        required: false,
        description: "分类ID（已废弃，请使用 categoryCode）",
        deprecated: true,
    })
    @ApiQuery({ name: "sortBy", required: false, description: "排序字段：publishedAt, updateDate, sortWeight" })
    @ApiQuery({ name: "sortOrder", required: false, description: "排序方向：ASC, DESC" })
    @ApiQuery({ name: "keyword", required: false, description: "搜索关键词" })
    async findPublished(@Query() query: FindAllArticleDto) {
        // 强制只查询已发布的文章
        const publishedQuery = {
            ...query,
            status: "published",
        };

        const result = await this.articleService.findAllForPublic(publishedQuery);
        return ResultData.ok(result, "获取文章列表成功");
    }

    @Get("search")
    @ApiOperation({ summary: "搜索已发布的文章（公开接口）" })
    @ApiResponse({ status: 200, description: "搜索文章成功", type: PaginatedArticleListDto })
    @ApiQuery({ name: "keyword", required: true, description: "搜索关键词" })
    @ApiQuery({ name: "page", required: false, description: "页码，默认为 1" })
    @ApiQuery({ name: "pageSize", required: false, description: "每页数量，默认为 10" })
    @ApiQuery({ name: "categoryCode", required: false, description: "分类标识符" })
    @ApiQuery({
        name: "categoryId",
        required: false,
        description: "分类ID（已废弃，请使用 categoryCode）",
        deprecated: true,
    })
    async searchPublished(@Query("keyword") keyword: string, @Query() query: FindAllArticleDto) {
        // 强制只搜索已发布的文章
        const publishedQuery = {
            ...query,
            keyword,
            status: "published",
        };

        const result = await this.articleService.findAllForPublic(publishedQuery);
        return ResultData.ok(result, "搜索文章成功");
    }

    @Get("slug/:slug")
    @ApiOperation({ summary: "根据slug获取已发布文章详情（公开接口）" })
    @ApiResponse({ status: 200, description: "获取文章详情成功", type: PublicArticleDetailDto })
    @ApiResponse({ status: 404, description: "文章不存在或未发布" })
    async findBySlug(@Param("slug") slug: string) {
        try {
            const article = await this.articleService.findBySlugForPublic(slug);
            return ResultData.ok(article, "获取文章详情成功");
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw new NotFoundException("文章不存在或未发布");
            }
            throw error;
        }
    }

    @Get(":id")
    @ApiOperation({ summary: "根据ID获取已发布文章详情（公开接口）" })
    @ApiResponse({ status: 200, description: "获取文章详情成功", type: PublicArticleDetailDto })
    @ApiResponse({ status: 404, description: "文章不存在或未发布" })
    async findOne(@Param("id") id: string) {
        try {
            const article = await this.articleService.findOneForPublic(+id);
            return ResultData.ok(article, "获取文章详情成功");
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw new NotFoundException("文章不存在或未发布");
            }
            throw error;
        }
    }
}

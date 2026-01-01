import { ApiProperty } from "@nestjs/swagger";
import { ArticleListItemDto } from "./article-list-item.dto";

/**
 * 分页文章列表 DTO - 用于公开接口，不包含文章详细内容
 */
export class PaginatedArticleListDto {
    @ApiProperty({ description: "文章列表", type: [ArticleListItemDto] })
    items: ArticleListItemDto[];

    @ApiProperty({ description: "总数" })
    total: number;

    @ApiProperty({ description: "当前页码" })
    page: number;

    @ApiProperty({ description: "每页数量" })
    pageSize: number;

    @ApiProperty({ description: "总页数" })
    totalPages: number;
}

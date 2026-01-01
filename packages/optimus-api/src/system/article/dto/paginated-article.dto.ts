import { ApiProperty } from "@nestjs/swagger";
import { ArticleEntity } from "../entities/article.entity";

export class PaginatedArticleDto {
    @ApiProperty({ description: "文章列表" })
    items: ArticleEntity[];

    @ApiProperty({ description: "总数" })
    total: number;

    @ApiProperty({ description: "当前页码" })
    page: number;

    @ApiProperty({ description: "每页数量" })
    pageSize: number;

    @ApiProperty({ description: "总页数" })
    totalPages: number;
}

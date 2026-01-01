import { ApiProperty } from "@nestjs/swagger";
import { CategoryEntity } from "../../category/entities/category.entity";

/**
 * 文章列表项 DTO - 用于列表展示，不包含文章详细内容
 */
export class ArticleListItemDto {
    @ApiProperty({ description: "文章ID" })
    id: number;

    @ApiProperty({ description: "文章标识符（slug）" })
    slug: string;

    @ApiProperty({ description: "文章状态" })
    status: string;

    @ApiProperty({ description: "发布时间" })
    publishedAt: Date;

    @ApiProperty({ description: "创建时间" })
    createDate: Date;

    @ApiProperty({ description: "更新时间" })
    updateDate: Date;

    @ApiProperty({ description: "分类信息" })
    category: CategoryEntity;

    @ApiProperty({ description: "文章标题" })
    title: string;

    @ApiProperty({ description: "文章摘要" })
    summary: string;

    @ApiProperty({ description: "封面图片" })
    coverImages: string[];

    @ApiProperty({ description: "排序权重" })
    sortWeight: number;

    @ApiProperty({ description: "SEO标题" })
    seoTitle: string;

    @ApiProperty({ description: "SEO描述" })
    seoDescription: string;

    @ApiProperty({ description: "SEO关键词" })
    seoKeywords: string;
}

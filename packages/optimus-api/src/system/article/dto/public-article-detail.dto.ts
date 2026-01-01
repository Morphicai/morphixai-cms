import { ApiProperty } from "@nestjs/swagger";
import { CategoryEntity } from "../../category/entities/category.entity";

/**
 * 公开文章详情 DTO
 * 将版本数据扁平化，隐藏版本概念，让客户端感知不到版本的存在
 */
export class PublicArticleDetailDto {
    @ApiProperty({ description: "文章ID" })
    id: number;

    @ApiProperty({ description: "URL友好的标识符" })
    slug: string;

    @ApiProperty({ description: "当前发布状态" })
    status: string;

    @ApiProperty({ description: "实际发布时间" })
    publishedAt: Date;

    @ApiProperty({ description: "分类信息" })
    category: CategoryEntity;

    @ApiProperty({ description: "文章标题（来自当前版本）" })
    title: string;

    @ApiProperty({ description: "文章摘要（来自当前版本）" })
    summary: string;

    @ApiProperty({ description: "文章内容HTML（来自当前版本）" })
    content: string;

    @ApiProperty({ description: "封面图片数组（来自当前版本）" })
    coverImages: string[];

    @ApiProperty({ description: "排序权重（来自当前版本）" })
    sortWeight: number;

    @ApiProperty({ description: "SEO标题（来自当前版本）" })
    seoTitle: string;

    @ApiProperty({ description: "SEO描述（来自当前版本）" })
    seoDescription: string;

    @ApiProperty({ description: "SEO关键词（来自当前版本）" })
    seoKeywords: string;

    @ApiProperty({ description: "创建时间" })
    createDate: Date;

    @ApiProperty({ description: "更新时间" })
    updateDate: Date;
}

import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsNumber, IsEnum, IsString, Min } from "class-validator";
import { Type } from "class-transformer";

export class FindAllArticleDto {
    @ApiProperty({ description: "页码", required: false, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: "page 必须为数字类型" })
    @Min(1, { message: "page 最小值为 1" })
    readonly page?: number = 1;

    @ApiProperty({ description: "每页数量", required: false, default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: "pageSize 必须为数字类型" })
    @Min(1, { message: "pageSize 最小值为 1" })
    readonly pageSize?: number = 10;

    @ApiProperty({ description: "分类ID（已废弃，请使用 categoryCode）", required: false, deprecated: true })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: "categoryId 必须为数字类型" })
    readonly categoryId?: number;

    @ApiProperty({ description: "分类标识符", required: false })
    @IsOptional()
    @IsString({ message: "categoryCode 必须为字符串类型" })
    readonly categoryCode?: string;

    @ApiProperty({ description: "文章状态", required: false, enum: ["draft", "published", "archived"] })
    @IsOptional()
    @IsEnum(["draft", "published", "archived"], { message: "status 必须为 draft, published 或 archived" })
    readonly status?: string;

    @ApiProperty({ description: "排序字段", required: false, enum: ["publishedAt", "updateDate", "sortWeight"] })
    @IsOptional()
    @IsEnum(["publishedAt", "updateDate", "sortWeight"], {
        message: "sortBy 必须为 publishedAt, updateDate 或 sortWeight",
    })
    readonly sortBy?: string = "publishedAt";

    @ApiProperty({ description: "排序方向", required: false, enum: ["ASC", "DESC"] })
    @IsOptional()
    @IsEnum(["ASC", "DESC"], { message: "sortOrder 必须为 ASC 或 DESC" })
    readonly sortOrder?: "ASC" | "DESC" = "DESC";

    @ApiProperty({ description: "搜索关键词", required: false })
    @IsOptional()
    @IsString({ message: "keyword 必须为字符串类型" })
    readonly keyword?: string;
}

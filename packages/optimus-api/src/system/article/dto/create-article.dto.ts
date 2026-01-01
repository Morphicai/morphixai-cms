import { ApiProperty } from "@nestjs/swagger";
import {
    IsString,
    IsNotEmpty,
    MaxLength,
    IsArray,
    IsOptional,
    IsNumber,
    IsDateString,
    ValidateIf,
} from "class-validator";

export class CreateArticleDto {
    @ApiProperty({ description: "文章标题" })
    @IsString({ message: "title 必须为字符串类型" })
    @IsNotEmpty({ message: "title 不能为空" })
    @MaxLength(200, { message: "title 最多200个字符" })
    readonly title: string;

    @ApiProperty({ description: "URL 标识符", required: false })
    @IsString({ message: "slug 必须为字符串类型" })
    @IsOptional()
    @MaxLength(200, { message: "slug 最多200个字符" })
    readonly slug?: string;

    @ApiProperty({ description: "文章摘要", required: false })
    @IsString({ message: "summary 必须为字符串类型" })
    @IsOptional()
    readonly summary?: string;

    @ApiProperty({ description: "文章内容(HTML格式)" })
    @IsString({ message: "content 必须为字符串类型" })
    @IsNotEmpty({ message: "content 不能为空" })
    readonly content: string;

    @ApiProperty({ description: "封面图片数组", required: false })
    @IsArray({ message: "coverImages 必须为数组类型" })
    @IsOptional()
    readonly coverImages?: string[];

    @ApiProperty({ description: "排序权重", required: false })
    @IsNumber({}, { message: "sortWeight 必须为数字类型" })
    @IsOptional()
    readonly sortWeight?: number;

    @ApiProperty({ description: "分类ID" })
    @IsNumber({}, { message: "categoryId 必须为数字类型" })
    @IsNotEmpty({ message: "categoryId 不能为空" })
    readonly categoryId: number;

    @ApiProperty({ description: "SEO标题", required: false })
    @IsString({ message: "seoTitle 必须为字符串类型" })
    @IsOptional()
    readonly seoTitle?: string;

    @ApiProperty({ description: "SEO描述", required: false })
    @IsString({ message: "seoDescription 必须为字符串类型" })
    @IsOptional()
    readonly seoDescription?: string;

    @ApiProperty({ description: "SEO关键词", required: false })
    @IsString({ message: "seoKeywords 必须为字符串类型" })
    @IsOptional()
    readonly seoKeywords?: string;

    @ApiProperty({ description: "预定发布时间", required: false })
    @IsDateString({}, { message: "scheduledAt 必须为有效的日期字符串" })
    @IsOptional()
    readonly scheduledAt?: string;
}

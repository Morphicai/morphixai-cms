import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, MaxLength, IsArray, IsOptional, IsNumber, IsEnum, ArrayMaxSize } from "class-validator";
import { IsCoverImagesValid } from "./validators/cover-images.validator";

export class CreateVersionDto {
    @ApiProperty({ description: "文章标题" })
    @IsString({ message: "title 必须为字符串类型" })
    @IsNotEmpty({ message: "title 不能为空" })
    @MaxLength(200, { message: "title 最多200个字符" })
    readonly title: string;

    @ApiProperty({ description: "文章摘要" })
    @IsString({ message: "summary 必须为字符串类型" })
    @IsNotEmpty({ message: "summary 不能为空" })
    @MaxLength(1000, { message: "summary 最多1000个字符" })
    readonly summary: string;

    @ApiProperty({ description: "文章内容(HTML格式)" })
    @IsString({ message: "content 必须为字符串类型" })
    @IsNotEmpty({ message: "content 不能为空" })
    readonly content: string;

    @ApiProperty({ description: "封面图片数组", required: false })
    @IsArray({ message: "coverImages 必须为数组类型" })
    @ArrayMaxSize(10, { message: "封面图片最多10张" })
    @IsCoverImagesValid({ message: "封面图片数量超出分类限制" })
    @IsOptional()
    readonly coverImages?: string[];

    @ApiProperty({ description: "排序权重", required: false })
    @IsNumber({}, { message: "sortWeight 必须为数字类型" })
    @IsOptional()
    readonly sortWeight?: number;

    @ApiProperty({ description: "SEO标题", required: false })
    @IsString({ message: "seoTitle 必须为字符串类型" })
    @MaxLength(200, { message: "seoTitle 最多200个字符" })
    @IsOptional()
    readonly seoTitle?: string;

    @ApiProperty({ description: "SEO描述", required: false })
    @IsString({ message: "seoDescription 必须为字符串类型" })
    @MaxLength(500, { message: "seoDescription 最多500个字符" })
    @IsOptional()
    readonly seoDescription?: string;

    @ApiProperty({ description: "SEO关键词", required: false })
    @IsString({ message: "seoKeywords 必须为字符串类型" })
    @MaxLength(500, { message: "seoKeywords 最多500个字符" })
    @IsOptional()
    readonly seoKeywords?: string;

    @ApiProperty({ description: "版本状态", required: false })
    @IsEnum(["draft", "published", "archived"], { message: "status 必须为 draft, published 或 archived" })
    @IsOptional()
    readonly status?: string;
}

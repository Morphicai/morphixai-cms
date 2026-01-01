import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional, IsString, IsNumber, IsBoolean, Min, Max } from "class-validator";

/**
 * 缩略图选项DTO
 */
export class ThumbnailOptionsDto {
    @ApiProperty({ description: "缩略图宽度", required: false })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    width?: number;

    @ApiProperty({ description: "缩略图高度", required: false })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    height?: number;

    @ApiProperty({ description: "图片质量 (1-100)", required: false })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    @Type(() => Number)
    quality?: number;
}

/**
 * 文件上传选项DTO
 */
export class UploadOptionsDto {
    @ApiProperty({ description: "文件夹路径", required: false })
    @IsOptional()
    @IsString()
    folder?: string;

    @ApiProperty({ description: "是否生成缩略图", required: false, default: false })
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    generateThumbnail?: boolean;

    @ApiProperty({ description: "缩略图选项", required: false, type: ThumbnailOptionsDto })
    @IsOptional()
    @Type(() => ThumbnailOptionsDto)
    thumbnailOptions?: ThumbnailOptionsDto;

    @ApiProperty({ description: "业务标识", required: false })
    @IsOptional()
    @IsString()
    business?: string;
}

/**
 * 文件上传结果DTO
 */
export class FileResultDto {
    @ApiProperty({ description: "文件ID" })
    id?: number;

    @ApiProperty({ description: "文件名" })
    fileName: string;

    @ApiProperty({ description: "原始文件名" })
    originalName?: string;

    @ApiProperty({ description: "文件访问URL" })
    url: string;

    @ApiProperty({ description: "缩略图URL" })
    thumbnailUrl?: string;

    @ApiProperty({ description: "文件大小" })
    size: number;

    @ApiProperty({ description: "MIME类型" })
    mimeType: string;

    @ApiProperty({ description: "文件键名" })
    fileKey?: string;

    @ApiProperty({ description: "存储提供商类型", enum: ["minio", "aliyun", "local"] })
    storageProvider?: string;

    @ApiProperty({ description: "CDN加速地址" })
    cdnUrl?: string;
}

/**
 * 文件信息DTO
 */
export class FileInfoDto {
    @ApiProperty({ description: "文件名" })
    fileName: string;

    @ApiProperty({ description: "文件大小" })
    size: number;

    @ApiProperty({ description: "MIME类型" })
    mimeType: string;

    @ApiProperty({ description: "最后修改时间" })
    lastModified?: Date;

    @ApiProperty({ description: "文件标签" })
    tags?: Record<string, string>;
}

/**
 * 用户信息DTO
 */
export class UserInfoDto {
    @ApiProperty({ description: "用户ID" })
    id: string;

    @ApiProperty({ description: "用户账号" })
    account: string;
}

/**
 * 统一文件上传参数DTO
 */
export class UnifiedUploadParamsDto {
    files: Express.Multer.File[];
    options: UploadOptionsDto;
    user: UserInfoDto;
}

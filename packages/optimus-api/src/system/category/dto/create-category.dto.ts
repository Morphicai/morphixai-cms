import { ApiProperty } from "@nestjs/swagger";
import {
    IsString,
    IsNotEmpty,
    MaxLength,
    IsOptional,
    IsObject,
    IsNumber,
    ValidateNested,
    IsPositive,
    Min,
    Max,
    IsEnum,
    IsArray,
    ArrayMinSize,
    ValidateIf,
} from "class-validator";
import { Transform, Type } from "class-transformer";

// 封面分辨率限制类型
export enum CoverResolutionType {
    WIDTH_ONLY = "width_only", // 只限制宽度
    HEIGHT_ONLY = "height_only", // 只限制高度
    ASPECT_RATIO = "aspect_ratio", // 限制比例
    MAX_SIZE = "max_size", // 限制最大尺寸
    EXACT_SIZES = "exact_sizes", // 只允许特定分辨率
}

// 允许的分辨率配置
export class AllowedResolutionDto {
    @ApiProperty({ description: "宽度", required: false })
    @IsOptional()
    @IsNumber({}, { message: "width 必须为数字类型" })
    @IsPositive({ message: "width 必须为正数" })
    readonly width?: number;

    @ApiProperty({ description: "高度", required: false })
    @IsOptional()
    @IsNumber({}, { message: "height 必须为数字类型" })
    @IsPositive({ message: "height 必须为正数" })
    readonly height?: number;
}

// 封面配置验证类
export class CoverConfigDto {
    @ApiProperty({
        description: "分辨率限制类型",
        enum: CoverResolutionType,
        required: false,
    })
    @IsOptional()
    @IsEnum(CoverResolutionType, { message: "resolutionType 必须为有效的分辨率限制类型" })
    readonly resolutionType?: CoverResolutionType;

    @ApiProperty({ description: "限制宽度（当类型为 width_only 或 max_size 时）", required: false })
    @ValidateIf(
        (o) => o.resolutionType === CoverResolutionType.WIDTH_ONLY || o.resolutionType === CoverResolutionType.MAX_SIZE,
    )
    @IsNumber({}, { message: "width 必须为数字类型" })
    @IsPositive({ message: "width 必须为正数" })
    readonly width?: number;

    @ApiProperty({ description: "限制高度（当类型为 height_only 或 max_size 时）", required: false })
    @ValidateIf(
        (o) =>
            o.resolutionType === CoverResolutionType.HEIGHT_ONLY || o.resolutionType === CoverResolutionType.MAX_SIZE,
    )
    @IsNumber({}, { message: "height 必须为数字类型" })
    @IsPositive({ message: "height 必须为正数" })
    readonly height?: number;

    @ApiProperty({ description: "宽高比（当类型为 aspect_ratio 时，如 16:9 表示为 1.778）", required: false })
    @ValidateIf((o) => o.resolutionType === CoverResolutionType.ASPECT_RATIO)
    @IsNumber({}, { message: "aspectRatio 必须为数字类型" })
    @IsPositive({ message: "aspectRatio 必须为正数" })
    readonly aspectRatio?: number;

    @ApiProperty({
        description: "允许的分辨率列表（当类型为 exact_sizes 时）",
        type: [AllowedResolutionDto],
        required: false,
    })
    @ValidateIf((o) => o.resolutionType === CoverResolutionType.EXACT_SIZES)
    @IsArray({ message: "allowedResolutions 必须为数组类型" })
    @ArrayMinSize(1, { message: "allowedResolutions 至少需要一个分辨率" })
    @ValidateNested({ each: true })
    @Type(() => AllowedResolutionDto)
    readonly allowedResolutions?: AllowedResolutionDto[];

    @ApiProperty({ description: "比例容差（用于 aspect_ratio 类型，默认 0.01）", required: false })
    @IsOptional()
    @IsNumber({}, { message: "aspectRatioTolerance 必须为数字类型" })
    @Min(0, { message: "aspectRatioTolerance 最小值为0" })
    @Max(1, { message: "aspectRatioTolerance 最大值为1" })
    readonly aspectRatioTolerance?: number;
}

// 分类配置验证类
export class CategoryConfigDto {
    @ApiProperty({ description: "最大封面图片数量", required: false, minimum: 1, maximum: 10 })
    @IsOptional()
    @IsNumber({}, { message: "maxCoverImages 必须为数字类型" })
    @Min(1, { message: "maxCoverImages 最小值为1" })
    @Max(10, { message: "maxCoverImages 最大值为10" })
    readonly maxCoverImages?: number;

    @ApiProperty({ description: "最大版本数量", required: false, minimum: 1, maximum: 50 })
    @IsOptional()
    @IsNumber({}, { message: "maxVersions 必须为数字类型" })
    @Min(1, { message: "maxVersions 最小值为1" })
    @Max(50, { message: "maxVersions 最大值为50" })
    readonly maxVersions?: number;

    @ApiProperty({
        description: "封面配置",
        type: CoverConfigDto,
        required: false,
    })
    @IsOptional()
    @IsObject({ message: "coverConfig 必须为对象类型" })
    @ValidateNested()
    @Type(() => CoverConfigDto)
    readonly coverConfig?: CoverConfigDto;
}

export class CreateCategoryDto {
    @ApiProperty({ description: "分类名称" })
    @IsString({ message: "name 必须为字符串类型" })
    @IsNotEmpty({ message: "name 不能为空" })
    @MaxLength(100, { message: "name 最多100个字符" })
    @Transform(({ value }) => value?.trim())
    readonly name: string;

    @ApiProperty({ description: "分类标识符" })
    @IsString({ message: "code 必须为字符串类型" })
    @IsNotEmpty({ message: "code 不能为空" })
    @MaxLength(100, { message: "code 最多100个字符" })
    @Transform(({ value }) => value?.trim().toLowerCase())
    readonly code: string;

    @ApiProperty({ description: "分类描述", required: false })
    @IsString({ message: "description 必须为字符串类型" })
    @IsOptional()
    @MaxLength(500, { message: "description 最多500个字符" })
    @Transform(({ value }) => value?.trim())
    readonly description?: string;

    @ApiProperty({
        description: "分类配置(JSON格式)",
        required: false,
        type: CategoryConfigDto,
        example: { maxCoverImages: 3, maxVersions: 10 },
    })
    @IsOptional()
    @IsObject({ message: "config 必须为对象类型" })
    @ValidateNested()
    @Type(() => CategoryConfigDto)
    readonly config?: CategoryConfigDto;

    @ApiProperty({ description: "父分类ID", required: false })
    @IsNumber({}, { message: "parentId 必须为数字类型" })
    @IsOptional()
    @IsPositive({ message: "parentId 必须为正数" })
    readonly parentId?: number;

    @ApiProperty({ description: "排序权重", required: false, minimum: 0, maximum: 999 })
    @IsNumber({}, { message: "sortWeight 必须为数字类型" })
    @IsOptional()
    @Min(0, { message: "sortWeight 最小值为0" })
    @Max(999, { message: "sortWeight 最大值为999" })
    readonly sortWeight?: number;
}

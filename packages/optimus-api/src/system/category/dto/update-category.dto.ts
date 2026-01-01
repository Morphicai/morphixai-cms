import { PartialType, OmitType, ApiProperty } from "@nestjs/swagger";
import { CreateCategoryDto, CategoryConfigDto } from "./create-category.dto";
import {
    IsOptional,
    IsString,
    MaxLength,
    IsObject,
    IsNumber,
    ValidateNested,
    IsPositive,
    Min,
    Max,
} from "class-validator";
import { Transform, Type } from "class-transformer";

export class UpdateCategoryDto extends PartialType(OmitType(CreateCategoryDto, ["code"] as const)) {
    @ApiProperty({ description: "分类名称", required: false })
    @IsOptional()
    @IsString({ message: "name 必须为字符串类型" })
    @MaxLength(100, { message: "name 最多100个字符" })
    @Transform(({ value }) => value?.trim())
    readonly name?: string;

    @ApiProperty({ description: "分类描述", required: false })
    @IsOptional()
    @IsString({ message: "description 必须为字符串类型" })
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
    @IsOptional()
    @IsNumber({}, { message: "parentId 必须为数字类型" })
    @IsPositive({ message: "parentId 必须为正数" })
    readonly parentId?: number;

    @ApiProperty({ description: "排序权重", required: false, minimum: 0, maximum: 999 })
    @IsOptional()
    @IsNumber({}, { message: "sortWeight 必须为数字类型" })
    @Min(0, { message: "sortWeight 最小值为0" })
    @Max(999, { message: "sortWeight 最大值为999" })
    readonly sortWeight?: number;
}

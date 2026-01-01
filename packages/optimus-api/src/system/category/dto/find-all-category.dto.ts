import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsBoolean, IsString, IsNumber, Min } from "class-validator";
import { Transform, Type } from "class-transformer";

export class FindAllCategoryDto {
    @ApiProperty({ description: "是否只返回内置分类", required: false })
    @IsOptional()
    @IsBoolean({ message: "isBuiltIn 必须为布尔类型" })
    @Transform(({ value }) => {
        if (value === "true") return true;
        if (value === "false") return false;
        return value;
    })
    readonly isBuiltIn?: boolean;

    @ApiProperty({ description: "父分类ID", required: false })
    @IsOptional()
    @IsNumber({}, { message: "parentId 必须为数字类型" })
    @Type(() => Number)
    readonly parentId?: number;

    @ApiProperty({ description: "分类名称搜索", required: false })
    @IsOptional()
    @IsString({ message: "name 必须为字符串类型" })
    @Transform(({ value }) => value?.trim())
    readonly name?: string;

    @ApiProperty({ description: "是否返回树形结构", required: false, default: true })
    @IsOptional()
    @IsBoolean({ message: "tree 必须为布尔类型" })
    @Transform(({ value }) => {
        if (value === "true") return true;
        if (value === "false") return false;
        return value !== false; // 默认为true
    })
    readonly tree?: boolean = true;

    @ApiProperty({ description: "页码", required: false, minimum: 1, default: 1 })
    @IsOptional()
    @IsNumber({}, { message: "page 必须为数字类型" })
    @Min(1, { message: "page 最小值为1" })
    @Type(() => Number)
    readonly page?: number = 1;

    @ApiProperty({ description: "每页数量", required: false, minimum: 1, maximum: 100, default: 20 })
    @IsOptional()
    @IsNumber({}, { message: "limit 必须为数字类型" })
    @Min(1, { message: "limit 最小值为1" })
    @Type(() => Number)
    readonly limit?: number = 20;
}

import { IsString, IsEnum, IsOptional, IsInt, Min, IsJSON } from "class-validator";
import { Type } from "class-transformer";
import { DictionaryStatus } from "../entities/dictionary.entity";

/**
 * 创建字典DTO
 */
export class CreateDictionaryDto {
    @IsString()
    collection: string;

    @IsString()
    key: string;

    @IsOptional()
    @IsInt()
    userId?: number;

    value: any;

    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;

    @IsOptional()
    @IsEnum(DictionaryStatus)
    status?: DictionaryStatus;

    @IsOptional()
    @IsString()
    remark?: string;
}

/**
 * 更新字典DTO
 */
export class UpdateDictionaryDto {
    @IsOptional()
    value?: any;

    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;

    @IsOptional()
    @IsEnum(DictionaryStatus)
    status?: DictionaryStatus;

    @IsOptional()
    @IsString()
    remark?: string;
}

/**
 * 查询字典DTO
 */
export class QueryDictionaryDto {
    @IsOptional()
    @IsString()
    collection?: string;

    @IsOptional()
    @IsString()
    key?: string;

    @IsOptional()
    @IsEnum(DictionaryStatus)
    status?: DictionaryStatus;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page?: number = 1;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    pageSize?: number = 20;
}

/**
 * 字典信息DTO
 */
export class DictionaryInfoDto {
    id: number;
    collection: string;
    key: string;
    userId: number;
    value: any;
    sortOrder: number;
    status: DictionaryStatus;
    remark: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 字典列表响应DTO
 */
export class DictionaryListResponseDto {
    items: DictionaryInfoDto[];
    total: number;
    page: number;
    pageSize: number;
}

/**
 * 按集合获取字典响应DTO
 */
export class DictionaryCollectionResponseDto {
    collection: string;
    items: Array<{
        key: string;
        value: any;
        sortOrder: number;
    }>;
    total: number;
}

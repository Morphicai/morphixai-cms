import { IsString, IsEnum, IsOptional, IsInt, Min } from "class-validator";
import { Type } from "class-transformer";
import { DataType, AccessType, CollectionStatus } from "../entities/dictionary-collection.entity";

/**
 * 创建集合DTO
 */
export class CreateCollectionDto {
    @IsString()
    name: string;

    @IsString()
    displayName: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(DataType)
    dataType?: DataType;

    @IsOptional()
    schema?: any;

    @IsOptional()
    @IsEnum(AccessType)
    accessType?: AccessType;

    @IsOptional()
    @IsInt()
    @Min(1)
    maxItems?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    maxItemsPerUser?: number;

    @IsOptional()
    @IsEnum(CollectionStatus)
    status?: CollectionStatus;
}

/**
 * 更新集合DTO
 */
export class UpdateCollectionDto {
    @IsOptional()
    @IsString()
    displayName?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(DataType)
    dataType?: DataType;

    @IsOptional()
    schema?: any;

    @IsOptional()
    @IsEnum(AccessType)
    accessType?: AccessType;

    @IsOptional()
    @IsInt()
    @Min(1)
    maxItems?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    maxItemsPerUser?: number;

    @IsOptional()
    @IsEnum(CollectionStatus)
    status?: CollectionStatus;
}

/**
 * 查询集合DTO
 */
export class QueryCollectionDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsEnum(AccessType)
    accessType?: AccessType;

    @IsOptional()
    @IsEnum(CollectionStatus)
    status?: CollectionStatus;

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
 * 集合信息DTO
 */
export class CollectionInfoDto {
    id: number;
    name: string;
    displayName: string;
    description: string;
    dataType: DataType;
    schema: any;
    accessType: AccessType;
    maxItems: number;
    maxItemsPerUser: number;
    status: CollectionStatus;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 集合列表响应DTO
 */
export class CollectionListResponseDto {
    items: CollectionInfoDto[];
    total: number;
    page: number;
    pageSize: number;
}

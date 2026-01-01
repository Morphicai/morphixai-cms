import { IsOptional, IsInt, Min, Max, IsEnum, IsDateString } from "class-validator";
import { Type } from "class-transformer";

/**
 * 查询备份文件 DTO
 * 用于列出和筛选备份文件
 */
export class FindBackupsDto {
    /** 页码，从 1 开始 */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    /** 每页数量，最大 100 */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    size?: number = 10;

    /** 备份类型筛选 */
    @IsOptional()
    @IsEnum(["auto", "manual"], {
        message: "backupType must be either auto or manual",
    })
    backupType?: "auto" | "manual";

    /** 开始日期（ISO 8601 格式） */
    @IsOptional()
    @IsDateString(
        {},
        {
            message: "startDate must be a valid ISO 8601 date string",
        },
    )
    startDate?: string;

    /** 结束日期（ISO 8601 格式） */
    @IsOptional()
    @IsDateString(
        {},
        {
            message: "endDate must be a valid ISO 8601 date string",
        },
    )
    endDate?: string;
}

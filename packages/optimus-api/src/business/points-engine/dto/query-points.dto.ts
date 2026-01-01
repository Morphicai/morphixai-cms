import { IsOptional, IsBoolean } from "class-validator";
import { Transform } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";

/**
 * 查询积分 DTO
 */
export class QueryPointsDto {
    @ApiPropertyOptional({
        description: "是否包含积分明细",
        type: Boolean,
        example: false,
    })
    @Transform(({ value }) => {
        // 处理字符串 "true" 和 "false"
        if (value === "true") return true;
        if (value === "false") return false;
        // 处理数字 1 和 0
        if (value === "1" || value === 1) return true;
        if (value === "0" || value === 0) return false;
        // 处理布尔值
        if (typeof value === "boolean") return value;
        // 其他情况返回 undefined（可选参数）
        return undefined;
    })
    @IsOptional()
    @IsBoolean()
    includeDetail?: boolean;
}

import { IsOptional, IsEnum, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class QueryTeamDto {
    @ApiProperty({
        description: "深度（1=一级下线，2=包含二级下线的树状结构）",
        enum: [1, 2],
        required: false,
        example: 1,
    })
    @IsOptional()
    @IsEnum([1, 2])
    @Type(() => Number)
    depth?: 1 | 2;

    @ApiProperty({
        description: "页码",
        example: 1,
        minimum: 1,
    })
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page = 1;

    @ApiProperty({
        description: "每页数量",
        example: 10,
        minimum: 1,
        maximum: 100,
    })
    @IsInt()
    @Min(1)
    @Max(100)
    @Type(() => Number)
    pageSize = 10;
}

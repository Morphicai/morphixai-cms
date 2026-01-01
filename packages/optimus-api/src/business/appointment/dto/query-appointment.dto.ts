import { IsOptional, IsString, IsNumber, Min } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

/**
 * 查询预约记录列表请求 DTO
 */
export class QueryAppointmentDto {
    @ApiPropertyOptional({ description: "手机号" })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ description: "阶段" })
    @IsOptional()
    @IsString()
    stage?: string;

    @ApiPropertyOptional({ description: "渠道" })
    @IsOptional()
    @IsString()
    channel?: string;

    @ApiPropertyOptional({ description: "页码，从1开始", example: 1, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ description: "每页数量", example: 10, default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    pageSize?: number;

    @ApiPropertyOptional({ description: "排序字段", example: "createDate" })
    @IsOptional()
    @IsString()
    sortField?: string;

    @ApiPropertyOptional({ description: "排序方向", example: "descend" })
    @IsOptional()
    @IsString()
    sortOrder?: string;
}

/**
 * 预约记录信息响应 DTO
 */
export class AppointmentInfoDto {
    @ApiPropertyOptional({ description: "预约记录ID" })
    id: number;

    @ApiPropertyOptional({ description: "手机号" })
    phone: string;

    @ApiPropertyOptional({ description: "阶段" })
    stage: string;

    @ApiPropertyOptional({ description: "渠道" })
    channel: string;

    @ApiPropertyOptional({ description: "预约时间" })
    appointmentTime: Date;

    @ApiPropertyOptional({ description: "额外字段1" })
    extraField1?: string;

    @ApiPropertyOptional({ description: "创建时间" })
    createDate: Date;

    @ApiPropertyOptional({ description: "更新时间" })
    updateDate: Date;
}

/**
 * 预约记录列表响应 DTO
 */
export class AppointmentListResponseDto {
    @ApiPropertyOptional({ description: "预约记录列表" })
    items: AppointmentInfoDto[];

    @ApiPropertyOptional({ description: "总数量" })
    total: number;

    @ApiPropertyOptional({ description: "当前页码" })
    page: number;

    @ApiPropertyOptional({ description: "每页数量" })
    pageSize: number;
}

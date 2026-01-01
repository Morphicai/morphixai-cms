import { IsOptional, IsString, IsNumber, Min, IsEnum } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { OrderStatus } from "../entities/order.entity";

/**
 * 管理后台查询订单列表请求 DTO
 */
export class AdminQueryOrderDto {
    @ApiPropertyOptional({ description: "订单号" })
    @IsOptional()
    @IsString()
    orderNo?: string;

    @ApiPropertyOptional({ description: "用户UID" })
    @IsOptional()
    @IsString()
    uid?: string;

    @ApiPropertyOptional({ description: "订单状态", enum: OrderStatus })
    @IsOptional()
    @IsEnum(OrderStatus)
    status?: OrderStatus;

    @ApiPropertyOptional({ description: "产品ID" })
    @IsOptional()
    @IsString()
    productId?: string;

    @ApiPropertyOptional({ description: "游戏订单号" })
    @IsOptional()
    @IsString()
    cpOrderNo?: string;

    @ApiPropertyOptional({ description: "开始时间（创建时间）", example: "2024-01-01" })
    @IsOptional()
    @IsString()
    startDate?: string;

    @ApiPropertyOptional({ description: "结束时间（创建时间）", example: "2024-12-31" })
    @IsOptional()
    @IsString()
    endDate?: string;

    @ApiPropertyOptional({ description: "页码，从1开始", example: 1, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: "每页数量", example: 20, default: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    pageSize?: number = 20;
}

/**
 * 管理后台订单统计 DTO
 */
export class AdminOrderStatsDto {
    @ApiPropertyOptional({ description: "总订单数" })
    totalOrders: number;

    @ApiPropertyOptional({ description: "待支付订单数" })
    pendingOrders: number;

    @ApiPropertyOptional({ description: "已支付订单数" })
    paidOrders: number;

    @ApiPropertyOptional({ description: "已确认订单数" })
    confirmedOrders: number;

    @ApiPropertyOptional({ description: "总金额" })
    totalAmount: number;

    @ApiPropertyOptional({ description: "已支付金额" })
    paidAmount: number;
}

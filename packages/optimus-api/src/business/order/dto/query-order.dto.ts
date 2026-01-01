import { IsOptional, IsString, IsNumber, Min, IsEnum } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { OrderStatus } from "../entities/order.entity";

/**
 * 查询订单列表请求 DTO
 */
export class QueryOrderDto {
    @ApiPropertyOptional({ description: "订单状态", enum: OrderStatus })
    @IsOptional()
    @IsEnum(OrderStatus)
    status?: OrderStatus;

    @ApiPropertyOptional({ description: "产品ID" })
    @IsOptional()
    @IsString()
    productId?: string;

    @ApiPropertyOptional({ description: "页码，从1开始", example: 1, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: "每页数量", example: 10, default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    pageSize?: number = 10;
}

/**
 * 订单信息响应 DTO
 */
export class OrderInfoDto {
    @ApiPropertyOptional({ description: "订单ID" })
    id: number;

    @ApiPropertyOptional({ description: "订单号" })
    orderNo: string;

    @ApiPropertyOptional({ description: "用户ID" })
    uid: string;

    @ApiPropertyOptional({ description: "产品ID" })
    productId: string;

    @ApiPropertyOptional({ description: "订单金额" })
    amount: number;

    @ApiPropertyOptional({ description: "订单状态", enum: OrderStatus })
    status: OrderStatus;

    @ApiPropertyOptional({ description: "游戏订单号" })
    cpOrderNo?: string;

    @ApiPropertyOptional({ description: "支付渠道订单号" })
    channelOrderNo?: string;

    @ApiPropertyOptional({ description: "支付方式ID" })
    payType?: number;

    @ApiPropertyOptional({ description: "支付时间" })
    payTime?: Date;

    @ApiPropertyOptional({ description: "确认收货时间" })
    confirmTime?: Date;

    @ApiPropertyOptional({ description: "角色名" })
    roleName?: string;

    @ApiPropertyOptional({ description: "区服名" })
    serverName?: string;

    @ApiPropertyOptional({ description: "扩展参数" })
    extrasParams?: Record<string, any>;

    @ApiPropertyOptional({ description: "创建时间" })
    createDate: Date;

    @ApiPropertyOptional({ description: "更新时间" })
    updateDate: Date;
}

/**
 * 订单列表响应 DTO
 */
export class OrderListResponseDto {
    @ApiPropertyOptional({ description: "订单列表" })
    items: OrderInfoDto[];

    @ApiPropertyOptional({ description: "总数量" })
    total: number;

    @ApiPropertyOptional({ description: "当前页码" })
    page: number;

    @ApiPropertyOptional({ description: "每页数量" })
    pageSize: number;
}

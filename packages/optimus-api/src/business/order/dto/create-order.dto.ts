import { IsString, IsNotEmpty, IsOptional, IsObject, IsNumber, IsEnum, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { OrderStatus } from "../entities/order.entity";

/**
 * 创建订单请求 DTO
 */
export class CreateOrderWithAuthDto {
    @ApiProperty({ description: "产品ID", example: "PROD001" })
    @IsString()
    @IsNotEmpty()
    productId: string;

    @ApiProperty({ description: "订单金额", example: 100.0 })
    @IsNumber()
    @Min(0.01)
    amount: number;

    @ApiPropertyOptional({ description: "游戏订单号" })
    @IsOptional()
    @IsString()
    cpOrderNo?: string;

    @ApiPropertyOptional({ description: "角色名" })
    @IsOptional()
    @IsString()
    roleName?: string;

    @ApiPropertyOptional({ description: "区服名" })
    @IsOptional()
    @IsString()
    serverName?: string;

    @ApiPropertyOptional({ description: "扩展参数（JSON对象）" })
    @IsOptional()
    @IsObject()
    extrasParams?: Record<string, any>;
}

/**
 * 创建订单响应 DTO
 */
export class CreateOrderResponseDto {
    @ApiProperty({ description: "订单ID" })
    orderId: string;

    @ApiProperty({ description: "订单号" })
    orderNo: string;

    @ApiProperty({ description: "用户ID" })
    uid: string;

    @ApiProperty({ description: "产品ID" })
    productId: string;

    @ApiProperty({ description: "订单金额" })
    amount: number;

    @ApiProperty({ description: "订单状态", enum: OrderStatus })
    status: OrderStatus;

    @ApiProperty({ description: "创建时间" })
    createdAt: string;
}

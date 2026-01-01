import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { OrderStatus } from "../entities/order.entity";

/**
 * 订单支付状态响应 DTO
 * 用于 C 端查询订单支付状态
 */
export class OrderPaymentStatusDto {
    @ApiProperty({ description: "订单号" })
    orderNo: string;

    @ApiProperty({ description: "订单状态", enum: OrderStatus })
    status: OrderStatus;

    @ApiProperty({ description: "是否已支付" })
    isPaid: boolean;

    @ApiProperty({ description: "订单金额" })
    amount: number;

    @ApiProperty({ description: "产品ID" })
    productId: string;

    @ApiPropertyOptional({ description: "支付时间" })
    payTime?: Date;

    @ApiPropertyOptional({ description: "游戏订单号" })
    cpOrderNo?: string;

    @ApiPropertyOptional({ description: "支付渠道订单号" })
    channelOrderNo?: string;

    @ApiPropertyOptional({ description: "角色名" })
    roleName?: string;

    @ApiPropertyOptional({ description: "区服名" })
    serverName?: string;

    @ApiPropertyOptional({ description: "扩展参数" })
    extrasParams?: Record<string, any>;

    @ApiProperty({ description: "创建时间" })
    createDate: Date;

    @ApiProperty({ description: "更新时间" })
    updateDate: Date;
}

/**
 * 订单支付详情响应 DTO
 * 包含支付回调的详细信息
 */
export class OrderPaymentDetailDto extends OrderPaymentStatusDto {
    @ApiPropertyOptional({ description: "支付用户名" })
    payerUsername?: string;

    @ApiPropertyOptional({ description: "支付方式ID" })
    payType?: number;

    @ApiPropertyOptional({ description: "是否为订阅取消" })
    isSubscriptionCancelled?: boolean;
}

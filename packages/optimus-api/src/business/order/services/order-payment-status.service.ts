import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OrderEntity, OrderStatus } from "../entities/order.entity";
import { OrderPaymentStatusDto, OrderPaymentDetailDto } from "../dto/order-payment-status.dto";
import { ResultData } from "../../../shared/utils/result";

/**
 * 订单支付状态查询服务
 * 用于 C 端查询订单支付状态
 */
@Injectable()
export class OrderPaymentStatusService {
    private readonly logger = new Logger(OrderPaymentStatusService.name);

    constructor(
        @InjectRepository(OrderEntity)
        private readonly orderRepository: Repository<OrderEntity>,
    ) {}

    /**
     * 根据订单号查询支付状态
     * @param orderNo 订单号
     * @param uid 用户ID（用于权限验证）
     * @returns 订单支付状态
     */
    async getPaymentStatus(orderNo: string, uid: string): Promise<ResultData> {
        try {
            const order = await this.orderRepository.findOne({
                where: { orderNo, uid },
            });

            if (!order) {
                throw new NotFoundException(`订单不存在: ${orderNo}`);
            }

            const response: OrderPaymentStatusDto = {
                orderNo: order.orderNo,
                status: order.status,
                isPaid: order.status === OrderStatus.PAID || order.status === OrderStatus.CONFIRMED,
                amount: Number(order.amount),
                productId: order.productId,
                payTime: order.payTime,
                cpOrderNo: order.cpOrderNo,
                channelOrderNo: order.channelOrderNo,
                roleName: order.roleName,
                serverName: order.serverName,
                extrasParams: order.extrasParams,
                createDate: order.createDate,
                updateDate: order.updateDate,
            };

            return ResultData.ok(response);
        } catch (error) {
            this.logger.error(`查询订单支付状态失败: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 根据订单号查询支付详情（包含更多信息）
     * @param orderNo 订单号
     * @param uid 用户ID（用于权限验证）
     * @returns 订单支付详情
     */
    async getPaymentDetail(orderNo: string, uid: string): Promise<ResultData> {
        try {
            const order = await this.orderRepository.findOne({
                where: { orderNo, uid },
            });

            if (!order) {
                throw new NotFoundException(`订单不存在: ${orderNo}`);
            }

            // 检查是否为订阅取消
            const isSubscriptionCancelled =
                order.extrasParams?.subscriptionStatus === "2" || order.extrasParams?.subReason !== undefined;

            const response: OrderPaymentDetailDto = {
                orderNo: order.orderNo,
                status: order.status,
                isPaid: order.status === OrderStatus.PAID || order.status === OrderStatus.CONFIRMED,
                amount: Number(order.amount),
                productId: order.productId,
                payTime: order.payTime,
                cpOrderNo: order.cpOrderNo,
                channelOrderNo: order.channelOrderNo,
                roleName: order.roleName,
                serverName: order.serverName,
                extrasParams: order.extrasParams,
                createDate: order.createDate,
                updateDate: order.updateDate,
                payType: order.payType,
                isSubscriptionCancelled,
            };

            return ResultData.ok(response);
        } catch (error) {
            this.logger.error(`查询订单支付详情失败: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 轮询查询订单支付状态（用于前端轮询）
     * 如果订单已支付，返回支付信息；否则返回待支付状态
     * @param orderNo 订单号
     * @param uid 用户ID（用于权限验证）
     * @returns 订单支付状态
     */
    async pollPaymentStatus(orderNo: string, uid: string): Promise<ResultData> {
        try {
            const order = await this.orderRepository.findOne({
                where: { orderNo, uid },
            });

            if (!order) {
                throw new NotFoundException(`订单不存在: ${orderNo}`);
            }

            const isPaid = order.status === OrderStatus.PAID || order.status === OrderStatus.CONFIRMED;

            const response = {
                orderNo: order.orderNo,
                status: order.status,
                isPaid,
                // 只有已支付才返回详细信息
                ...(isPaid && {
                    amount: Number(order.amount),
                    productId: order.productId,
                    payTime: order.payTime,
                    updateDate: order.updateDate,
                }),
            };

            return ResultData.ok(response);
        } catch (error) {
            this.logger.error(`轮询订单支付状态失败: ${error.message}`, error.stack);
            throw error;
        }
    }
}

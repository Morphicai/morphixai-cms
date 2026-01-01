import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { OrderEntity, OrderStatus } from "./entities/order.entity";
import { AdminQueryOrderDto, AdminOrderStatsDto } from "./dto/admin-query-order.dto";
import { OrderListResponseDto, OrderInfoDto } from "./dto/query-order.dto";
import { ResultData } from "../../shared/utils/result";

/**
 * 订单管理服务（后台）
 */
@Injectable()
export class AdminOrderService {
    private readonly logger = new Logger(AdminOrderService.name);

    constructor(
        @InjectRepository(OrderEntity)
        private readonly orderRepository: Repository<OrderEntity>,
    ) {}

    /**
     * 查询订单列表（管理后台）
     */
    async getOrderList(queryDto: AdminQueryOrderDto): Promise<ResultData> {
        try {
            const {
                orderNo,
                uid,
                status,
                productId,
                cpOrderNo,
                startDate,
                endDate,
                page = 1,
                pageSize = 20,
            } = queryDto;

            const queryBuilder = this.orderRepository.createQueryBuilder("order");

            // 订单号查询
            if (orderNo) {
                queryBuilder.andWhere("order.orderNo LIKE :orderNo", { orderNo: `%${orderNo}%` });
            }

            // 用户UID查询
            if (uid) {
                queryBuilder.andWhere("order.uid = :uid", { uid });
            }

            // 订单状态查询
            if (status) {
                queryBuilder.andWhere("order.status = :status", { status });
            }

            // 产品ID查询
            if (productId) {
                queryBuilder.andWhere("order.productId = :productId", { productId });
            }

            // 游戏订单号查询
            if (cpOrderNo) {
                queryBuilder.andWhere("order.cpOrderNo LIKE :cpOrderNo", { cpOrderNo: `%${cpOrderNo}%` });
            }

            // 时间范围查询
            if (startDate && endDate) {
                queryBuilder.andWhere("order.createDate BETWEEN :startDate AND :endDate", {
                    startDate: new Date(startDate),
                    endDate: new Date(endDate + " 23:59:59"),
                });
            } else if (startDate) {
                queryBuilder.andWhere("order.createDate >= :startDate", { startDate: new Date(startDate) });
            } else if (endDate) {
                queryBuilder.andWhere("order.createDate <= :endDate", { endDate: new Date(endDate + " 23:59:59") });
            }

            // 排序：按创建时间倒序
            queryBuilder.orderBy("order.createDate", "DESC");

            // 分页
            const skip = (page - 1) * pageSize;
            queryBuilder.skip(skip).take(pageSize);

            // 执行查询
            const [orders, total] = await queryBuilder.getManyAndCount();

            // 转换为响应格式
            const items: OrderInfoDto[] = orders.map((order) => ({
                id: order.id,
                orderNo: order.orderNo,
                uid: order.uid,
                productId: order.productId,
                amount: Number(order.amount),
                status: order.status,
                cpOrderNo: order.cpOrderNo,
                channelOrderNo: order.channelOrderNo,
                payType: order.payType,
                payTime: order.payTime,
                confirmTime: order.confirmTime,
                roleName: order.roleName,
                serverName: order.serverName,
                extrasParams: order.extrasParams,
                createDate: order.createDate,
                updateDate: order.updateDate,
            }));

            const response: OrderListResponseDto = {
                items,
                total,
                page,
                pageSize,
            };

            return ResultData.ok(response);
        } catch (error) {
            this.logger.error(`查询订单列表失败: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 获取订单统计信息
     */
    async getOrderStats(): Promise<ResultData> {
        try {
            // 总订单数
            const totalOrders = await this.orderRepository.count();

            // 各状态订单数
            const pendingOrders = await this.orderRepository.count({ where: { status: OrderStatus.PENDING } });
            const paidOrders = await this.orderRepository.count({ where: { status: OrderStatus.PAID } });
            const confirmedOrders = await this.orderRepository.count({ where: { status: OrderStatus.CONFIRMED } });

            // 总金额
            const totalAmountResult = await this.orderRepository
                .createQueryBuilder("order")
                .select("SUM(order.amount)", "total")
                .getRawOne();

            // 已支付金额
            const paidAmountResult = await this.orderRepository
                .createQueryBuilder("order")
                .select("SUM(order.amount)", "total")
                .where("order.status IN (:...statuses)", { statuses: [OrderStatus.PAID, OrderStatus.CONFIRMED] })
                .getRawOne();

            const stats: AdminOrderStatsDto = {
                totalOrders,
                pendingOrders,
                paidOrders,
                confirmedOrders,
                totalAmount: Number(totalAmountResult?.total || 0),
                paidAmount: Number(paidAmountResult?.total || 0),
            };

            return ResultData.ok(stats);
        } catch (error) {
            this.logger.error(`获取订单统计失败: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 查询订单详情
     */
    async getOrderDetail(orderNo: string): Promise<ResultData> {
        try {
            const order = await this.orderRepository.findOne({ where: { orderNo } });

            if (!order) {
                throw new NotFoundException(`订单不存在: ${orderNo}`);
            }

            const orderInfo: OrderInfoDto = {
                id: order.id,
                orderNo: order.orderNo,
                uid: order.uid,
                productId: order.productId,
                amount: Number(order.amount),
                status: order.status,
                cpOrderNo: order.cpOrderNo,
                channelOrderNo: order.channelOrderNo,
                payType: order.payType,
                payTime: order.payTime,
                confirmTime: order.confirmTime,
                roleName: order.roleName,
                serverName: order.serverName,
                extrasParams: order.extrasParams,
                createDate: order.createDate,
                updateDate: order.updateDate,
            };

            return ResultData.ok(orderInfo);
        } catch (error) {
            this.logger.error(`查询订单详情失败: ${error.message}`, error.stack);
            throw error;
        }
    }
}

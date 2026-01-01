import { Injectable, Logger, BadRequestException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DecryptService } from "./services/decrypt.service";
import { GameWemadeTokenValidationService } from "./services/token-validation.service";
import { PaymentCallbackService, PaymentCallbackRawParams } from "./services/payment-callback.service";
import { ProductHandlerService } from "./services/product-handler.service";
import { ProductValidatorService } from "./services/product-validator.service";
import { MockPaymentService } from "./services/mock-payment.service";
import { OrderEntity, OrderStatus } from "./entities/order.entity";
import { CreateOrderResponseDto, CreateOrderWithAuthDto } from "./dto/create-order.dto";
import { QueryOrderDto, OrderListResponseDto, OrderInfoDto } from "./dto/query-order.dto";
import { ConfirmReceiptResponseDto } from "./dto/confirm-receipt.dto";
import { OrderPaymentStatusDto, OrderPaymentDetailDto } from "./dto/order-payment-status.dto";
import { ProductListResponseDto } from "./dto/product.dto";
import { ResultData } from "../../shared/utils/result";
import { getProductById, isValidProductId, getAllProducts } from "./constants/products";

/**
 * 订单服务
 */
@Injectable()
export class OrderService {
    private readonly logger = new Logger(OrderService.name);

    constructor(
        @InjectRepository(OrderEntity)
        private readonly orderRepository: Repository<OrderEntity>,
        private readonly decryptService: DecryptService,
        private readonly tokenValidationService: GameWemadeTokenValidationService,
        private readonly paymentCallbackService: PaymentCallbackService,
        private readonly productHandlerService: ProductHandlerService,
        private readonly productValidatorService: ProductValidatorService,
        private readonly mockPaymentService: MockPaymentService,
    ) {}

    /**
     * 生成订单号
     * 格式: ord_时间戳_uid后6位_随机4位
     * 示例: ord_1701345625_829117_a3f9
     * @param uid 用户ID
     * @returns 订单号
     */
    private generateOrderNo(uid: string): string {
        const timestamp = Math.floor(Date.now() / 1000); // 秒级时间戳

        // 取 uid 后6位
        const uidSuffix = uid.slice(-6);

        // 生成4位随机字符串（小写字母+数字）
        const random = Math.random().toString(36).substring(2, 6);

        return `ord_${timestamp}_${uidSuffix}_${random}`;
    }

    /**
     * 创建订单
     * @param createOrderDto 创建订单请求
     * @param uid 用户ID（从 Guard 验证后获取）
     * @returns 订单信息
     */
    async createOrderWithAuth(createOrderDto: CreateOrderWithAuthDto, uid: string): Promise<ResultData> {
        try {
            // 1. 验证产品ID
            if (!isValidProductId(createOrderDto.productId)) {
                throw new BadRequestException(`无效的产品ID: ${createOrderDto.productId}`);
            }

            const product = getProductById(createOrderDto.productId);
            if (!product) {
                throw new BadRequestException(`产品不存在: ${createOrderDto.productId}`);
            }

            // 2. 验证商品参数
            const validationResult = this.productValidatorService.validate(createOrderDto);
            if (!validationResult.valid) {
                throw new BadRequestException({
                    message: "订单参数验证失败",
                    errors: validationResult.errors,
                });
            }

            // 3. 验证金额（如果提供了金额，应该与产品价格一致）
            if (createOrderDto.amount && createOrderDto.amount !== product.price) {
                this.logger.warn(
                    `订单金额与产品价格不一致: productPrice=${product.price}, orderAmount=${createOrderDto.amount}`,
                );
                // 可以选择使用产品价格或抛出错误，这里使用产品价格
            }

            // 4. 生成订单号
            const orderNo = this.generateOrderNo(uid);

            // 5. 判断是否为免费订单
            const orderAmount = createOrderDto.amount || product.price;
            const isFreeOrder = orderAmount === 0;

            // 6. 创建订单实体
            const order = this.orderRepository.create({
                orderNo,
                uid,
                productId: createOrderDto.productId,
                amount: orderAmount,
                status: isFreeOrder ? OrderStatus.PAID : OrderStatus.PENDING,
                cpOrderNo: createOrderDto.cpOrderNo,
                roleName: createOrderDto.roleName,
                serverName: createOrderDto.serverName,
                extrasParams: createOrderDto.extrasParams,
                payTime: isFreeOrder ? new Date() : null,
            });

            // 7. 保存订单
            const savedOrder = await this.orderRepository.save(order);

            this.logger.log(
                `订单创建成功: orderNo=${orderNo}, uid=${uid}, productId=${createOrderDto.productId}, isFree=${isFreeOrder}`,
            );

            // 8. 如果是免费订单，立即触发发货
            if (isFreeOrder) {
                try {
                    await this.processOrderByProduct(savedOrder);
                    this.logger.log(`免费订单自动发货成功: orderNo=${orderNo}`);
                } catch (error) {
                    this.logger.error(`免费订单自动发货失败: orderNo=${orderNo}, error=${error.message}`);
                    // 发货失败不影响订单创建，可以后续手动处理
                }
            }

            const response: CreateOrderResponseDto = {
                orderId: savedOrder.id.toString(),
                orderNo: savedOrder.orderNo,
                uid: savedOrder.uid,
                productId: savedOrder.productId,
                amount: Number(savedOrder.amount),
                status: savedOrder.status,
                createdAt: savedOrder.createDate.toISOString(),
            };

            return ResultData.ok(response);
        } catch (error) {
            this.logger.error(`订单创建失败: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 处理支付回调
     * 根据 GameWemade SDK 文档：https://sdkadmin.gamewemade.com/docs/index/aid/544
     * @param params 支付回调原始参数（nt_data, sign, md5Sign）
     * @returns 处理结果，成功返回 "SUCCESS"，失败返回错误信息
     */
    async handlePaymentCallback(params: PaymentCallbackRawParams): Promise<string> {
        try {
            // 1. 验证签名、解密并解析支付数据
            const callbackResult = await this.paymentCallbackService.processCallback(params);
            const paymentData = callbackResult.data;

            // 2. 检查订阅状态（如果是订阅取消，不需要发货）
            if (paymentData.subscriptionStatus === "2") {
                this.logger.log(`订单为订阅取消状态，不需要发货: orderNo=${paymentData.order_no}`);
                return "SUCCESS";
            }

            // 3. 查找订单（根据我们的订单号 out_order_no）
            // 注意：order_no 是 SDK 的订单号，out_order_no 是我们下单时传递的订单号
            const order = await this.orderRepository.findOne({
                where: { orderNo: paymentData.out_order_no },
            });

            if (!order) {
                this.logger.warn(
                    `支付回调：订单不存在 out_order_no=${paymentData.out_order_no}, sdk_order_no=${paymentData.order_no}`,
                );
                // 根据文档，如果订单不存在，返回非SUCCESS让SDK继续通知
                throw new NotFoundException(`订单不存在: ${paymentData.out_order_no}`);
            }

            // 4. 检查订单状态（判断是否重复发放道具）
            if (order.status !== OrderStatus.PENDING) {
                this.logger.warn(
                    `支付回调：订单状态不是待支付 orderNo=${paymentData.order_no}, status=${order.status}`,
                );
                // 如果订单已经支付，直接返回SUCCESS（幂等性处理）
                if (order.status === OrderStatus.PAID) {
                    this.logger.log(`订单已支付，重复回调: orderNo=${paymentData.order_no}`);
                    return "SUCCESS";
                }
                throw new BadRequestException(`订单状态不正确: ${order.status}`);
            }

            // 5. 更新订单状态（支付成功）
            // 注意：游戏发货金额应以通知中的amount金额为准
            const paymentAmount = parseFloat(paymentData.amount);
            if (isNaN(paymentAmount) || paymentAmount <= 0) {
                throw new BadRequestException(`支付金额无效: ${paymentData.amount}`);
            }

            order.status = OrderStatus.PAID;
            order.amount = paymentAmount; // 使用通知中的amount金额
            order.channelOrderNo = paymentData.order_no; // 保存 SDK 的订单号

            // 解析支付时间（格式：2017-02-06 14:22:32）
            if (paymentData.pay_time) {
                const payTime = new Date(paymentData.pay_time.replace(/-/g, "/"));
                if (!isNaN(payTime.getTime())) {
                    order.payTime = payTime;
                }
            }

            // 更新扩展参数（如果有）
            if (paymentData.extras_params) {
                try {
                    // extras_params 格式：区服ID|@|角色ID|@|商品ID|玩家ip
                    order.extrasParams = {
                        ...order.extrasParams,
                        extras_params: paymentData.extras_params,
                    };
                } catch (error) {
                    this.logger.warn(`解析extras_params失败: ${error.message}`);
                }
            }

            await this.orderRepository.save(order);

            this.logger.log(
                `订单支付成功: orderNo=${paymentData.order_no}, uid=${paymentData.uid}, amount=${paymentAmount}`,
            );

            // 6. 根据产品ID执行不同的处理逻辑（发放道具）
            await this.processOrderByProduct(order);

            // 7. 返回 SUCCESS（注意：只能返回这7个字符，不能带其他符号）
            return "SUCCESS";
        } catch (error) {
            this.logger.error(`支付回调处理失败: ${error.message}`, error.stack);
            // 根据文档，返回非SUCCESS让SDK继续通知
            throw error;
        }
    }

    /**
     * 根据产品ID处理订单（使用处理器模式）
     * @param order 订单实体
     */
    private async processOrderByProduct(order: OrderEntity): Promise<void> {
        this.logger.log(`处理订单产品逻辑: orderNo=${order.orderNo}, productId=${order.productId}`);

        // 使用商品处理器服务处理订单
        const result = await this.productHandlerService.handleOrder(order);

        if (result.success) {
            this.logger.log(`订单产品处理成功: orderNo=${order.orderNo}, message=${result.message}`);
        } else {
            this.logger.error(`订单产品处理失败: orderNo=${order.orderNo}, message=${result.message}`);
            // 注意：即使处理失败，也不抛出异常，避免影响支付回调返回SUCCESS
            // 可以在这里记录失败订单，后续人工处理或重试
        }
    }

    /**
     * 查询用户订单列表
     * @param uid 用户ID
     * @param queryDto 查询参数
     * @returns 订单列表
     */
    async getUserOrders(uid: string, queryDto: QueryOrderDto): Promise<ResultData> {
        try {
            const { status, productId, page = 1, pageSize = 10 } = queryDto;

            // 构建查询条件
            const queryBuilder = this.orderRepository.createQueryBuilder("order").where("order.uid = :uid", { uid });

            if (status) {
                queryBuilder.andWhere("order.status = :status", { status });
            }

            if (productId) {
                queryBuilder.andWhere("order.productId = :productId", { productId });
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
     * 确认收货
     * @param orderNo 订单号
     * @param uid 用户ID
     * @returns 确认结果
     */
    async confirmReceipt(orderNo: string, uid: string): Promise<ResultData> {
        try {
            // 1. 查找订单
            const order = await this.orderRepository.findOne({
                where: { orderNo, uid },
            });

            if (!order) {
                throw new NotFoundException(`订单不存在: ${orderNo}`);
            }

            // 2. 检查订单状态
            if (order.status !== OrderStatus.PAID) {
                throw new BadRequestException(`订单状态不正确，无法确认收货: ${order.status}`);
            }

            // 3. 更新订单状态
            order.status = OrderStatus.CONFIRMED;
            order.confirmTime = new Date();
            await this.orderRepository.save(order);

            this.logger.log(`订单确认收货成功: orderNo=${orderNo}, uid=${uid}`);

            const response: ConfirmReceiptResponseDto = {
                orderNo: order.orderNo,
                status: order.status,
                confirmTime: order.confirmTime,
            };

            return ResultData.ok(response);
        } catch (error) {
            this.logger.error(`确认收货失败: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 查询订单支付状态（C端接口）
     * @param orderNo 订单号
     * @param uid 用户ID
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
     * 查询订单支付详情（C端接口）
     * @param orderNo 订单号
     * @param uid 用户ID
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
     * 轮询查询订单支付状态（C端轮询接口）
     * @param orderNo 订单号
     * @param uid 用户ID
     * @returns 订单支付状态（简化版）
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

    /**
     * 获取产品列表
     * @returns 产品列表
     */
    async getProducts(): Promise<ResultData> {
        try {
            const products = getAllProducts();

            const response: ProductListResponseDto = {
                products: products.map((p) => ({
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    description: p.description,
                })),
                total: products.length,
            };

            return ResultData.ok(response);
        } catch (error) {
            this.logger.error(`获取产品列表失败: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 获取商品参数要求
     * @param productId 产品ID
     * @returns 参数要求
     */
    async getProductParams(productId: string): Promise<ResultData> {
        try {
            // 验证产品是否存在
            if (!isValidProductId(productId)) {
                throw new BadRequestException(`无效的产品ID: ${productId}`);
            }

            const requiredParams = this.productValidatorService.getRequiredParams(productId);
            const optionalParams = this.productValidatorService.getOptionalParams(productId);

            const response = {
                productId,
                requiredParams,
                optionalParams,
            };

            return ResultData.ok(response);
        } catch (error) {
            this.logger.error(`获取商品参数要求失败: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Mock 支付（仅 development 环境）
     * @param orderNo 订单号
     * @param uid 用户ID
     * @returns Mock 支付结果
     */
    async mockPayment(orderNo: string, uid: string): Promise<ResultData> {
        try {
            // 1. 检查 Mock 支付是否可用
            if (!this.mockPaymentService.isAvailable()) {
                throw new BadRequestException("Mock 支付仅在 development 环境可用");
            }

            // 2. 查找订单
            const order = await this.orderRepository.findOne({
                where: { orderNo, uid },
            });

            if (!order) {
                throw new NotFoundException(`订单不存在: ${orderNo}`);
            }

            // 3. 检查订单状态
            if (order.status !== OrderStatus.PENDING) {
                throw new BadRequestException(`订单状态不是待支付: ${order.status}`);
            }

            // 4. 更新订单状态为已支付
            const now = new Date();
            order.status = OrderStatus.PAID;
            order.payTime = now;
            order.cpOrderNo = `MOCK_CP_${Date.now()}`;

            // 添加 Mock 支付标记
            order.extrasParams = {
                ...order.extrasParams,
                mock_payment: true,
                mock_pay_time: now.toISOString(),
            };

            await this.orderRepository.save(order);

            this.logger.log(`🎭 Mock 支付成功: orderNo=${orderNo}, uid=${uid}, amount=${order.amount}`);

            // 5. 触发商品处理器（与真实支付回调相同）
            await this.processOrderByProduct(order);

            // 6. 返回结果
            const response = {
                message: "Mock 支付成功",
                orderNo: order.orderNo,
                status: order.status,
                payTime: order.payTime,
                amount: Number(order.amount),
            };

            return ResultData.ok(response);
        } catch (error) {
            this.logger.error(`Mock 支付失败: ${error.message}`, error.stack);
            throw error;
        }
    }
}

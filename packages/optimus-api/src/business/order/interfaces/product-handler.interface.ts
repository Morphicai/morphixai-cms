import { OrderEntity } from "../entities/order.entity";

/**
 * 商品处理结果
 */
export interface ProductHandlerResult {
    /** 是否处理成功 */
    success: boolean;
    /** 处理消息 */
    message: string;
    /** 处理数据（可选） */
    data?: any;
}

/**
 * 商品处理器接口
 * 每个商品类型都需要实现此接口
 */
export interface IProductHandler {
    /**
     * 获取处理器支持的产品ID
     */
    getProductId(): string;

    /**
     * 处理订单支付成功后的逻辑
     * @param order 订单实体
     * @returns 处理结果
     */
    handle(order: OrderEntity): Promise<ProductHandlerResult>;

    /**
     * 验证订单是否可以处理
     * @param order 订单实体
     * @returns 是否可以处理
     */
    validate(order: OrderEntity): Promise<boolean>;
}

import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { IProductHandler, ProductHandlerResult } from "../interfaces/product-handler.interface";
import { OrderEntity } from "../entities/order.entity";
import { MultiRegionRoleHandler } from "../handlers/multi-region-role-handler";
import { CreateGuildHandler } from "../handlers/create-guild-handler";
// import { CharacterAllServerHandler } from "../handlers/character-all-server-handler"; // 游戏特定功能，已移除
// import { GuildSingleServerHandler } from "../handlers/guild-single-server-handler"; // 游戏特定功能，已移除
// import { GuildAllServerHandler } from "../handlers/guild-all-server-handler"; // 游戏特定功能，已移除

/**
 * 商品处理器服务
 * 负责管理和调度所有商品处理器
 */
@Injectable()
export class ProductHandlerService implements OnModuleInit {
    private readonly logger = new Logger(ProductHandlerService.name);
    private readonly handlers = new Map<string, IProductHandler>();

    constructor(
        private readonly moduleRef: ModuleRef,
        private readonly multiRegionRoleHandler: MultiRegionRoleHandler,
        private readonly createGuildHandler: CreateGuildHandler, // private readonly characterAllServerHandler: CharacterAllServerHandler, // 游戏特定功能，已移除 // private readonly guildSingleServerHandler: GuildSingleServerHandler, // 游戏特定功能，已移除 // private readonly guildAllServerHandler: GuildAllServerHandler, // 游戏特定功能，已移除
    ) {}

    /**
     * 模块初始化时注册所有处理器
     */
    async onModuleInit() {
        this.registerHandler(this.multiRegionRoleHandler);
        this.registerHandler(this.createGuildHandler);
        // this.registerHandler(this.characterAllServerHandler); // 游戏特定功能，已移除
        // this.registerHandler(this.guildSingleServerHandler); // 游戏特定功能，已移除
        // this.registerHandler(this.guildAllServerHandler); // 游戏特定功能，已移除

        this.logger.log(`已注册 ${this.handlers.size} 个商品处理器`);
    }

    /**
     * 注册商品处理器
     * @param handler 处理器实例
     */
    private registerHandler(handler: IProductHandler): void {
        const productId = handler.getProductId();
        if (this.handlers.has(productId)) {
            this.logger.warn(`商品处理器已存在，将被覆盖: ${productId}`);
        }
        this.handlers.set(productId, handler);
        this.logger.debug(`注册商品处理器: ${productId} -> ${handler.constructor.name}`);
    }

    /**
     * 处理订单支付成功后的逻辑
     * @param order 订单实体
     * @returns 处理结果
     */
    async handleOrder(order: OrderEntity): Promise<ProductHandlerResult> {
        const handler = this.handlers.get(order.productId);

        if (!handler) {
            this.logger.warn(`未找到商品处理器: productId=${order.productId}`);
            return {
                success: false,
                message: `未找到商品处理器: ${order.productId}`,
            };
        }

        try {
            // 1. 验证订单
            const isValid = await handler.validate(order);
            if (!isValid) {
                this.logger.warn(`订单验证失败: orderNo=${order.orderNo}, productId=${order.productId}`);
                return {
                    success: false,
                    message: "订单验证失败",
                };
            }

            // 2. 处理订单
            this.logger.log(
                `开始处理订单: orderNo=${order.orderNo}, productId=${order.productId}, handler=${handler.constructor.name}`,
            );

            const result = await handler.handle(order);

            if (result.success) {
                this.logger.log(`订单处理成功: orderNo=${order.orderNo}, message=${result.message}`);
            } else {
                this.logger.error(`订单处理失败: orderNo=${order.orderNo}, message=${result.message}`);
            }

            return result;
        } catch (error) {
            this.logger.error(`订单处理异常: orderNo=${order.orderNo}, error=${error.message}`, error.stack);
            return {
                success: false,
                message: `处理异常: ${error.message}`,
            };
        }
    }

    /**
     * 获取所有已注册的处理器
     * @returns 处理器映射
     */
    getHandlers(): Map<string, IProductHandler> {
        return this.handlers;
    }

    /**
     * 检查是否有处理器支持指定的产品
     * @param productId 产品ID
     * @returns 是否支持
     */
    hasHandler(productId: string): boolean {
        return this.handlers.has(productId);
    }
}

import { Injectable, Logger } from "@nestjs/common";
import { IProductHandler, ProductHandlerResult } from "../interfaces/product-handler.interface";
import { OrderEntity } from "../entities/order.entity";

/**
 * 创建公会处理器
 * 处理 CREATE_GUILD 产品的支付成功逻辑
 */
@Injectable()
export class CreateGuildHandler implements IProductHandler {
    private readonly logger = new Logger(CreateGuildHandler.name);

    getProductId(): string {
        return "CREATE_GUILD";
    }

    async validate(order: OrderEntity): Promise<boolean> {
        // 验证订单信息是否完整
        if (!order.uid) {
            this.logger.warn(`订单缺少用户ID: orderNo=${order.orderNo}`);
            return false;
        }

        // 可以添加更多验证逻辑
        // 例如：检查用户是否已经有公会
        // 例如：检查服务器是否允许创建公会

        return true;
    }

    async handle(order: OrderEntity): Promise<ProductHandlerResult> {
        try {
            this.logger.log(`开始处理创建公会: orderNo=${order.orderNo}, uid=${order.uid}`);

            // TODO: 这里实现具体的业务逻辑
            // 方案1: 如果有公会管理模块，调用公会服务
            // await this.guildService.enableGuildCreation(order.uid);

            // 方案2: 如果没有公会管理模块，可以记录到用户权益表
            // await this.userBenefitService.grantBenefit(order.uid, 'CREATE_GUILD');

            // 方案3: 调用外部游戏服务器API
            // await this.gameServerClient.enableGuildCreation(order.uid, order.extrasParams);

            // 方案4: 发送消息队列，由其他服务处理
            // await this.messageQueue.publish('order.paid', {
            //   orderNo: order.orderNo,
            //   uid: order.uid,
            //   productId: order.productId,
            //   extrasParams: order.extrasParams,
            // });

            // 临时实现：记录日志
            this.logger.log(
                `创建公会处理完成: orderNo=${order.orderNo}, uid=${order.uid}, serverName=${order.serverName}`,
            );

            return {
                success: true,
                message: "创建公会权限已开通",
                data: {
                    uid: order.uid,
                    productId: order.productId,
                    serverName: order.serverName,
                },
            };
        } catch (error) {
            this.logger.error(`创建公会处理失败: ${error.message}`, error.stack);
            return {
                success: false,
                message: `处理失败: ${error.message}`,
            };
        }
    }
}

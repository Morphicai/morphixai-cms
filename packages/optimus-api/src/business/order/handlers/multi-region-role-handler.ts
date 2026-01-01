import { Injectable, Logger } from "@nestjs/common";
import { IProductHandler, ProductHandlerResult } from "../interfaces/product-handler.interface";
import { OrderEntity } from "../entities/order.entity";

/**
 * 多区创建角色处理器
 * 处理 MULTI_REGION_CREATE_ROLE 产品的支付成功逻辑
 */
@Injectable()
export class MultiRegionRoleHandler implements IProductHandler {
    private readonly logger = new Logger(MultiRegionRoleHandler.name);

    getProductId(): string {
        return "MULTI_REGION_CREATE_ROLE";
    }

    async validate(order: OrderEntity): Promise<boolean> {
        // 验证订单信息是否完整
        if (!order.uid) {
            this.logger.warn(`订单缺少用户ID: orderNo=${order.orderNo}`);
            return false;
        }

        // 可以添加更多验证逻辑
        // 例如：检查用户是否已经购买过此商品
        // 例如：检查用户是否有权限购买

        return true;
    }

    async handle(order: OrderEntity): Promise<ProductHandlerResult> {
        try {
            this.logger.log(`开始处理多区创建角色: orderNo=${order.orderNo}, uid=${order.uid}`);

            // TODO: 这里实现具体的业务逻辑
            // 方案1: 如果有游戏角色管理模块，调用角色服务
            // await this.gameRoleService.enableMultiRegionCreate(order.uid);

            // 方案2: 如果没有角色管理模块，可以记录到用户权益表
            // await this.userBenefitService.grantBenefit(order.uid, 'MULTI_REGION_CREATE_ROLE');

            // 方案3: 调用外部游戏服务器API
            // await this.gameServerClient.enableMultiRegionCreate(order.uid, order.extrasParams);

            // 方案4: 发送消息队列，由其他服务处理
            // await this.messageQueue.publish('order.paid', {
            //   orderNo: order.orderNo,
            //   uid: order.uid,
            //   productId: order.productId,
            //   extrasParams: order.extrasParams,
            // });

            // 临时实现：记录日志
            this.logger.log(
                `多区创建角色处理完成: orderNo=${order.orderNo}, uid=${order.uid}, serverName=${order.serverName}, roleName=${order.roleName}`,
            );

            return {
                success: true,
                message: "多区创建角色权限已开通",
                data: {
                    uid: order.uid,
                    productId: order.productId,
                    serverName: order.serverName,
                    roleName: order.roleName,
                },
            };
        } catch (error) {
            this.logger.error(`多区创建角色处理失败: ${error.message}`, error.stack);
            return {
                success: false,
                message: `处理失败: ${error.message}`,
            };
        }
    }
}

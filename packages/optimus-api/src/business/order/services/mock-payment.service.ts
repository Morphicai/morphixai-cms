import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * Mock 支付服务
 * 仅在 development 环境下启用，用于测试支付流程
 */
@Injectable()
export class MockPaymentService {
    private readonly logger = new Logger(MockPaymentService.name);
    private readonly isEnabled: boolean;

    constructor(private readonly configService: ConfigService) {
        const nodeEnv = this.configService.get<string>("NODE_ENV") || process.env.NODE_ENV || "production";
        this.isEnabled = nodeEnv === "development";

        if (this.isEnabled) {
            this.logger.warn("⚠️  Mock 支付服务已启用（仅限 development 环境）");
        } else {
            this.logger.log("Mock 支付服务已禁用（生产环境）");
        }
    }

    /**
     * 检查 Mock 支付是否启用
     */
    isAvailable(): boolean {
        return this.isEnabled;
    }

    /**
     * 生成 Mock 支付回调数据
     * @param orderNo 订单号
     * @param uid 用户ID
     * @param amount 支付金额
     * @returns Mock 支付回调数据
     */
    generateMockCallbackData(orderNo: string, uid: string, amount: number): any {
        const now = new Date();
        const payTime = now.toISOString().replace("T", " ").substring(0, 19);

        // 模拟 GameWemade SDK 的支付回调数据结构
        const xmlData = `<root>
  <uid>${uid}</uid>
  <login_name>MOCK_USER_${uid}</login_name>
  <order_no>${orderNo}</order_no>
  <out_order_no>MOCK_CP_${Date.now()}</out_order_no>
  <pay_time>${payTime}</pay_time>
  <amount>${amount}</amount>
  <extras_params>mock_payment</extras_params>
</root>`;

        return {
            xmlData,
            payTime: now,
        };
    }

    /**
     * 模拟支付成功
     * 直接调用支付回调处理逻辑
     * @param orderNo 订单号
     * @param uid 用户ID
     * @param amount 支付金额
     */
    async simulatePaymentSuccess(orderNo: string, uid: string, amount: number): Promise<void> {
        if (!this.isEnabled) {
            throw new Error("Mock 支付服务未启用（仅在 development 环境可用）");
        }

        this.logger.log(`🎭 模拟支付成功: orderNo=${orderNo}, uid=${uid}, amount=${amount}`);

        // 生成 Mock 数据
        const mockData = this.generateMockCallbackData(orderNo, uid, amount);

        this.logger.debug(`Mock 支付数据: ${JSON.stringify(mockData)}`);
    }
}

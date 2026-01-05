import { Injectable, Logger, BadRequestException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import crypto from "crypto";

/**
 * 通用支付回调原始参数接口
 */
export interface PaymentCallbackRawParams {
    /** 订单号（我们的订单号） */
    orderNo: string;
    /** 用户ID */
    uid: string;
    /** 支付金额（单位：元） */
    amount: number;
    /** 支付时间（ISO 8601 格式） */
    payTime: string;
    /** 支付平台订单号（可选） */
    platformOrderNo?: string;
    /** 签名 */
    sign: string;
    /** 时间戳 */
    timestamp: string;
    /** 扩展参数（可选） */
    extrasParams?: any;
}

/**
 * 支付回调数据
 */
export interface PaymentCallbackData {
    /** 订单号（我们的订单号） */
    orderNo: string;
    /** 用户ID */
    uid: string;
    /** 支付金额（单位：元） */
    amount: number;
    /** 支付时间 */
    payTime: Date;
    /** 支付平台订单号（可选） */
    platformOrderNo?: string;
    /** 扩展参数（可选） */
    extrasParams?: any;
}

/**
 * 通用支付回调服务
 * 用于验证支付回调的签名并处理支付结果
 */
@Injectable()
export class PaymentCallbackService {
    private readonly logger = new Logger(PaymentCallbackService.name);
    private readonly signKey: string;

    constructor(private readonly configService: ConfigService) {
        this.signKey =
            this.configService.get<string>("PAYMENT_CALLBACK_SIGN_KEY") ||
            process.env.PAYMENT_CALLBACK_SIGN_KEY ||
            "";

        if (!this.signKey) {
            this.logger.warn(
                "支付回调签名密钥未配置，需要配置 PAYMENT_CALLBACK_SIGN_KEY。支付回调功能将不可用。",
            );
        }
    }

    /**
     * 验证支付回调签名
     * 签名算法：HMAC-SHA256
     * 签名参数：orderNo, uid, amount, payTime, timestamp (按字母顺序排序)
     * @param params 支付回调参数
     * @returns 验证是否通过
     */
    verifySignature(params: PaymentCallbackRawParams): boolean {
        this.logger.log("========== 支付回调签名验证开始 ==========");

        if (!this.signKey) {
            throw new BadRequestException("支付回调服务未配置，需要配置 PAYMENT_CALLBACK_SIGN_KEY");
        }

        // 构建签名参数（排除 sign 字段，按字母顺序排序）
        const signParams: Record<string, any> = {
            orderNo: params.orderNo,
            uid: params.uid,
            amount: params.amount,
            payTime: params.payTime,
            timestamp: params.timestamp,
        };

        // 添加可选参数
        if (params.platformOrderNo) {
            signParams.platformOrderNo = params.platformOrderNo;
        }
        if (params.extrasParams) {
            signParams.extrasParams = JSON.stringify(params.extrasParams);
        }

        // 按键名排序
        const sortedKeys = Object.keys(signParams).sort();
        const sortedParams = sortedKeys.map((k) => `${k}=${signParams[k]}`).join("&");

        // 生成 HMAC-SHA256 签名
        const calculatedSign = crypto.createHmac("sha256", this.signKey).update(sortedParams).digest("hex");

        this.logger.log(`  - 签名参数: ${sortedParams}`);
        this.logger.log(`  - 接收到的签名: ${params.sign}`);
        this.logger.log(`  - 计算得到的签名: ${calculatedSign}`);

        const isValid = calculatedSign.toLowerCase() === params.sign.toLowerCase();

        if (!isValid) {
            this.logger.warn(`❌ 支付回调签名验证失败`);
        } else {
            this.logger.log(`✅ 支付回调签名验证成功`);
        }

        this.logger.log("========== 支付回调签名验证结束 ==========");
        return isValid;
    }

    /**
     * 验证时间戳（防止重放攻击）
     * @param timestamp 时间戳（秒或毫秒）
     * @param tolerance 容差时间（毫秒），默认5分钟
     */
    private validateTimestamp(timestamp: string, tolerance: number = 5 * 60 * 1000): void {
        const timestampNum = parseInt(timestamp, 10);
        if (isNaN(timestampNum)) {
            throw new BadRequestException(`时间戳格式无效: ${timestamp}`);
        }

        const now = Date.now();
        const timestampMs = timestampNum > 1000000000000 ? timestampNum : timestampNum * 1000; // 支持秒和毫秒时间戳
        const timeDiff = Math.abs(now - timestampMs);

        if (timeDiff > tolerance) {
            this.logger.warn(`时间戳过期: timestamp=${timestamp}, diff=${timeDiff}ms`);
            throw new UnauthorizedException("请求已过期，请重新发起请求");
        }
    }

    /**
     * 处理支付回调
     * 验证签名和参数，解析支付数据
     * @param params 支付回调原始参数
     * @returns 处理结果和解析后的支付数据
     */
    async processCallback(params: PaymentCallbackRawParams): Promise<{
        success: boolean;
        error?: string;
        data: PaymentCallbackData;
    }> {
        try {
            // 1. 验证必需参数
            if (!params.orderNo || !params.uid || !params.amount || !params.payTime || !params.sign || !params.timestamp) {
                throw new BadRequestException("缺少必需参数: orderNo, uid, amount, payTime, sign 或 timestamp");
            }

            // 2. 验证时间戳
            this.validateTimestamp(params.timestamp);

            // 3. 验证签名
            const isSignatureValid = this.verifySignature(params);
            if (!isSignatureValid) {
                this.logger.warn(`支付回调签名验证失败`);
                throw new UnauthorizedException("支付回调签名验证失败");
            }

            // 4. 解析支付时间
            const payTime = new Date(params.payTime);
            if (isNaN(payTime.getTime())) {
                throw new BadRequestException(`支付时间格式无效: ${params.payTime}`);
            }

            // 5. 验证金额
            const amount = Number(params.amount);
            if (isNaN(amount) || amount <= 0) {
                throw new BadRequestException(`支付金额无效: ${params.amount}`);
            }

            // 6. 构建支付数据
            const paymentData: PaymentCallbackData = {
                orderNo: params.orderNo,
                uid: params.uid,
                amount: amount,
                payTime: payTime,
                platformOrderNo: params.platformOrderNo,
                extrasParams: params.extrasParams,
            };

            this.logger.log(
                `支付回调验证成功: orderNo=${paymentData.orderNo}, uid=${paymentData.uid}, amount=${paymentData.amount}`,
            );

            return {
                success: true,
                data: paymentData,
            };
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
                throw error;
            }
            this.logger.error(`支付回调处理失败: ${error.message}`, error.stack);
            throw new BadRequestException(`支付回调处理失败: ${error.message}`);
        }
    }
}

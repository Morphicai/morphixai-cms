import { Injectable, Logger, BadRequestException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import crypto from "crypto";
import { parseStringPromise } from "xml2js";

/**
 * 支付回调原始参数接口
 * 根据 GameWemade SDK 文档，SDK会POST 3个参数：nt_data、sign、md5Sign
 * 参数皆为编码后的密文，使用从后台获取的callbackkey对密文进行解码
 */
export interface PaymentCallbackRawParams {
    /** 加密的支付数据（编码后的密文） */
    nt_data: string;
    /** 签名（编码后的密文） */
    sign: string;
    /** MD5签名（编码后的密文） */
    md5Sign: string;
}

/**
 * 解密后的支付数据（XML格式解析后）
 */
export interface PaymentCallbackData {
    /** 购买道具的用户uid */
    uid: string;
    /** 购买道具的用户username */
    login_name: string;
    /** 游戏下单时传递的游戏订单号，原样返回 */
    out_order_no?: string;
    /** SDK唯一订单号 */
    order_no: string;
    /** 用户支付时间，如2017-02-06 14:22:32 */
    pay_time: string;
    /** 用户支付金额，单位元，游戏最终发放道具金额应以此为准 */
    amount: string;
    /** 内购订阅型商品订单订阅状态，如果有此字段表示订单订阅状态。cp监测到有此字段时不需要发货。字段取值为：2：订阅取消 */
    subscriptionStatus?: string;
    /** 内购订阅型商品订单取消订阅原因。当有subscriptionStatus字段时此字段必有 */
    subReason?: string;
    /** 客户端下单时透传参数 原样返回 */
    extras_params?: string;
}

/**
 * 支付回调服务
 * 用于验证支付回调的签名并处理支付结果
 * 参考文档：https://sdkadmin.gamewemade.com/docs/index/aid/544
 */
@Injectable()
export class PaymentCallbackService {
    private readonly logger = new Logger(PaymentCallbackService.name);
    private readonly callbackKey: string;
    private readonly md5Key: string;

    constructor(private readonly configService: ConfigService) {
        this.callbackKey = this.configService.get<string>("GAMEWEMADE_SDK_CALLBACK_KEY") || "";
        this.md5Key = this.configService.get<string>("GAMEWEMADE_SDK_MD5_KEY") || "";

        if (!this.callbackKey || !this.md5Key) {
            this.logger.warn(
                "GameWemade SDK 支付回调配置不完整，需要配置 GAMEWEMADE_SDK_CALLBACK_KEY 和 GAMEWEMADE_SDK_MD5_KEY。支付回调功能将不可用。",
            );
        }
    }

    /**
     * 解码密文
     * 使用 callbackkey 对密文进行解码
     * @param encodedData 编码后的密文
     * @returns 解码后的字符串
     */
    private decodeEncryptedData(encodedData: string): string {
        this.logger.log("--- 开始解码密文 ---");
        this.logger.log(`  - 输入数据 (前100字符): ${encodedData.substring(0, 100)}...`);
        this.logger.log(`  - 输入数据长度: ${encodedData.length}`);

        if (!encodedData || encodedData.length === 0) {
            this.logger.log("  - 输入为空，直接返回");
            return encodedData;
        }

        // 检查 callbackKey 是否配置
        if (!this.callbackKey) {
            throw new BadRequestException("支付回调服务未配置，需要配置 GAMEWEMADE_SDK_CALLBACK_KEY");
        }

        this.logger.log(`  - callbackKey (前10字符): ${this.callbackKey.substring(0, 10)}...`);
        this.logger.log(`  - callbackKey 长度: ${this.callbackKey.length}`);
        this.logger.log(`  - 🔑 完整 callbackKey: ${this.callbackKey}`);

        try {
            // 提取数字序列（格式：@171@174@188...）
            const pattern = /@(\d+)/g;
            const matches = encodedData.matchAll(pattern);
            const numbers: number[] = [];

            for (const match of matches) {
                numbers.push(parseInt(match[1], 10));
            }

            this.logger.log(`  - 提取到 ${numbers.length} 个数字`);
            if (numbers.length > 0) {
                this.logger.log(`  - 前10个数字: ${numbers.slice(0, 10).join(", ")}`);
            }

            if (numbers.length === 0) {
                this.logger.log("  - 未提取到数字，直接返回原文");
                return encodedData;
            }

            // 解码算法：data[i] = (byte) (list.get(i) - (0xff & keys[i % keys.length]))
            const data = Buffer.alloc(numbers.length);
            const keys = Buffer.from(this.callbackKey, "utf-8");

            for (let i = 0; i < numbers.length; i++) {
                const keyByte = keys[i % keys.length];
                data[i] = (numbers[i] - (0xff & keyByte)) & 0xff;
            }

            const result = data.toString("utf-8");
            this.logger.log(`  - 解码成功，结果长度: ${result.length}`);
            this.logger.log(`  - 解码结果 (前100字符): ${result.substring(0, 100)}...`);
            this.logger.log("--- 解码密文完成 ---");

            return result;
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`解码密文失败: ${error.message}`);
            throw new BadRequestException(`解码密文失败: ${error.message}`);
        }
    }

    /**
     * 验证支付回调签名
     * 判断方法：localSign = md5(nt_data + sign + md5Key)
     * 注意：直接对nt_data、sign、md5Key的原文进行拼接，无需加拼接符，无需对nt_data解码
     * 但是 md5Sign 是编码后的密文，需要先解码才能比较
     * @param ntData 加密的支付数据（编码后的密文，原文）
     * @param sign 签名（编码后的密文，原文）
     * @param md5Sign 接收到的MD5签名（编码后的密文，需要解码）
     * @returns 验证是否通过
     * @throws BadRequestException 如果密钥未配置
     */
    verifySignature(ntData: string, sign: string, md5Sign: string): boolean {
        this.logger.log("========== 支付回调签名验证开始 ==========");

        if (!ntData || !sign || !md5Sign) {
            this.logger.warn("支付回调缺少签名参数");
            this.logger.log(`参数检查: ntData=${!!ntData}, sign=${!!sign}, md5Sign=${!!md5Sign}`);
            return false;
        }

        // 检查 md5Key 是否配置
        if (!this.md5Key) {
            throw new BadRequestException("支付回调服务未配置，需要配置 GAMEWEMADE_SDK_MD5_KEY");
        }

        this.logger.log("步骤1: 打印原始参数");
        this.logger.log(`  - nt_data (前100字符): ${ntData.substring(0, 100)}...`);
        this.logger.log(`  - nt_data 长度: ${ntData.length}`);
        this.logger.log(`  - sign (前100字符): ${sign.substring(0, 100)}...`);
        this.logger.log(`  - sign 长度: ${sign.length}`);
        this.logger.log(`  - md5Sign (前100字符): ${md5Sign.substring(0, 100)}...`);
        this.logger.log(`  - md5Sign 长度: ${md5Sign.length}`);
        this.logger.log(`  - md5Key (前10字符): ${this.md5Key.substring(0, 10)}...`);
        this.logger.log(`  - md5Key 长度: ${this.md5Key.length}`);
        this.logger.log(`  - 🔑 完整 md5Key: ${this.md5Key}`);

        // 1. 解码 md5Sign（md5Sign 是编码后的密文，需要先解码）
        // decodeEncryptedData 内部会检查 callbackKey
        this.logger.log("步骤2: 解码 md5Sign");
        const decodedMd5Sign = this.decodeEncryptedData(md5Sign);
        this.logger.log(`  - 解码后的 md5Sign: ${decodedMd5Sign}`);
        this.logger.log(`  - 解码后的 md5Sign 长度: ${decodedMd5Sign.length}`);

        // 2. 直接拼接 nt_data + sign + md5Key（都是原文，无需解码）
        this.logger.log("步骤3: 拼接签名字符串");
        const signString = ntData + sign + this.md5Key;
        this.logger.log(`  - 拼接字符串长度: ${signString.length}`);
        this.logger.log(`  - 拼接字符串 (前200字符): ${signString.substring(0, 200)}...`);

        // 3. MD5 编码
        this.logger.log("步骤4: 计算 MD5");
        const calculatedSign = crypto.createHash("md5").update(signString, "utf-8").digest("hex");
        this.logger.log(`  - 计算得到的签名: ${calculatedSign}`);

        // 4. 比较签名（不区分大小写）
        this.logger.log("步骤5: 比较签名");
        this.logger.log(`  - 接收到的签名 (小写): ${decodedMd5Sign.toLowerCase()}`);
        this.logger.log(`  - 计算得到的签名 (小写): ${calculatedSign.toLowerCase()}`);

        const isValid = calculatedSign.toLowerCase() === decodedMd5Sign.toLowerCase();

        if (!isValid) {
            this.logger.warn(`❌ 支付回调签名验证失败`);
            this.logger.warn(`  - received: ${decodedMd5Sign}`);
            this.logger.warn(`  - calculated: ${calculatedSign}`);
            this.logger.warn(`  - 差异分析:`);
            this.logger.warn(`    * 接收签名长度: ${decodedMd5Sign.length}`);
            this.logger.warn(`    * 计算签名长度: ${calculatedSign.length}`);

            // 逐字符比较
            if (decodedMd5Sign.length === calculatedSign.length) {
                for (let i = 0; i < decodedMd5Sign.length; i++) {
                    if (decodedMd5Sign[i].toLowerCase() !== calculatedSign[i].toLowerCase()) {
                        this.logger.warn(`    * 第 ${i} 位不同: '${decodedMd5Sign[i]}' vs '${calculatedSign[i]}'`);
                        break;
                    }
                }
            }
        } else {
            this.logger.log(`✅ 支付回调签名验证成功`);
        }

        this.logger.log("========== 支付回调签名验证结束 ==========");
        return isValid;
    }

    /**
     * 解密 nt_data
     * 使用 Callback_Key 解密 nt_data，解密后是 XML 格式字符串
     * @param ntData 加密的支付数据（编码后的密文）
     * @returns 解密后的 XML 字符串
     */
    private decryptNtData(ntData: string): string {
        // 1. 先使用 callbackkey 解码密文
        const decodedData = this.decodeEncryptedData(ntData);

        // 2. 解码后的数据就是 XML 字符串
        return decodedData;
    }

    /**
     * 解析 XML 数据
     * XML 格式示例（根据 GameWemade SDK 文档）：
     * <?xml version="1.0" encoding="UTF-8" standalone="no"?>
     * <quick_message>
     *   <message>
     *     <uid>50848343</uid>
     *     <login_name>GG366822889</login_name>
     *     <out_order_no>13420170114150053861611313</out_order_no>
     *     <order_no>0720170114150059110833</order_no>
     *     <pay_time>2017-01-14 15:01:17</pay_time>
     *     <amount>0.01</amount>
     *     <status>0</status>
     *     <extras_params>13420170114150053861611313</extras_params>
     *   </message>
     * </quick_message>
     * @param xmlString XML 格式字符串
     * @returns 解析后的支付数据
     */
    private async parseXmlData(xmlString: string): Promise<PaymentCallbackData> {
        this.logger.log("--- 开始解析 XML 数据 ---");
        this.logger.log(`  - XML 内容 (前500字符): ${xmlString.substring(0, 500)}`);

        try {
            const result = await parseStringPromise(xmlString, {
                explicitArray: false,
                trim: true,
                ignoreAttrs: true,
            });

            this.logger.log(`  - 解析后的 JSON 结构: ${JSON.stringify(result, null, 2)}`);

            // XML 结构：<quick_message><message><uid>...</uid>...</message></quick_message>
            // 或者可能是：<root><uid>...</uid>...</root>（兼容旧格式）
            let messageData;
            if (result.quick_message && result.quick_message.message) {
                messageData = result.quick_message.message;
                this.logger.log("  - 使用 quick_message.message 结构");
            } else if (result.root) {
                messageData = result.root;
                this.logger.log("  - 使用 root 结构（兼容模式）");
            } else {
                messageData = result;
                this.logger.log("  - 使用根节点结构（兼容模式）");
            }

            const data: PaymentCallbackData = {
                uid: messageData.uid || "",
                login_name: messageData.login_name || "",
                out_order_no: messageData.out_order_no,
                order_no: messageData.order_no || "",
                pay_time: messageData.pay_time || "",
                amount: messageData.amount || "",
                subscriptionStatus: messageData.subscriptionStatus,
                subReason: messageData.subReason,
                extras_params: messageData.extras_params,
            };

            this.logger.log(`  - 解析后的数据: ${JSON.stringify(data, null, 2)}`);

            // 验证必需字段
            if (!data.uid || !data.order_no || !data.amount) {
                throw new Error("XML数据缺少必需字段: uid、order_no 或 amount");
            }

            this.logger.log("--- XML 数据解析成功 ---");
            return data;
        } catch (error) {
            this.logger.error(`解析XML数据失败: ${error.message}`);
            this.logger.error(`XML内容: ${xmlString.substring(0, 500)}`);
            throw new BadRequestException(`解析XML数据失败: ${error.message}`);
        }
    }

    /**
     * 处理支付回调
     * 验证签名和参数，解密并解析支付数据
     * @param params 支付回调原始参数
     * @returns 处理结果和解析后的支付数据
     */
    async processCallback(params: PaymentCallbackRawParams): Promise<{
        success: boolean;
        error?: string;
        data: PaymentCallbackData;
    }> {
        try {
            // 0. 检查配置是否完整
            if (!this.callbackKey || !this.md5Key) {
                throw new BadRequestException(
                    "支付回调服务未配置，需要配置 GAMEWEMADE_SDK_CALLBACK_KEY 和 GAMEWEMADE_SDK_MD5_KEY",
                );
            }

            // 1. 验证必需参数
            if (!params.nt_data || !params.sign || !params.md5Sign) {
                throw new BadRequestException("缺少必需参数: nt_data、sign 或 md5Sign");
            }

            // 2. 验证签名（使用原文，无需解码）
            const isSignatureValid = this.verifySignature(params.nt_data, params.sign, params.md5Sign);
            if (!isSignatureValid) {
                this.logger.warn(`支付回调签名验证失败`);
                throw new UnauthorizedException("支付回调签名验证失败");
            }

            // 3. 解密 nt_data
            const xmlString = this.decryptNtData(params.nt_data);

            // 4. 解析 XML 数据
            const paymentData = await this.parseXmlData(xmlString);

            // 5. 检查订阅状态（如果有 subscriptionStatus 字段，不需要发货）
            if (paymentData.subscriptionStatus === "2") {
                this.logger.log(`订单为订阅取消状态，不需要发货: orderNo=${paymentData.order_no}`);
                return {
                    success: true,
                    data: paymentData,
                };
            }

            this.logger.log(
                `支付回调验证成功: orderNo=${paymentData.order_no}, uid=${paymentData.uid}, amount=${paymentData.amount}`,
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

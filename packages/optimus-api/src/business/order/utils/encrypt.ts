import crypto from "crypto";

/**
 * 订单数据加密工具函数
 *
 * 提供简单的函数式接口，方便快速使用
 */

/**
 * 标准化密钥长度
 * 确保密钥长度为 32 字节（AES-256 需要）
 */
function normalizeKey(key: string): Buffer {
    const keyBuffer = Buffer.from(key, "utf-8");

    if (keyBuffer.length === 32) {
        return keyBuffer;
    } else if (keyBuffer.length < 32) {
        // 如果密钥不足 32 字节，使用 SHA-256 哈希扩展
        return crypto.createHash("sha256").update(keyBuffer).digest();
    } else {
        // 如果密钥超过 32 字节，截取前 32 字节
        return keyBuffer.slice(0, 32);
    }
}

/**
 * 加密订单数据（AES，推荐）
 *
 * @param uid 用户ID
 * @param authToken 认证Token
 * @param extras 其他额外信息
 * @param encryptionKey 加密密钥（如果未提供，从环境变量读取）
 * @returns AES 加密的字符串（格式：iv:encryptedData）
 *
 * @example
 * ```typescript
 * import { encryptOrderData } from './utils/encrypt';
 *
 * const encrypted = encryptOrderData(
 *   "123456",
 *   "your-auth-token",
 *   { productId: "PROD001", amount: 100.0 },
 *   "your-secret-key" // 或从环境变量读取
 * );
 * ```
 */
export function encryptOrderData(
    uid: string,
    authToken: string,
    extras: Record<string, any> = {},
    encryptionKey?: string,
): string {
    const orderData = {
        uid,
        authToken,
        ...extras,
    };

    // 从环境变量读取密钥（如果未提供）
    const key = encryptionKey || process.env.ORDER_ENCRYPTION_KEY;
    if (!key) {
        throw new Error("AES 加密需要提供密钥或配置 ORDER_ENCRYPTION_KEY 环境变量");
    }

    const algorithm = "aes-256-cbc";
    const keyBuffer = normalizeKey(key);

    // 生成随机 IV（16 字节）
    const iv = crypto.randomBytes(16);

    const jsonString = JSON.stringify(orderData);
    const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);

    let encrypted = cipher.update(jsonString, "utf-8", "base64");
    encrypted += cipher.final("base64");

    // 将 IV 和加密数据组合：iv:encryptedData（都是 Base64 编码）
    const ivBase64 = iv.toString("base64");
    return `${ivBase64}:${encrypted}`;
}

/**
 * 加密任意数据（Base64，仅用于测试）
 *
 * @param data 要加密的数据对象
 * @returns Base64 编码的字符串
 */
export function encryptData(data: Record<string, any>): string {
    const jsonString = JSON.stringify(data);
    return Buffer.from(jsonString, "utf-8").toString("base64");
}

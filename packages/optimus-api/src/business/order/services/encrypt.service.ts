import crypto from "crypto";

/**
 * 订单数据加密服务
 * 提供多种加密方式，用于加密订单数据（包含 uid、authToken 等）
 */
export class EncryptService {
    /**
     * Base64 加密
     * 将 JSON 对象编码为 Base64 字符串
     *
     * @param data 要加密的数据对象
     * @returns Base64 编码的字符串
     *
     * @example
     * ```typescript
     * const encrypted = encryptService.encryptBase64({
     *   uid: "123456",
     *   authToken: "token123",
     *   extras: { productId: "PROD001" }
     * });
     * ```
     */
    encryptBase64(data: Record<string, any>): string {
        try {
            const jsonString = JSON.stringify(data);
            return Buffer.from(jsonString, "utf-8").toString("base64");
        } catch (error) {
            throw new Error(`Base64 加密失败: ${error.message}`);
        }
    }

    /**
     * AES 加密
     * 使用 AES-256-CBC 算法加密数据
     * 使用随机 IV，并将 IV 包含在加密结果中（格式：iv:encryptedData）
     *
     * @param data 要加密的数据对象
     * @param key 加密密钥（32 字节，如果不足会自动补齐或截断）
     * @returns Base64 编码的加密字符串（格式：iv:encryptedData，都是 Base64 编码）
     *
     * @example
     * ```typescript
     * const encrypted = encryptService.encryptAES(
     *   { uid: "123456", authToken: "token123" },
     *   "your-32-byte-secret-key-here!!"
     * );
     * ```
     */
    encryptAES(data: Record<string, any>, key: string): string {
        try {
            const algorithm = "aes-256-cbc";

            // 确保密钥长度为 32 字节
            const keyBuffer = this.normalizeKey(key);

            // 生成随机 IV（16 字节）
            const iv = crypto.randomBytes(16);

            const jsonString = JSON.stringify(data);
            const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);

            let encrypted = cipher.update(jsonString, "utf-8", "base64");
            encrypted += cipher.final("base64");

            // 将 IV 和加密数据组合：iv:encryptedData（都是 Base64 编码）
            const ivBase64 = iv.toString("base64");
            return `${ivBase64}:${encrypted}`;
        } catch (error) {
            throw new Error(`AES 加密失败: ${error.message}`);
        }
    }

    /**
     * 标准化密钥长度
     * 确保密钥长度为 32 字节（AES-256 需要）
     *
     * @param key 原始密钥
     * @returns 32 字节的 Buffer
     */
    private normalizeKey(key: string): Buffer {
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
     * 通用加密方法（默认使用 AES）
     *
     * @param data 要加密的数据对象
     * @param method 加密方法，默认为 'aes'
     * @param options 加密选项（AES 需要提供 key）
     * @returns 加密后的字符串
     *
     * @example
     * ```typescript
     * // AES 加密（默认）
     * const encrypted1 = encryptService.encrypt({
     *   uid: "123456",
     *   authToken: "token123"
     * }, "aes", { key: "your-secret-key" });
     *
     * // Base64 编码（仅用于测试）
     * const encrypted2 = encryptService.encrypt(
     *   { uid: "123456", authToken: "token123" },
     *   "base64"
     * );
     * ```
     */
    encrypt(
        data: Record<string, any>,
        method: "base64" | "aes" = "aes",
        options?: { key?: string; iv?: string },
    ): string {
        if (method === "base64") {
            return this.encryptBase64(data);
        } else if (method === "aes") {
            if (!options?.key) {
                throw new Error("AES 加密需要提供密钥");
            }
            return this.encryptAES(data, options.key);
        } else {
            throw new Error(`不支持的加密方法: ${method}`);
        }
    }

    /**
     * 加密订单数据（便捷方法）
     * 专门用于加密包含 uid 和 authToken 的订单数据
     *
     * @param uid 用户ID
     * @param authToken 认证Token
     * @param extras 其他额外信息
     * @param method 加密方法，默认为 'aes'
     * @param options 加密选项
     * @returns 加密后的字符串
     *
     * @example
     * ```typescript
     * const encrypted = encryptService.encryptOrderData(
     *   "123456",
     *   "your-auth-token",
     *   { productId: "PROD001", amount: 100.0 },
     *   "aes",
     *   { key: "your-secret-key" }
     * );
     * ```
     */
    encryptOrderData(
        uid: string,
        authToken: string,
        extras: Record<string, any> = {},
        method: "base64" | "aes" = "aes",
        options?: { key?: string; iv?: string },
    ): string {
        const orderData = {
            uid,
            authToken,
            ...extras,
        };

        return this.encrypt(orderData, method, options);
    }
}

/**
 * 单例实例（可选使用）
 */
export const encryptService = new EncryptService();

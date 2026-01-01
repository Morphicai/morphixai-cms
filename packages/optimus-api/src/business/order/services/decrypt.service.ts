import { Injectable, BadRequestException } from "@nestjs/common";
import crypto from "crypto";

/**
 * 参数解密服务
 * 支持多种解密方式
 */
@Injectable()
export class DecryptService {
    /**
     * Base64 解密
     * @param encryptedData Base64 编码的字符串
     * @returns 解密后的 JSON 对象
     */
    decryptBase64(encryptedData: string): any {
        try {
            const decoded = Buffer.from(encryptedData, "base64").toString("utf-8");
            return JSON.parse(decoded);
        } catch (error) {
            throw new BadRequestException("参数解密失败：Base64 解码错误");
        }
    }

    /**
     * AES 解密
     * 支持从环境变量读取密钥，或从参数传入密钥
     * 加密格式：iv:encryptedData（都是 Base64 编码）
     *
     * @param encryptedData 加密的数据（格式：iv:encryptedData）
     * @param key 解密密钥（如果未提供，从环境变量读取）
     * @returns 解密后的 JSON 对象
     */
    decryptAES(encryptedData: string, key?: string): any {
        try {
            // 从环境变量读取密钥（如果未提供）
            const decryptKey = key || process.env.ORDER_ENCRYPTION_KEY;
            if (!decryptKey) {
                throw new BadRequestException("AES 解密需要提供密钥或配置 ORDER_ENCRYPTION_KEY 环境变量");
            }

            const algorithm = "aes-256-cbc";

            // 标准化密钥长度
            const keyBuffer = this.normalizeKey(decryptKey);

            // 解析加密数据（格式：iv:encryptedData）
            const parts = encryptedData.split(":");
            if (parts.length !== 2) {
                throw new BadRequestException("AES 加密数据格式错误，应为 iv:encryptedData");
            }

            const [ivBase64, encrypted] = parts;
            const iv = Buffer.from(ivBase64, "base64");

            const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
            let decrypted = decipher.update(encrypted, "base64", "utf-8");
            decrypted += decipher.final("utf-8");

            return JSON.parse(decrypted);
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(`参数解密失败：AES 解密错误 - ${error.message}`);
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
     * 通用解密方法（默认使用 AES）
     * @param encryptedData 加密的数据
     * @param method 解密方法，默认为 'aes'
     * @param options 解密选项（AES 可以传入 key，如果不传则从环境变量读取）
     * @returns 解密后的对象
     */
    decrypt(encryptedData: string, method: "base64" | "aes" = "aes", options?: { key?: string; iv?: string }): any {
        if (method === "base64") {
            return this.decryptBase64(encryptedData);
        } else if (method === "aes") {
            return this.decryptAES(encryptedData, options?.key);
        } else {
            throw new BadRequestException(`不支持的解密方法: ${method}`);
        }
    }
}

import CryptoJS from 'crypto-js';

/**
 * 对称加密工具类
 * 用于客户端密码等敏感信息的传输加密
 */
export class CryptoUtil {
  // 默认密钥，生产环境应从环境变量获取
  private static readonly DEFAULT_SECRET_KEY = 'optimus-client-crypto-key-2024';
  
  /**
   * 获取加密密钥
   * 优先从环境变量获取，否则使用默认密钥
   */
  private static getSecretKey(): string {
    // 简单的环境检测
    const isClient = typeof window !== 'undefined';
    
    if (isClient) {
      // 客户端环境变量
      return process.env.NEXT_PUBLIC_CRYPTO_SECRET || this.DEFAULT_SECRET_KEY;
    }
    // 服务端环境变量
    return process.env.CRYPTO_SECRET || this.DEFAULT_SECRET_KEY;
  }

  /**
   * AES 加密
   * @param plaintext 明文
   * @param secretKey 密钥（可选，不传则使用默认密钥）
   * @returns 加密后的密文（Base64编码）
   */
  static encrypt(plaintext: string, secretKey?: string): string {
    try {
      const key = secretKey || this.getSecretKey();
      const encrypted = CryptoJS.AES.encrypt(plaintext, key).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('加密失败');
    }
  }

  /**
   * AES 解密
   * @param ciphertext 密文（Base64编码）
   * @param secretKey 密钥（可选，不传则使用默认密钥）
   * @returns 解密后的明文
   */
  static decrypt(ciphertext: string, secretKey?: string): string {
    try {
      const key = secretKey || this.getSecretKey();
      const decrypted = CryptoJS.AES.decrypt(ciphertext, key);
      const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!plaintext) {
        throw new Error('解密失败：无效的密文或密钥');
      }
      
      return plaintext;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('解密失败');
    }
  }

  /**
   * 加密密码（专用于密码传输）
   * @param password 原始密码
   * @returns 加密后的密码
   */
  static encryptPassword(password: string): string {
    return this.encrypt(password);
  }

  /**
   * 解密密码（专用于密码传输）
   * @param encryptedPassword 加密的密码
   * @returns 原始密码
   */
  static decryptPassword(encryptedPassword: string): string {
    return this.decrypt(encryptedPassword);
  }

  /**
   * 生成随机密钥
   * @param length 密钥长度（默认32位）
   * @returns 随机密钥
   */
  static generateSecretKey(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * MD5 哈希（用于数据完整性校验）
   * @param data 待哈希的数据
   * @returns MD5 哈希值
   */
  static md5Hash(data: string): string {
    return CryptoJS.MD5(data).toString();
  }

  /**
   * SHA256 哈希（用于数据完整性校验）
   * @param data 待哈希的数据
   * @returns SHA256 哈希值
   */
  static sha256Hash(data: string): string {
    return CryptoJS.SHA256(data).toString();
  }

  /**
   * Base64 编码
   * @param data 待编码的数据
   * @returns Base64 编码结果
   */
  static base64Encode(data: string): string {
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(data));
  }

  /**
   * Base64 解码
   * @param encodedData Base64 编码的数据
   * @returns 解码后的数据
   */
  static base64Decode(encodedData: string): string {
    return CryptoJS.enc.Base64.parse(encodedData).toString(CryptoJS.enc.Utf8);
  }
}

/**
 * 密码加密传输装饰器
 * 用于自动加密登录和注册时的密码字段
 */
export function encryptPasswordFields<T extends Record<string, any>>(data: T): T {
  const result = { ...data } as any;
  
  // 加密常见的密码字段
  const passwordFields = ['password', 'newPassword', 'oldPassword', 'confirmPassword'];
  
  passwordFields.forEach(field => {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = CryptoUtil.encryptPassword(result[field]);
    }
  });
  
  return result;
}

/**
 * 密码解密装饰器
 * 用于自动解密接收到的密码字段
 */
export function decryptPasswordFields<T extends Record<string, any>>(data: T): T {
  const result = { ...data } as any;
  
  // 解密常见的密码字段
  const passwordFields = ['password', 'newPassword', 'oldPassword', 'confirmPassword'];
  
  passwordFields.forEach(field => {
    if (result[field] && typeof result[field] === 'string') {
      try {
        result[field] = CryptoUtil.decryptPassword(result[field]);
      } catch (error) {
        console.warn(`Failed to decrypt field ${field}:`, error);
        // 如果解密失败，保持原值（可能本身就是明文）
      }
    }
  });
  
  return result;
}

export default CryptoUtil;
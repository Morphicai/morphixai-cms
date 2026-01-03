/**
 * 订单接口测试示例
 *
 * 演示如何生成加密数据并调用订单创建接口
 */

/**
 * 生成 Base64 编码的订单数据
 * @param uid 用户ID
 * @param authToken 认证Token
 * @param extras 额外信息
 * @returns Base64 编码的字符串
 */
export function generateEncryptedOrderData(uid: string, authToken: string, extras: Record<string, any> = {}): string {
    const orderData = {
        uid,
        authToken,
        ...extras,
    };

    return Buffer.from(JSON.stringify(orderData)).toString("base64");
}

/**
 * 测试示例
 */
export function testExample() {
    // 示例数据
    const uid = "123456";
    const authToken = "test-auth-token-12345";
    const extras = {
        productId: "PROD001",
        amount: 100.0,
        currency: "CNY",
    };

    // 生成加密数据
    const encryptedData = generateEncryptedOrderData(uid, authToken, extras);

    console.log("加密后的订单数据:", encryptedData);

    // 解密验证（仅用于测试）
    const decrypted = JSON.parse(Buffer.from(encryptedData, "base64").toString("utf-8"));
    console.log("解密后的订单数据:", decrypted);

    return {
        encryptedData,
        requestBody: {
            encryptedData,
            decryptMethod: "base64",
        },
    };
}

/**
 * cURL 命令示例
 */
export function generateCurlCommand(baseUrl = "http://localhost:8084") {
    const { encryptedData } = testExample();

    return `curl -X POST ${baseUrl}/api/biz/order/create \\
  -H "Content-Type: application/json" \\
  -d '{
    "encryptedData": "${encryptedData}",
    "decryptMethod": "base64"
  }'`;
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
    console.log("=== 订单接口测试示例 ===\n");
    const result = testExample();
    console.log("\n=== cURL 命令 ===");
    console.log(generateCurlCommand());
}

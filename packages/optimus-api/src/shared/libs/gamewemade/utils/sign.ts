import crypto from "crypto";

/**
 * 生成 MD5 签名
 *
 * 签名算法：
 * 1. 将需要传递的参数按首字母升序排序
 * 2. 将所有键值对按 key1=val1&key2=val2&key3=val3& 格式进行拼接
 * 3. 在第2步拼接的字符后拼接SDK分配的openKey
 * 4. 将第3步处理的字符串进行md5编码，得到32位小写md5值
 *
 * @param params 需要签名的参数对象
 * @param openKey SDK分配的加密串
 * @returns 32位小写MD5签名值
 */
export function generateSign(params: Record<string, any>, openKey: string): string {
    console.log("========== 签名生成过程 ==========");
    console.log("1. 原始参数:", JSON.stringify(params, null, 2));

    // 1. 按首字母升序排序
    const sortedKeys = Object.keys(params).sort();
    console.log("2. 排序后的键:", sortedKeys);

    // 2. 拼接键值对
    let signKey = "";
    const keyValuePairs: string[] = [];
    for (const key of sortedKeys) {
        const value = params[key];
        // 跳过 undefined 和 null 值
        if (value !== undefined && value !== null) {
            // 如果值是对象或数组，转换为 JSON 字符串
            let stringValue: string;
            if (typeof value === "object") {
                stringValue = JSON.stringify(value);
            } else {
                stringValue = String(value);
            }

            const pair = `${key}=${stringValue}`;
            keyValuePairs.push(pair);
            signKey += `${pair}&`;
        }
    }

    console.log("3. 键值对列表:");
    keyValuePairs.forEach((pair, index) => {
        console.log(`   [${index}] ${pair}`);
    });

    // 3. 拼接 openKey
    const signKeyWithoutOpenKey = signKey;
    signKey += openKey;

    console.log("4. 拼接字符串（不含openKey）:", signKeyWithoutOpenKey);
    console.log("5. OpenKey长度:", openKey.length);
    console.log("6. 完整拼接字符串:", signKey);

    // 4. MD5 编码并返回32位小写值
    const md5Hash = crypto.createHash("md5").update(signKey).digest("hex");
    console.log("7. 最终MD5签名:", md5Hash);
    console.log("====================================\n");

    return md5Hash;
}

/**
 * MD5 加密密码
 *
 * @param password 原始密码
 * @returns 32位小写MD5值
 */
export function md5Password(password: string): string {
    return crypto.createHash("md5").update(password).digest("hex");
}

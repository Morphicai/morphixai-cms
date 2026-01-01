/**
 * GameWemade SDK 使用示例
 *
 * 本文件展示了如何使用 GameWemade SDK 客户端
 */

import { GameWemadeSDK } from "./client";
import { CheckTokenParams } from "./types";
import { md5Password } from "./utils/sign";

/**
 * 示例：通用请求 - 用户登录
 */
export async function exampleUserLogin(sdk: GameWemadeSDK) {
    try {
        const result = await sdk.request("/webOpen/userLogin", {
            username: "testuser",
            password: md5Password("password123"), // 密码需要MD5编码
        });

        if (result.status) {
            console.log("登录成功:", result.data);
            const { uid, username, authToken } = result.data;
            console.log(`用户ID: ${uid}, 用户名: ${username}, Token: ${authToken}`);
            return result.data;
        } else {
            console.error("登录失败:", result.message);
            throw new Error(result.message);
        }
    } catch (error: any) {
        console.error("登录请求失败:", error.message);
        throw error;
    }
}

/**
 * 示例：通用请求 - 用户注册
 */
export async function exampleUserRegister(sdk: GameWemadeSDK) {
    try {
        const result = await sdk.request("/webOpen/userRegister", {
            username: "testuser",
            password: md5Password("password123"), // 密码需要MD5编码
        });

        if (result.status) {
            console.log("注册成功:", result.data);
            return result.data;
        } else {
            console.error("注册失败:", result.message);
            throw new Error(result.message);
        }
    } catch (error: any) {
        console.error("注册请求失败:", error.message);
        throw error;
    }
}

/**
 * 示例：检查 Token
 */
export async function exampleCheckToken(sdk: GameWemadeSDK, authToken: string, uid?: string) {
    const params: CheckTokenParams = {
        authToken,
        uid,
    };

    try {
        const result = await sdk.checkToken(params);
        if (result.status) {
            console.log("Token 有效:", result.data);
            return result.data;
        } else {
            console.error("Token 无效:", result.message);
            throw new Error(result.message);
        }
    } catch (error: any) {
        console.error("检查 Token 失败:", error.message);
        throw error;
    }
}

/**
 * 完整示例：创建 SDK 实例并使用
 */
export function createSDKExample() {
    const sdk = new GameWemadeSDK({
        openId: "your-open-id",
        openKey: "your-open-key",
        productCode: "your-product-code",
        baseUrl: "http://custom-sdkapi.gamewemade.com",
        channelCode: "website",
    });

    return sdk;
}

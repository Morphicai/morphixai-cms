import { TestModeDetector } from "../../src/shared/utils/test-mode.detector";
import { ApiClient } from "./api-client";

export interface CaptchaData {
    id: string;
    img: string;
    code?: string; // 仅在测试模式下可用
}

/**
 * 验证码处理器 - 处理测试模式下的验证码逻辑
 */
export class CaptchaHandler {
    private apiClient: ApiClient;

    constructor(apiClient: ApiClient) {
        this.apiClient = apiClient;
    }

    /**
     * 获取验证码数据
     * 在测试模式下返回固定数据，生产模式下调用API
     */
    async getCaptcha(): Promise<CaptchaData> {
        if (TestModeDetector.isTestMode()) {
            // 测试模式下返回固定的验证码数据
            return {
                id: "test-captcha-id",
                img: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjUwIj48dGV4dCB4PSI1MCIgeT0iMjUiPjEyMzQ8L3RleHQ+PC9zdmc+",
                code: "1234", // 测试模式下提供验证码答案
            };
        }

        // 生产模式下调用API获取验证码
        const response = await this.apiClient.get("/api/captcha/img");

        if (response.code !== 200) {
            throw new Error(`获取验证码失败: ${response.message}`);
        }

        return {
            id: response.data.id,
            img: response.data.img,
        };
    }

    /**
     * 验证验证码是否有效
     * 主要用于测试验证
     */
    isValidCaptchaCode(code: string): boolean {
        if (TestModeDetector.isTestMode()) {
            // 测试模式下，任何4位数字都被认为是有效的
            return /^\d{4}$/.test(code);
        }

        // 生产模式下无法在客户端验证，返回true
        return true;
    }

    /**
     * 获取测试模式下的默认验证码
     */
    getTestCaptchaCode(): string {
        return "1234";
    }

    /**
     * 检查是否应该绕过验证码验证
     */
    shouldBypassCaptcha(): boolean {
        return TestModeDetector.shouldBypassCaptcha();
    }

    /**
     * 为登录请求准备验证码数据
     */
    async prepareCaptchaForLogin(): Promise<{ captchaId: string; verifyCode: string }> {
        if (TestModeDetector.isTestMode()) {
            return {
                captchaId: "test-captcha-id",
                verifyCode: "1234",
            };
        }

        // 生产模式下需要实际获取验证码
        const captcha = await this.getCaptcha();

        // 在生产模式下，需要用户输入验证码
        // 这里抛出错误，提示需要手动处理
        throw new Error("生产模式下需要手动输入验证码");
    }

    /**
     * 创建带有验证码的登录数据
     */
    async createLoginDataWithCaptcha(
        account: string,
        password: string,
    ): Promise<{
        account: string;
        password: string;
        captchaId: string;
        verifyCode: string;
    }> {
        const captchaData = await this.prepareCaptchaForLogin();

        return {
            account,
            password,
            captchaId: captchaData.captchaId,
            verifyCode: captchaData.verifyCode,
        };
    }
}

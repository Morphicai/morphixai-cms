import { v4 as uuidv4 } from "uuid";
import * as svgCaptcha from "svg-captcha";
import { Injectable } from "@nestjs/common";
import { ImageCaptchaDto } from "./dto/image-captcha.dto";

import { ResultData } from "../../shared/utils/result";
import { TestModeDetector } from "../../shared/utils/test-mode.detector";

@Injectable()
export class BaseService {
    private captchaStore = new Map<string, { code: string; expires: number }>();

    constructor() {
        // Initialize base service
    }
    /**
     * 创建验证码并缓存到内存
     * 在测试模式下返回固定的验证码数据
     * @param captcha 验证码长宽
     * @returns svg & id obj
     */
    async createImageCaptcha(captcha: ImageCaptchaDto): Promise<ResultData> {
        // 测试模式下返回固定的验证码数据
        if (TestModeDetector.isTestMode()) {
            const testResult = {
                img: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjUwIj48dGV4dCB4PSI1MCIgeT0iMjUiPjExMTE8L3RleHQ+PC9zdmc+",
                id: "test-captcha-id",
            };

            // 即使在测试模式下也存储验证码，以保持一致性
            const expires = Date.now() + 5 * 60 * 1000;
            this.captchaStore.set(testResult.id, { code: "1111", expires });

            console.log("🧪 测试模式: 返回固定验证码数据");
            return ResultData.ok(testResult);
        }

        // 生产模式下的正常验证码生成逻辑
        const svg = svgCaptcha.create({
            size: 4,
            color: true,
            noise: 4,
            width: Boolean(captcha.width) ? 100 : captcha.width,
            height: Boolean(captcha.height) ? 50 : captcha.height,
            charPreset: "1234567890",
        });
        const result = {
            img: `data:image/svg+xml;base64,${Buffer.from(svg.data).toString("base64")}`,
            id: uuidv4(),
        };
        // 5分钟过期时间，存储到内存
        const expires = Date.now() + 5 * 60 * 1000;
        this.captchaStore.set(result.id, { code: svg.text, expires });

        // 清理过期的验证码
        this.cleanExpiredCaptchas();

        return ResultData.ok(result);
    }

    /**
     * 校验验证码
     * 在开发环境和测试模式下自动绕过验证码验证
     * 注意：captchaId 不能为空的校验在 DTO 层面已经处理
     */
    async checkImgCaptcha(id: string, code: string): Promise<boolean> {
        // 开发环境直接通过（不校验验证码内容，但 captchaId 必须存在）
        if (process.env.NODE_ENV === "development") {
            console.log("🔧 开发模式: 跳过验证码校验");
            return true;
        }

        // 测试模式下绕过验证码验证
        if (TestModeDetector.shouldBypassCaptcha()) {
            console.log("🧪 测试模式: 绕过验证码验证");
            return true;
        }

        // 生产模式下的正常验证码验证逻辑
        const captchaData = this.captchaStore.get(id);
        if (!captchaData) {
            return false;
        }

        // 检查是否过期
        if (Date.now() > captchaData.expires) {
            this.captchaStore.delete(id);
            return false;
        }

        // 验证码码
        if (captchaData.code === code) {
            // 校验成功后移除验证码
            this.captchaStore.delete(id);
            return true;
        }

        return false;
    }

    /**
     * 清理过期的验证码
     */
    private cleanExpiredCaptchas(): void {
        const now = Date.now();
        for (const [id, data] of this.captchaStore.entries()) {
            if (now > data.expires) {
                this.captchaStore.delete(id);
            }
        }
    }
}

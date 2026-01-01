import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * 敏感词验证类型
 */
export type SensitiveWordType = "character" | "guild";

/**
 * 验证服务
 * 提供敏感词检测等验证功能
 */
@Injectable()
export class ValidationService {
    private readonly logger = new Logger(ValidationService.name);
    private readonly sensitiveWordApiUrl: string;
    private readonly sensitiveWordApiKey: string;
    private readonly sensitiveWordEnabled: boolean;

    constructor(private readonly configService: ConfigService) {
        this.sensitiveWordApiUrl = this.configService.get<string>("SENSITIVE_WORD_API_URL", "");
        this.sensitiveWordApiKey = this.configService.get<string>("SENSITIVE_WORD_API_KEY", "");
        this.sensitiveWordEnabled = this.configService.get<boolean>("SENSITIVE_WORD_ENABLED", false);
    }

    /**
     * 检查文本是否包含敏感词
     * @param text 要检查的文本
     * @param type 验证类型
     * @returns true 表示包含敏感词，false 表示不包含
     */
    async checkSensitiveWord(text: string, type: SensitiveWordType): Promise<boolean> {
        if (!this.sensitiveWordEnabled) {
            this.logger.debug("敏感词检测未启用");
            return false;
        }

        if (!text || typeof text !== "string") {
            return false;
        }

        if (!this.sensitiveWordApiUrl || !this.sensitiveWordApiKey) {
            this.logger.warn("敏感词检测配置不完整，跳过检测");
            return false;
        }

        try {
            // TODO: 实现实际的敏感词检测 API 调用
            // 这里需要根据实际使用的敏感词检测服务（如网易易盾）来实现
            this.logger.debug(`检查敏感词: text=${text}, type=${type}`);

            // 示例实现（需要替换为实际的 API 调用）
            // const response = await fetch(this.sensitiveWordApiUrl, {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         'Authorization': `Bearer ${this.sensitiveWordApiKey}`
            //     },
            //     body: JSON.stringify({ text, type })
            // });
            // const result = await response.json();
            // return result.hasSensitiveWord;

            return false; // 默认返回无敏感词
        } catch (error) {
            this.logger.error(`敏感词检测失败: ${error.message}`, error.stack);
            // 检测失败时，为了不影响用户体验，返回 false（允许通过）
            return false;
        }
    }
}

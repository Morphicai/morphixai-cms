import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { ResultData } from "../../shared/utils/result";
import { AssistAction } from "./dto/assist.dto";

/**
 * 智能辅助服务。只调一个 OpenAI 兼容的 chat/completions 端点，
 * 为一个 POST 引 openai SDK 不值当（还多一个要跟着升的依赖），原生 fetch 就够。
 * baseUrl/model/apiKey 全部来自配置层的环境变量展开，仓库里不落任何密钥。
 */
@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);

    constructor(private readonly config: ConfigService) {}

    private prompts: Record<AssistAction, string> = {
        summary: "为下面的文章生成一段中文摘要，150 字以内，只输出摘要本身：",
        polish: "润色下面的中文内容：修正语病、让表达更通顺，保持原意与篇幅相当，只输出润色结果：",
        continue: "顺着下面内容的风格和主题继续往下写一到两段，只输出续写部分：",
    };

    async assist(action: AssistAction, text: string): Promise<ResultData> {
        const baseUrl = this.config.get<string>("ai.baseUrl");
        const model = this.config.get<string>("ai.model");
        const apiKey = this.config.get<string>("ai.apiKey");

        if (!baseUrl || !model || !apiKey) {
            // 配置缺失是部署问题不是运行错误,给运维一句能看懂的话,别抛 500 堆栈
            return ResultData.fail(500, "模型服务未配置（需要 AI_BASE_URL / AI_MODEL / 模型密钥环境变量）");
        }

        try {
            const resp = await fetch(`${baseUrl}/chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model,
                    messages: [{ role: "user", content: `${this.prompts[action]}\n\n${text}` }],
                }),
                signal: AbortSignal.timeout(60000),
            });

            if (!resp.ok) {
                const body = await resp.text();
                this.logger.warn(`模型调用失败 http=${resp.status}: ${body.slice(0, 200)}`);
                return ResultData.fail(502, "模型服务调用失败，请稍后重试");
            }

            const data: any = await resp.json();
            const content = data?.choices?.[0]?.message?.content;
            if (!content) {
                this.logger.warn(`模型返回无内容: ${JSON.stringify(data).slice(0, 200)}`);
                return ResultData.fail(502, "模型返回为空，请重试");
            }
            return ResultData.ok({ action, result: String(content).trim() });
        } catch (e: any) {
            this.logger.warn(`模型调用异常: ${e?.message}`);
            return ResultData.fail(502, "模型服务连接失败，请稍后重试");
        }
    }
}

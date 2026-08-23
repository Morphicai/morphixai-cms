/**
 * 单次任务执行:pi-agent-core 的 Agent 就是循环本体,这里只做三件事——
 * 组装(model/tools/systemPrompt)、事件收集成可回放轨迹、工具调用上限熔断。
 * 多 Agent 编排阶段把这里换成 agent-framework 的 AgentInstance,
 * HTTP 面与工具/模型接线都不动。
 */
import { Agent } from "@earendil-works/pi-agent-core";
import { streamSimple } from "@earendil-works/pi-ai/compat";
import { buildModel, getApiKey, MAX_OUTPUT_TOKENS } from "./model.js";
import { buildTools, loadToolDefs } from "./tools.js";

const MAX_TOOL_CALLS = 12;
const RUN_TIMEOUT_MS = 5 * 60_000;

export interface RunStep {
    type: "thought" | "tool_call" | "tool_result" | "error";
    text?: string;
    tool?: string;
    args?: unknown;
}

export interface RunResult {
    status: "success" | "max_steps" | "failed";
    result: string;
    steps: RunStep[];
    durationMs: number;
    toolCalls: number;
}

/**
 * 基座默认 prompt 只有通用执行原则——"运营助理""翻译语气"这类业务人格
 * 不属于基础能力,由调用方经 /run 的 system 字段注入。
 */
const BASE_PROMPT = [
    "你通过调用工具完成交给你的任务。",
    "原则:",
    "- 先用查询类工具了解现状,再做写入;不确定就再查,不要凭空猜数据",
    "- 工具报错时读错误信息调整策略,同样的失败调用不要原样重试",
    "- 全部完成后,用一段简短中文总结你做了什么",
].join("\n");

/** 截断工具结果,轨迹是给人看的,不是数据备份 */
const clip = (s: string, n = 2000) => (s.length > n ? `${s.slice(0, n)}…(截断,共${s.length}字符)` : s);

export async function runTask(task: string, token: string, system?: string): Promise<RunResult> {
    const started = Date.now();
    const steps: RunStep[] = [];
    let toolCalls = 0;
    let aborted: "max_steps" | "timeout" | null = null;

    // 工具定义每次 run 现拉:注册表改了立即生效,基座进程不用重启
    const toolDefs = await loadToolDefs(token);
    if (toolDefs.length === 0) {
        return {
            status: "failed",
            result: "agent-tools 集合里没有可用的工具定义,先在管理后台注册工具",
            steps: [],
            durationMs: Date.now() - started,
            toolCalls: 0,
        };
    }

    const agent = new Agent({
        getApiKey: () => getApiKey(),
        // 见 model.ts 注释第 3 条:输出预算必须在 stream options 显式给
        streamFn: (model, context, options) =>
            streamSimple(model, context, { ...options, maxTokens: MAX_OUTPUT_TOKENS }),
        initialState: {
            // 调用方注入的业务人格拼在通用原则之后
            systemPrompt: system?.trim() ? `${BASE_PROMPT}\n\n${system.trim()}` : BASE_PROMPT,
            model: buildModel(),
            thinkingLevel: "off",
        },
    });
    agent.state.tools = buildTools(toolDefs, token);

    agent.subscribe((event: any) => {
        // 事件形状随 pi 版本演进,防御性读取:认识的抽结构,不认识的忽略
        if (event?.type === "message_end" && event.message?.role === "assistant") {
            for (const block of event.message.content ?? []) {
                if (block?.type === "text" && block.text?.trim()) {
                    steps.push({ type: "thought", text: block.text.trim() });
                } else if (block?.type === "toolCall") {
                    toolCalls += 1;
                    steps.push({ type: "tool_call", tool: block.name, args: block.arguments });
                    if (toolCalls >= MAX_TOOL_CALLS) {
                        aborted = "max_steps";
                        agent.abort();
                    }
                }
            }
        } else if (event?.type === "tool_execution_end") {
            const content = event.result?.content ?? [];
            const textPart = content
                .filter((c: any) => c?.type === "text")
                .map((c: any) => c.text)
                .join("\n");
            steps.push({
                type: event.isError ? "error" : "tool_result",
                tool: event.toolName,
                text: clip(textPart || (event.isError ? "工具执行失败" : "")),
            });
        }
    });

    const timeout = setTimeout(() => {
        aborted = aborted ?? "timeout";
        agent.abort();
    }, RUN_TIMEOUT_MS);

    try {
        await agent.prompt(task);
        await agent.waitForIdle();
    } catch (e: any) {
        steps.push({ type: "error", text: String(e?.message ?? e) });
    } finally {
        clearTimeout(timeout);
    }

    // 最终结论 = 最后一段 assistant 文本
    const lastThought = [...steps].reverse().find((s) => s.type === "thought");
    const errorMsg = agent.state.errorMessage;
    const status: RunResult["status"] = aborted === "max_steps"
        ? "max_steps"
        : errorMsg || aborted === "timeout"
            ? "failed"
            : "success";

    return {
        status,
        result: lastThought?.text ?? errorMsg ?? "(无结论)",
        steps,
        durationMs: Date.now() - started,
        toolCalls,
    };
}

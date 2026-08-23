/**
 * Agent 工具注册表——业务模块声明"我贡献哪些工具给 Agent"的地方。
 *
 * 工具是代码不是数据:声明写在贡献它的业务模块目录里(i18n 的工具跟着 i18n 走),
 * 与实现同库同版本、过 code review。这里只是聚合点,一个模块级静态数组,
 * 不需要 DI——工具清单在编译期就定了,运行时不变。
 *
 * agent-service 经 GET /system/agent/tools 拉取本清单;执行时按 method+path
 * 直接调对应业务端点(token 透传,@Perm 原样生效)。path 是平台 API 的相对路径。
 */
export interface AgentToolParam {
    key: string;
    type: "string" | "number" | "boolean";
    required?: boolean;
    description?: string;
}

export interface AgentToolContribution {
    name: string;
    description: string;
    params: AgentToolParam[];
    method: "GET" | "POST" | "PUT" | "DELETE";
    /** 平台 API 相对路径模板,{param} 占位;GET 参数写进模板,写方法的剩余参数进 body */
    path: string;
}

const registry: AgentToolContribution[] = [];

export function contributeAgentTools(tools: AgentToolContribution[]): void {
    for (const t of tools) {
        if (registry.some((r) => r.name === t.name)) {
            // 重名是编码错误,启动即炸好过运行时行为诡异
            throw new Error(`Agent 工具重名: ${t.name}`);
        }
        registry.push(t);
    }
}

export function listAgentTools(): AgentToolContribution[] {
    return [...registry];
}

/**
 * 声明式工具执行器——基座只提供"让工具跑起来"的机制,不含任何业务。
 *
 * 工具定义是**数据**,存在平台的 agent-tools 数据集合里(private,管理后台可编辑):
 *   { name, description, params: [{key,type,required,description}],
 *     method, path: "/system/i18n/missing?namespace={namespace}&locale={locale}" }
 * 加一个工具 = 在管理后台加一行数据,业务逻辑住在业务服务的 HTTP 端点里,
 * 这个进程永远不用为新业务改代码。
 *
 * 安全边界:
 * - path 必须是以 "/" 开头的相对路径,base 永远钉在 OPTIMUS_API_URL——
 *   工具只能打平台 API,集合数据被改也造不出 SSRF
 * - 请求透传发起人 token:Agent 以发起人身份行动,权限即发起人权限,
 *   @Perm 原样生效,不存在 service 账号也就造不出越权
 * - execute 抛错即可,pi-agent-core 会把错误回填给模型让它换策略
 */
import { Type, type TSchema } from "typebox";
import type { AgentTool, AgentToolResult } from "@earendil-works/pi-agent-core";

const API_BASE = (process.env.OPTIMUS_API_URL || "http://localhost:8084/api").replace(/\/$/, "");
const TOOLS_COLLECTION = "agent-tools";

export interface ToolParamDef {
    key: string;
    type: "string" | "number" | "boolean";
    required?: boolean;
    description?: string;
}

export interface ToolDef {
    name: string;
    description: string;
    params: ToolParamDef[];
    method: "GET" | "POST" | "PUT" | "DELETE";
    /** 相对路径模板,{param} 占位;GET 的参数写进模板,写方法的剩余参数进 body */
    path: string;
}

async function callApi(token: string, method: string, path: string, body?: unknown): Promise<unknown> {
    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: { "Content-Type": "application/json", Authorization: token },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
    });
    const json: any = await res.json().catch(() => null);
    if (!res.ok || (json && json.code !== 200)) {
        throw new Error(`API ${method} ${path} 失败: ${json?.msg || res.status}`);
    }
    return json?.data;
}

/** 从平台数据集合拉工具定义(发起人 token——读注册表本身也要权限) */
export async function loadToolDefs(token: string): Promise<ToolDef[]> {
    const data: any = await callApi(
        token,
        "GET",
        `/system/dictionary?collection=${TOOLS_COLLECTION}&page=1&pageSize=100`,
    );
    const rows: any[] = data?.list ?? data?.items ?? [];
    const defs: ToolDef[] = [];
    for (const row of rows) {
        const v = row?.value;
        if (!v?.name || !v?.description || !v?.path || !v?.method) continue; // 残缺定义直接跳过
        if (!/^[a-z][a-z0-9_]{1,63}$/.test(v.name)) continue;
        if (!String(v.path).startsWith("/") || String(v.path).includes("://")) continue; // 只许相对路径
        defs.push({
            name: v.name,
            description: v.description,
            params: Array.isArray(v.params) ? v.params : [],
            method: v.method,
            path: v.path,
        });
    }
    return defs;
}

const text = (s: string): AgentToolResult<undefined> => ({
    content: [{ type: "text", text: s }],
    details: undefined,
});

function paramsSchema(params: ToolParamDef[]): TSchema {
    const props: Record<string, TSchema> = {};
    const required: string[] = [];
    for (const p of params) {
        const base =
            p.type === "number" ? Type.Number({ description: p.description })
            : p.type === "boolean" ? Type.Boolean({ description: p.description })
            : Type.String({ description: p.description });
        props[p.key] = p.required ? base : Type.Optional(base);
        if (p.required) required.push(p.key);
    }
    return Type.Object(props);
}

/** 把一条定义变成可执行工具:模板替换消费的参数进 URL,剩余参数进 body(写方法) */
function buildTool(def: ToolDef, token: string): AgentTool<any> {
    return {
        name: def.name,
        label: def.name,
        description: def.description,
        parameters: paramsSchema(def.params) as any,
        execute: async (_id, args: Record<string, unknown>) => {
            const consumed = new Set<string>();
            const path = def.path.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
                consumed.add(key);
                const v = args?.[key];
                return encodeURIComponent(v === undefined || v === null ? "" : String(v));
            });
            let body: Record<string, unknown> | undefined;
            if (def.method !== "GET") {
                body = {};
                for (const [k, v] of Object.entries(args ?? {})) {
                    if (!consumed.has(k) && v !== undefined) body[k] = v;
                }
            }
            const data = await callApi(token, def.method, path, body);
            return text(typeof data === "string" ? data : JSON.stringify(data ?? null));
        },
    };
}

export function buildTools(defs: ToolDef[], token: string): AgentTool<any>[] {
    return defs.map((d) => buildTool(d, token));
}

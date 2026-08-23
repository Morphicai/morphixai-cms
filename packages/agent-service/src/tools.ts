/**
 * 工具执行器——基座只提供"让工具跑起来"的机制,不含任何业务。
 *
 * 工具是**业务方的代码**:业务服务在自己的代码里声明贡献哪些工具
 * (声明与实现同库同版本、过 code review),经工具提供方端点聚合暴露:
 *   GET {provider}/system/agent/tools →
 *   [{ name, description, params: [{key,type,required,description}], method, path }]
 * 基座每次 run 从 TOOL_PROVIDER_URLS(默认 optimus-api)拉清单并执行。
 * 业务加工具 = 业务代码里注册一条声明 + 一个端点,基座永远不用改。
 *
 * 安全边界:
 * - path 必须是以 "/" 开头的相对路径,base 永远钉在 OPTIMUS_API_URL——
 *   工具只能打平台 API,provider 返回的定义再离谱也造不出 SSRF
 * - 请求透传发起人 token:Agent 以发起人身份行动,权限即发起人权限,
 *   @Perm 原样生效,不存在 service 账号也就造不出越权
 * - execute 抛错即可,pi-agent-core 会把错误回填给模型让它换策略
 */
import { Type, type TSchema } from "typebox";
import type { AgentTool, AgentToolResult } from "@earendil-works/pi-agent-core";

const API_BASE = (process.env.OPTIMUS_API_URL || "http://localhost:8084/api").replace(/\/$/, "");
/** 工具提供方端点,逗号分隔;将来业务方自己的服务也可以加进来 */
const PROVIDER_URLS = (process.env.TOOL_PROVIDER_URLS || `${API_BASE}/system/agent/tools`)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

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

/** 从各工具提供方端点拉工具清单(发起人 token——读注册表本身也过权限门) */
export async function loadToolDefs(token: string): Promise<ToolDef[]> {
    const defs: ToolDef[] = [];
    const seen = new Set<string>();
    for (const url of PROVIDER_URLS) {
        const res = await fetch(url, {
            headers: { Authorization: token },
            signal: AbortSignal.timeout(10000),
        });
        const json: any = await res.json().catch(() => null);
        if (!res.ok || json?.code !== 200) {
            throw new Error(`工具提供方不可达: ${url} (${json?.msg || res.status})`);
        }
        for (const v of json.data ?? []) {
            if (!v?.name || !v?.description || !v?.path || !v?.method) continue; // 残缺定义直接跳过
            if (!/^[a-z][a-z0-9_]{1,63}$/.test(v.name) || seen.has(v.name)) continue;
            if (!String(v.path).startsWith("/") || String(v.path).includes("://")) continue; // 只许相对路径
            seen.add(v.name);
            defs.push({
                name: v.name,
                description: v.description,
                params: Array.isArray(v.params) ? v.params : [],
                method: v.method,
                path: v.path,
            });
        }
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

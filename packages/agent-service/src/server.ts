/**
 * agent-service 的 HTTP 面。独立进程(8087),与 optimus-api 互不拖累。
 * 鉴权吃自己的狗粮:@optimus/server-sdk introspect——本服务就是
 * "外部团队后端接入平台"范式的第一个真实消费者。
 */
import express from "express";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
// server-sdk 是 CommonJS 包,ESM import CJS 没问题
import { OptimusServerSdk } from "@optimus/server-sdk";
import { runTask } from "./runner.js";
import { loadToolDefs } from "./tools.js";

const PORT = Number(process.env.AGENT_SERVICE_PORT || 8087);
const API_BASE = process.env.OPTIMUS_API_URL || "http://localhost:8084/api";
const RUNS_DIR = join(dirname(fileURLToPath(import.meta.url)), "../runs");

const sdk = new OptimusServerSdk({ baseUrl: API_BASE });
const app = express();
app.use(express.json({ limit: "64kb" }));

/** 鉴权:token 有效且持有 AgentConsole(或超管通配) */
async function authorize(req: express.Request): Promise<{ ok: boolean; token: string; user?: string }> {
    const token = String(req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
    if (!token) return { ok: false, token: "" };
    try {
        const r = await sdk.introspect(token, "admin");
        if (!r.active || !Array.isArray(r.perms)) return { ok: false, token };
        const ok = r.perms.includes("*") || r.perms.includes("AgentConsole");
        return { ok, token, user: String((r.user as any)?.account ?? "") };
    } catch {
        // introspect 打不通(平台侧故障)按拒绝处理,不放行
        return { ok: false, token };
    }
}

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/tools", async (req, res) => {
    const auth = await authorize(req);
    if (!auth.ok) return res.status(401).json({ code: 401, msg: "未授权" });
    // 工具清单直接回注册表定义(不含执行细节),给控制台展示"它能干什么"
    try {
        const defs = await loadToolDefs(`Bearer ${auth.token}`);
        res.json({ code: 200, data: defs.map((d) => ({ name: d.name, description: d.description, params: d.params })) });
    } catch (e: any) {
        res.status(502).json({ code: 502, msg: `读取工具注册表失败: ${e?.message ?? e}` });
    }
});

app.post("/run", async (req, res) => {
    const auth = await authorize(req);
    if (!auth.ok) return res.status(401).json({ code: 401, msg: "未授权" });
    const task = String(req.body?.task ?? "").trim();
    if (!task) return res.status(400).json({ code: 400, msg: "task 不能为空" });
    if (task.length > 2000) return res.status(400).json({ code: 400, msg: "task 最长 2000 字" });
    // 业务人格由调用方注入,基座不预设"你是谁"
    const system = String(req.body?.system ?? "").slice(0, 2000);

    // 工具透传发起人 token(注意:runner 里拿到的是裸 token,拼回 Bearer)
    const result = await runTask(task, `Bearer ${auth.token}`, system);

    // 审计留痕:一行一 run,轨迹是给人看的所以已在 runner 里截断过
    const record = { at: new Date().toISOString(), by: auth.user, task, ...result };
    try {
        await mkdir(RUNS_DIR, { recursive: true });
        await appendFile(join(RUNS_DIR, `${record.at.slice(0, 10)}.jsonl`), JSON.stringify(record) + "\n");
    } catch { /* 留痕失败不影响返回 */ }

    res.json({ code: 200, data: record });
});

app.get("/runs", async (req, res) => {
    const auth = await authorize(req);
    if (!auth.ok) return res.status(401).json({ code: 401, msg: "未授权" });
    // 读今天与昨天的 jsonl,最多返回最近 50 条——审计场景翻文件即可,不上库
    const days = [0, 1].map((d) => {
        const t = new Date(Date.now() - d * 86400_000);
        return t.toISOString().slice(0, 10);
    });
    const records: unknown[] = [];
    for (const day of days) {
        try {
            const content = await readFile(join(RUNS_DIR, `${day}.jsonl`), "utf8");
            for (const line of content.split("\n")) {
                if (line.trim()) records.push(JSON.parse(line));
            }
        } catch { /* 当天没文件很正常 */ }
    }
    records.reverse();
    res.json({ code: 200, data: records.slice(0, 50) });
});

app.listen(PORT, () => {
    console.log(`agent-service listening on http://localhost:${PORT}`);
    if (!process.env.ONEROUTER_API_KEY) {
        console.warn("[warn] ONEROUTER_API_KEY 未注入,/run 会在模型调用处失败");
    }
});

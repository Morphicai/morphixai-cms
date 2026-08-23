/**
 * demo-activity 的零依赖静态服务器:服务本目录的 index.html,
 * 并把 @optimus/admin-embed 的 UMD 文件映射成 /admin-embed.js——
 * 示例不复制 SDK 文件,永远用包里的最新版。
 * 起法: node serve.mjs  (默认 5190)
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 5190);

const routes = {
    "/": { file: join(here, "index.html"), type: "text/html; charset=utf-8" },
    "/index.html": { file: join(here, "index.html"), type: "text/html; charset=utf-8" },
    "/admin-embed.js": {
        file: join(here, "../../packages/admin-embed/index.js"),
        type: "application/javascript; charset=utf-8",
    },
};

createServer(async (req, res) => {
    const route = routes[new URL(req.url, "http://x").pathname];
    if (!route) {
        res.writeHead(404).end("not found");
        return;
    }
    try {
        const body = await readFile(route.file);
        res.writeHead(200, { "Content-Type": route.type }).end(body);
    } catch (e) {
        res.writeHead(500).end(String(e));
    }
}).listen(PORT, () => console.log(`demo-activity: http://localhost:${PORT}`));

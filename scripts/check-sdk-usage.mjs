#!/usr/bin/env node
/**
 * 架构约束检查。两条规则，都来自 partner-service 拆分时真实踩过的坑：
 *
 * 1. **裸写 HTTP 调平台接口** —— `@optimus/server-sdk` 早就写好了 introspect 封装，
 *    partner-service 接入时还是自己重写了一份裸 fetch；`optimus-api-client.ts`
 *    是同一个故事。文档里写"要复用"不够，下一个新服务大概率还会再发明一次轮子
 * 2. **跨业务域 `@InjectRepository` 别人的 entity** —— 同一个服务里能跑，一旦分属
 *    不同仓库/进程，**编译期直接断**。partner 至今还在注入 points-engine 的
 *    `TaskCompletionLogEntity`，它就是这条规则的样本
 *
 * 刻意只做正则 + 路径解析，不做 AST 分析（见 platform-client-sdk/design.md）：目标是让
 * "顺手写错"付出代价，不是构筑一道防线。真想绕过 lint 的人总能绕过；规则的
 * 价值在于让正确的做法成为默认路径。
 *
 * **没覆盖的第三条**：原生 SQL 跨表 JOIN 别人的表（`reward-claim-record` 对
 * `activity`）要 SQL 级分析，仍然靠评审。别把"有检查"读成"三条都拦住了"。
 *
 * 用法：
 *   node scripts/check-sdk-usage.mjs                # 只查相对 base 的新增行
 *   node scripts/check-sdk-usage.mjs --base=<ref>   # 指定 base
 *   node scripts/check-sdk-usage.mjs --all          # 全量扫描（体检用，会报出存量债）
 *
 * 单行豁免：在该行或上一行写 `sdk-usage-allow: <原因>`。
 * 要求写原因是有意的——没有豁免口，人只会整个关掉检查。
 */
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { join, relative, extname, dirname, posix } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

/** 已被官方 SDK 覆盖的平台接口。命中即说明该走 SDK */
const RULES = [
    {
        pattern: /\/auth\/introspect/,
        endpoint: "POST /auth/introspect",
        use: "@optimus/server-sdk 的 introspect() / verifyServiceToken()",
    },
    {
        pattern: /\/files\/client-upload/,
        endpoint: "POST /files/client-upload",
        use: "@optimus/platform-client 的 uploadFile()",
    },
    {
        pattern: /\/system\/short-link\/client-shorten/,
        endpoint: "POST /system/short-link/client-shorten",
        use: "@optimus/platform-client 的 createShortLink()",
    },
    {
        pattern: /\/service\/user-profile\//,
        endpoint: "GET /service/user-profile/{basic,full}/:userId",
        use: "@optimus/platform-client 的 getUserProfileBasic() / getUserProfileFull()",
    },
];

/**
 * 不在扫描范围内的路径。
 *
 * 判据是"这段代码是不是平台自己"，不是分层：
 * - optimus-api 定义这些路由，platform-client/server-sdk 是被认可的那份实现
 * - client-sdk / optimus-ui / optimus-next 是平台自己交付的接入层，浏览器侧
 *   本来就要发 HTTP，且与平台同属一个团队，不存在跨团队契约问题
 *
 * **反过来说，没列在这里的包一律在范围内**——新拆的业务服务自动被覆盖，
 * 不需要谁记得回来加一行。
 */
const OUT_OF_SCOPE = [
    "packages/optimus-api/",
    "packages/platform-client/",
    "packages/server-sdk/",
    "packages/client-sdk/",
    "packages/optimus-ui/",
    "packages/optimus-next/",
    "scripts/check-sdk-usage.mjs",
];

const SKIP_DIRS = new Set(["node_modules", "dist", "build", ".next", ".git", "coverage", "openspec"]);
const CODE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const ALLOW_MARK = /sdk-usage-allow\s*:/;

const args = process.argv.slice(2);
const scanAll = args.includes("--all");
const baseArg = args.find((a) => a.startsWith("--base="))?.slice("--base=".length);

function git(cmdArgs) {
    return execFileSync("git", cmdArgs, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

function refExists(ref) {
    // 全零 sha 是 GitHub 在"新建分支/首次推送"时给的 before 值，不是有效 ref
    if (!ref || /^0{7,40}$/.test(ref)) return false;
    try {
        git(["rev-parse", "--verify", "--quiet", ref]);
        return true;
    } catch {
        return false;
    }
}

function inScope(path) {
    if (!CODE_EXT.has(extname(path))) return false;
    return !OUT_OF_SCOPE.some((prefix) => path === prefix || path.startsWith(prefix));
}

/** 命中的行是否带豁免标记（本行或上一行） */
function isAllowed(lines, index) {
    return ALLOW_MARK.test(lines[index] ?? "") || ALLOW_MARK.test(lines[index - 1] ?? "");
}

function findings(path, lines, lineNumbers) {
    const hits = [];
    for (const lineNo of lineNumbers) {
        const text = lines[lineNo - 1];
        if (text === undefined) continue;
        for (const rule of RULES) {
            if (!rule.pattern.test(text)) continue;
            if (isAllowed(lines, lineNo - 1)) continue;
            hits.push({ path, lineNo, text: text.trim(), rule });
        }
    }
    hits.push(...crossDomainInjections(path, lines, lineNumbers));
    return hits;
}

/** `packages/<pkg>/src/business/<domain>/…` → `<domain>`；不在业务域下则无从归属 */
function ownDomain(path) {
    return /(?:^|\/)src\/business\/([^/]+)\//.exec(path)?.[1];
}

/**
 * 规则 2：跨业务域注入别人的 entity。
 *
 * 判据是 import 的来源路径落在**另一个** `business/<domain>/` 下——
 * 同域的 `./entities/x` 不算，跨域的 `../points-engine/entities/x` 算。
 * import 映射从整份源码建（要兼容多行 import），但只检查被要求检查的那些行。
 */
function crossDomainInjections(path, lines, lineNumbers) {
    const own = ownDomain(path);
    if (!own) return [];

    const source = lines.join("\n");
    const importedFrom = new Map();
    const importRe = /import\s+(?:type\s+)?\{([\s\S]*?)\}\s*from\s*["']([^"']+)["']/g;
    for (let m = importRe.exec(source); m; m = importRe.exec(source)) {
        for (const raw of m[1].split(",")) {
            const symbol = raw.trim().split(/\s+as\s+/)[0].replace(/^type\s+/, "").trim();
            if (symbol) importedFrom.set(symbol, m[2]);
        }
    }

    const wanted = new Set(lineNumbers);
    const hits = [];
    for (let i = 0; i < lines.length; i += 1) {
        if (!wanted.has(i + 1)) continue;
        const name = /@InjectRepository\(\s*([A-Za-z0-9_$]+)/.exec(lines[i])?.[1];
        if (!name) continue;
        const spec = importedFrom.get(name);
        // 相对路径之外（包名、路径别名）无法在这里可靠归属，交给评审
        if (!spec || !spec.startsWith(".")) continue;
        const resolved = posix.normalize(posix.join(dirname(path), spec));
        const other = /(?:^|\/)business\/([^/]+)\//.exec(resolved)?.[1];
        if (!other || other === own) continue;
        if (isAllowed(lines, i)) continue;
        hits.push({
            path,
            lineNo: i + 1,
            text: lines[i].trim(),
            rule: {
                endpoint: `跨业务域注入 ${name}（${own} → ${other}）`,
                use: `${other} 暴露的 HTTP 接口；同进程时能跑，拆开就是编译期断裂`,
            },
        });
    }
    return hits;
}

function walk(dir, out = []) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith(".") && entry.name !== ".github") continue;
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            if (SKIP_DIRS.has(entry.name)) continue;
            walk(full, out);
        } else if (entry.isFile()) {
            out.push(relative(ROOT, full));
        }
    }
    return out;
}

/** 全量扫描：每个在范围内的文件的每一行 */
function scanWholeTree() {
    const hits = [];
    for (const path of walk(ROOT)) {
        if (!inScope(path)) continue;
        const full = join(ROOT, path);
        if (!existsSync(full) || !statSync(full).isFile()) continue;
        const lines = readFileSync(full, "utf8").split("\n");
        hits.push(...findings(path, lines, lines.map((_, i) => i + 1)));
    }
    return hits;
}

/**
 * 增量扫描：只看 diff 里的**新增行**。
 * 存量违规（partner-service 的 optimus-api-client.ts、zone-activity 的 api.ts）
 * 只要没被改动就不会出现在 diff 里——堵新增和清存量是两件事，混在一起会让
 * 规则上线当天就被整体关掉。
 */
function scanDiff(base) {
    const raw = git(["diff", "--unified=0", "--diff-filter=ACMR", `${base}...HEAD`]);
    const addedByFile = new Map();
    let current = null;
    let nextLine = 0;
    for (const line of raw.split("\n")) {
        if (line.startsWith("+++ b/")) {
            current = line.slice("+++ b/".length);
            if (!addedByFile.has(current)) addedByFile.set(current, []);
            continue;
        }
        const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
        if (hunk) {
            nextLine = Number(hunk[1]);
            continue;
        }
        if (line.startsWith("+") && !line.startsWith("+++")) {
            if (current) addedByFile.get(current).push(nextLine);
            nextLine += 1;
        }
    }

    const hits = [];
    for (const [path, lineNumbers] of addedByFile) {
        if (!inScope(path) || lineNumbers.length === 0) continue;
        const full = join(ROOT, path);
        // 文件在 diff 里但工作区已删除/改名，跳过——报一个不存在的位置没有意义
        if (!existsSync(full)) continue;
        hits.push(...findings(path, readFileSync(full, "utf8").split("\n"), lineNumbers));
    }
    return hits;
}

let mode;
let hits;
if (scanAll) {
    mode = "全量扫描";
    hits = scanWholeTree();
} else {
    const base = baseArg || process.env.SDK_USAGE_BASE || ["origin/main", "main"].find(refExists);
    if (!base || !refExists(base)) {
        // 定不出 base 就退回全量：宁可噪音大，也不要静默放行
        console.warn("⚠️  无法确定 diff base，退回全量扫描。指定 --base=<ref> 可只查新增行。\n");
        mode = "全量扫描（base 缺失）";
        hits = scanWholeTree();
    } else {
        mode = `增量扫描（base=${base}）`;
        hits = scanDiff(base);
    }
}

if (hits.length === 0) {
    console.log(`✅ 架构约束检查通过（${mode}）`);
    process.exit(0);
}

console.error(`❌ 发现 ${hits.length} 处架构约束违规（${mode}）\n`);
for (const { path, lineNo, text, rule } of hits) {
    console.error(`  ${path}:${lineNo}`);
    console.error(`    ${text}`);
    console.error(
        rule.pattern
            ? `    → ${rule.endpoint} 已被 SDK 覆盖，请改用 ${rule.use}`
            : `    → ${rule.endpoint}，请改走 ${rule.use}`,
    );
    console.error("");
}
console.error("确有必要绕过时，在该行或上一行注释 `sdk-usage-allow: <原因>`。");
process.exit(1);

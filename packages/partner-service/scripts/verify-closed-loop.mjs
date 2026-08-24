#!/usr/bin/env node
/**
 * partner-service 迁移闭环自动化验证脚本。
 *
 * 打的是真实跑着的 dev 实例(optimus-api:8084、optimus-next:8086 的 C 端代理、
 * partner-service:8089),不是 mock,也不是 optimus-api 自带的那套会自己拉起
 * 独立测试进程+隔离数据库的 e2e 框架(test/jest-e2e.json)——那套是单服务
 * 隔离测试,这里要验证的是"服务目录 + C 端代理分流 + introspect 鉴权"这套
 * 跨服务基建在真实多进程场景下是否真的接好了,用它反而验证不到点子上。
 *
 * 覆盖范围:
 *   A. C 端闭环,全程走 optimus-next 真实代理(不是直连 8089,证明
 *      apiPathPrefixes 分流生效):注册→登录→加入合伙人→查档案→查积分→
 *      提交外部任务
 *   B. 管理端闭环,直连 partner-service(embed 管理页本来就是同源直连,
 *      没有代理层要验证):合伙人列表→冻结→确认→解冻→确认、提交列表→
 *      审核通过→确认积分发放、dashboard 统计(曾经的 500 路径)
 *   C. 交叉验证:管理端审核通过后,C 端再查一次积分,确认账本是同一份
 *      (不是两边各算各的)
 *
 * 退出码 0 = 闭环确认,可以进 Group 6 删 optimus-api 原代码;
 * 非 0 = 有环节没打通,不能删,把失败项打印出来。
 *
 * 用法: node scripts/verify-closed-loop.mjs
 */
import mysql from "mysql2/promise";

const OPTIMUS_API = "http://localhost:8084/api";
const OPTIMUS_NEXT = "http://localhost:8086/api"; // C 端代理入口,不是直连
const PARTNER_SERVICE = "http://localhost:8089"; // 管理端直连(embed 页同源)

const DB_CONFIG = {
    host: "localhost",
    port: 3306,
    user: "root",
    password: "OptimusRoot2024Secure",
    database: "optimus",
};

const failures = [];
const ok = (label) => console.log(`  ✓ ${label}`);
const fail = (label, detail) => {
    failures.push(label);
    console.error(`  ✗ ${label}${detail ? ` — ${JSON.stringify(detail)}` : ""}`);
};
function assert(cond, label, detail) {
    if (cond) ok(label);
    else fail(label, detail);
    return cond;
}

async function json(res) {
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch {
        return { __rawText: text, __status: res.status };
    }
}

async function main() {
    const ts = Date.now();
    const username = `cl${ts.toString(36)}`; // register DTO 限制 username <= 20 字符
    const password = "Test123456!";
    let clientCookie = "";
    let adminToken = "";
    let partnerId = null;
    let submissionId = null;

    console.log("== A. C 端闭环(全程走 optimus-next:8086 真实代理) ==");

    // 注册
    {
        const res = await fetch(`${OPTIMUS_NEXT}/client-user/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });
        const body = await json(res);
        assert(body.code === 200, "注册成功", body);
    }

    // 登录,拿 cookie
    {
        const res = await fetch(`${OPTIMUS_NEXT}/client-user/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });
        const body = await json(res);
        assert(body.code === 200, "登录成功", body);
        const setCookie = res.headers.get("set-cookie") || "";
        clientCookie = setCookie
            .split(/,(?=[^;]+?=)/)
            .map((c) => c.split(";")[0])
            .join("; ");
        assert(clientCookie.includes("clientAccessToken"), "拿到 clientAccessToken cookie");
    }

    // 加入合伙人(经代理分流到 partner-service)
    {
        const res = await fetch(`${OPTIMUS_NEXT}/biz/partner/join`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: clientCookie },
            body: JSON.stringify({ teamName: "闭环验证队", userRegisterTime: ts }),
        });
        const body = await json(res);
        partnerId = body?.data?.partnerId;
        assert(body.code === 200 && !!partnerId, "join 经代理分流到 partner-service 成功", body);
        assert(body?.data?.userSource === "internal", "userSource 是 internal(不是历史遗留的 wemade)", body?.data);
    }

    // 查档案(经代理)
    {
        const res = await fetch(`${OPTIMUS_NEXT}/biz/partner/profile`, { headers: { Cookie: clientCookie } });
        const body = await json(res);
        assert(body.code === 200 && body?.data?.totalMira === "300", "profile 经代理返回正确的 totalMira(300,注册积分)", body);
    }

    // 查积分(经代理)
    {
        const res = await fetch(`${OPTIMUS_NEXT}/biz/points/me?includeDetail=true`, { headers: { Cookie: clientCookie } });
        const body = await json(res);
        assert(body.code === 200 && body?.data?.totalPoints === 300, "points/me 经代理返回正确的 totalPoints(300)", body);
    }

    // 提交外部任务(经代理)
    {
        const res = await fetch(`${OPTIMUS_NEXT}/external-task/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: clientCookie },
            body: JSON.stringify({
                taskType: "DOUYIN_SHORT_VIDEO",
                taskLink: "https://douyin.com/video/closedloop-test",
                proofImages: ["https://cdn.example.com/closedloop-test.jpg"],
                remark: "闭环自动化验证",
            }),
        });
        const body = await json(res);
        assert(body.code === 200 && body?.data?.status === "PENDING", "外部任务提交经代理成功,状态 PENDING", body);
    }

    console.log("== B. 管理端闭环(直连 partner-service:8089,embed 页同源) ==");

    // 管理员登录拿 token(走 optimus-api,dev 模式验证码不校验内容只要非空)
    {
        const res = await fetch(`${OPTIMUS_API}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ account: "admin", password: "admin123", captchaId: "x", verifyCode: "0000" }),
        });
        const body = await json(res);
        adminToken = body?.data?.accessToken;
        assert(body.code === 200 && !!adminToken, "管理员登录成功", body);
    }

    // 合伙人列表能查到刚才那条,且 L1/L2 下线数正确计算(曾经的原生 SQL 表前缀 bug)
    {
        const res = await fetch(`${PARTNER_SERVICE}/biz/partner/admin/partners?page=1&pageSize=100`, {
            headers: { Authorization: adminToken },
        });
        const body = await json(res);
        const row = body?.data?.items?.find((p) => p.partnerId === partnerId);
        assert(body.code === 200 && !!row, "合伙人列表直连返回数据且包含刚创建的合伙人", { found: !!row });
        assert(row?.totalL1 === 0 && row?.totalL2 === 0, "L1/L2 下线数正确计算(不再 500)", row);
    }

    // 冻结 → 确认 → 解冻 → 确认(曾经的审计表缺失 bug)
    {
        const freezeRes = await fetch(`${PARTNER_SERVICE}/biz/partner/admin/partners/${partnerId}/freeze`, {
            method: "PUT",
            headers: { Authorization: adminToken, "Content-Type": "application/json" },
            body: JSON.stringify({ reason: "闭环自动化验证-冻结" }),
        });
        assert((await json(freezeRes)).code === 200, "冻结请求成功(不再 500)");

        const detailRes = await fetch(`${PARTNER_SERVICE}/biz/partner/admin/partners/${partnerId}`, {
            headers: { Authorization: adminToken },
        });
        const detail = await json(detailRes);
        assert(detail?.data?.status === "frozen", "冻结后状态确认为 frozen", detail?.data);

        const unfreezeRes = await fetch(`${PARTNER_SERVICE}/biz/partner/admin/partners/${partnerId}/unfreeze`, {
            method: "PUT",
            headers: { Authorization: adminToken },
        });
        assert((await json(unfreezeRes)).code === 200, "解冻请求成功");

        const detailRes2 = await fetch(`${PARTNER_SERVICE}/biz/partner/admin/partners/${partnerId}`, {
            headers: { Authorization: adminToken },
        });
        const detail2 = await json(detailRes2);
        assert(detail2?.data?.status === "active", "解冻后状态确认为 active", detail2?.data);
    }

    // 审核通过 → 确认积分发放
    {
        const listRes = await fetch(
            `${PARTNER_SERVICE}/admin/external-task/submissions?page=1&pageSize=20&status=PENDING`,
            { headers: { Authorization: adminToken } },
        );
        const listBody = await json(listRes);
        const submission = (listBody?.data?.items || []).find((s) => s.partnerId === partnerId);
        submissionId = submission?.id;
        assert(!!submissionId, "找到刚提交的待审核记录", { found: !!submissionId });

        const approveRes = await fetch(`${PARTNER_SERVICE}/admin/external-task/submissions/${submissionId}/approve`, {
            method: "POST",
            headers: { Authorization: adminToken, "Content-Type": "application/json" },
            body: JSON.stringify({ reviewRemark: "闭环自动化验证-通过" }),
        });
        const approveBody = await json(approveRes);
        assert(approveBody.success === true && approveBody?.data?.pointsAwarded === 2000, "审核通过成功且发放 2000 积分", approveBody);
    }

    // dashboard(曾经的另一个 500 路径)
    {
        const res = await fetch(`${PARTNER_SERVICE}/biz/partner/admin/dashboard`, { headers: { Authorization: adminToken } });
        const body = await json(res);
        assert(
            body.code === 200 && typeof body?.data?.overview?.totalPartners === "number",
            "dashboard 统计接口正常返回(不再 500)",
            body?.data?.overview,
        );
    }

    console.log("== C. 交叉验证:管理端审核通过后,C 端账本是否同步更新 ==");
    {
        const res = await fetch(`${OPTIMUS_NEXT}/biz/points/me?includeDetail=true`, { headers: { Cookie: clientCookie } });
        const body = await json(res);
        assert(
            body.code === 200 && body?.data?.totalPoints === 2300,
            "C 端再查积分,总额正确累加为 2300(300 注册 + 2000 外部任务)",
            body?.data,
        );
        const hasExternalTask = (body?.data?.detail || []).some((d) => d.taskType === "EXTERNAL_TASK");
        assert(hasExternalTask, "积分明细里能看到 EXTERNAL_TASK 事件,证明是同一份账本,不是管理端各算各的");
    }

    console.log("== 清理测试数据 ==");
    const conn = await mysql.createConnection(DB_CONFIG);
    try {
        if (partnerId != null) {
            await conn.execute("DELETE FROM op_biz_partner_admin_log WHERE partner_id = ?", [partnerId]);
            await conn.execute("DELETE FROM op_biz_task_completion_log WHERE partner_id = ?", [partnerId]);
            await conn.execute("DELETE FROM op_biz_external_task_submission WHERE partner_id = ?", [partnerId]);
            await conn.execute("DELETE FROM op_biz_partner_profile WHERE partner_id = ?", [partnerId]);
        }
        await conn.execute("DELETE FROM op_biz_client_user WHERE username = ?", [username]);
        ok("测试数据已清理(client_user/partner_profile/external_task_submission/task_completion_log/partner_admin_log)");
    } finally {
        await conn.end();
    }

    console.log("");
    if (failures.length === 0) {
        console.log(`闭环验证全部通过(共 ${failures.length} 处失败)。可以进入 Group 6 删除 optimus-api 原代码。`);
        process.exit(0);
    } else {
        console.error(`闭环验证发现 ${failures.length} 处失败,不能删除 optimus-api 原代码:`);
        failures.forEach((f) => console.error(`  - ${f}`));
        process.exit(1);
    }
}

main().catch((err) => {
    console.error("脚本自身异常终止(不是业务断言失败,是脚本/网络层面的问题):", err);
    process.exit(2);
});

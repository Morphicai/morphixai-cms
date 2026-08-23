import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { introspectClient, writeSignup } from "../../../lib/api";

/**
 * 报名接口(zone 自己的后端逻辑):身份由服务端从 cookie 校验,
 * 前端只说"我要报名",userId/nickname 永远不信任客户端上报。
 * 路径在 basePath 下,浏览器实际请求 /activity/api/signup(同域,cookie 自动带)。
 */
export async function POST(req: Request) {
    const token = (await cookies()).get("clientAccessToken")?.value;
    const me = await introspectClient(token);
    if (!me.active || !me.user?.id) {
        return NextResponse.json({ code: 401, msg: "请先登录" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const activityId = String(body?.activityId ?? "").trim();
    if (!/^[a-z0-9-]{1,50}$/.test(activityId)) {
        return NextResponse.json({ code: 400, msg: "activityId 非法" }, { status: 400 });
    }

    const nickname = me.user.nickname || me.user.username || `用户${me.user.id}`;
    const result = await writeSignup(activityId, String(me.user.id), nickname);
    if (!result.ok) {
        return NextResponse.json({ code: 500, msg: result.msg }, { status: 500 });
    }
    return NextResponse.json({ code: 200, msg: result.msg || "报名成功", data: { nickname } });
}

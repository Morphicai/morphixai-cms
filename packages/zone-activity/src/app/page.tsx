import { cookies } from "next/headers";

/**
 * zone 首页(SSR)——同时是三件事的活证明:
 * 1. 独立应用:本页由 zone-activity(8088)渲染,用户经主站 /activity 同域到达
 * 2. 登录态无缝:C 端 cookie(clientAccessToken)经主 zone rewrite 同域直达,
 *    服务端拿它调 introspect 得身份——zone 侧零登录代码
 * 3. 基础能力直通:服务端直连平台 API 读公开数据集合
 */
const API = (process.env.OPTIMUS_API_URL || "http://localhost:8084/api").replace(/\/$/, "");

interface Identity {
    active: boolean;
    user?: { id?: string; username?: string; nickname?: string; email?: string };
}

async function whoAmI(): Promise<Identity> {
    const token = (await cookies()).get("clientAccessToken")?.value;
    if (!token) return { active: false };
    try {
        const res = await fetch(`${API}/auth/introspect`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, type: "client" }),
            cache: "no-store",
        });
        const json = await res.json();
        return json?.data ?? { active: false };
    } catch {
        return { active: false };
    }
}

async function loadFeatures(): Promise<Array<{ title?: string; fid?: string }>> {
    try {
        // 公开集合读口现状是双 api 前缀(存量路径瑕疵,公开接口硬化时统一)
        const res = await fetch(`${API}/api/dictionary/site-features`, { cache: "no-store" });
        const json = await res.json();
        return (json?.data?.items ?? []).map((i: any) => i.value);
    } catch {
        return [];
    }
}

const card: React.CSSProperties = {
    background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: "18px 22px",
};

export default async function ActivityHome() {
    const [me, features] = await Promise.all([whoAmI(), loadFeatures()]);

    return (
        <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px", display: "grid", gap: 16 }}>
            <div>
                <div style={{ fontSize: 12, letterSpacing: 2, color: "#B45309", fontWeight: 600 }}>ZONE · /activity</div>
                <h1 style={{ margin: "6px 0 4px", fontSize: 28 }}>活动中心</h1>
                <p style={{ margin: 0, color: "#6B7280", fontSize: 14 }}>
                    本页由独立应用 zone-activity 渲染(SSR),经主站同域路径到达——你看不出它换了应用,这就是 Multi-Zones。
                </p>
            </div>

            <section style={card}>
                <h2 style={{ margin: "0 0 8px", fontSize: 16 }}>① 登录态无缝直通</h2>
                {me.active ? (
                    <p style={{ margin: 0, fontSize: 14 }}>
                        已识别登录用户:<b>{me.user?.nickname || me.user?.username}</b>
                        <span style={{ color: "#6B7280" }}>(id: {me.user?.id})</span>
                        —— cookie 同域直达,本 zone 没有写过一行登录代码。
                    </p>
                ) : (
                    <p style={{ margin: 0, fontSize: 14, color: "#6B7280" }}>
                        当前未登录。去主站 <a href="/auth/login" style={{ color: "#B45309" }}>登录</a> 后回来,
                        本页将直接识别你的身份(同域 cookie,无需任何跳转授权)。
                    </p>
                )}
            </section>

            <section style={card}>
                <h2 style={{ margin: "0 0 8px", fontSize: 16 }}>② 平台基础能力直通</h2>
                <p style={{ margin: "0 0 8px", fontSize: 14, color: "#6B7280" }}>
                    以下数据实时读自平台数据集合 site-features(共 {features.length} 条):
                </p>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14 }}>
                    {features.slice(0, 5).map((f) => <li key={f.fid}>{f.title}</li>)}
                </ul>
            </section>

            <section style={card}>
                <h2 style={{ margin: "0 0 8px", fontSize: 16 }}>③ 跨 zone 导航</h2>
                <p style={{ margin: 0, fontSize: 14 }}>
                    {/* 跨 zone 必须用 a 标签:Link 会对跨 zone 路径做 SPA 预取,必然失败 */}
                    <a href="/" style={{ color: "#B45309" }}>← 返回主站首页</a>
                    <span style={{ color: "#6B7280" }}>(跨 zone 是整页导航,这是刻意的边界)</span>
                </p>
            </section>
        </main>
    );
}

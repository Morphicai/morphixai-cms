import { cookies } from "next/headers";
import SignupPanel from "../components/SignupPanel";
import { getActivity, getSignups, introspectClient } from "../lib/api";

/**
 * 活动落地页(真实业务形态的 zone 演示):
 * - 内容来自 activity-pages 集合(public_read)——运营在管理端改文案,这里 SSR 实时生效
 * - 报名走 zone 自己的 /activity/api/signup,身份由 cookie 服务端校验
 * - 报名记录在 activity-signups 集合,管理端数据集合页可直接查看
 */
const ACTIVITY_ID = "star-sea-2026";

export default async function ActivityHome() {
    const token = (await cookies()).get("clientAccessToken")?.value;
    const [me, activity, signups] = await Promise.all([
        introspectClient(token),
        getActivity(ACTIVITY_ID),
        getSignups(ACTIVITY_ID),
    ]);

    if (!activity) {
        return (
            <main style={{ maxWidth: 720, margin: "80px auto", padding: 24, textAlign: "center", color: "#6B7280" }}>
                活动配置未找到(activity-pages / {ACTIVITY_ID})——请确认演示数据已导入。
            </main>
        );
    }

    const closed = activity.status === "closed";
    const mySigned = Boolean(me.active && me.user?.id && signups.some((s) => s.userId === String(me.user!.id)));
    const rules = (activity.rules ?? "").split("\n").map((r) => r.trim()).filter(Boolean);

    return (
        <main>
            {/* Hero:深空底色呼应"星海",与主站官网风格刻意不同——zone 有自己的视觉主权 */}
            <section style={{
                background: "linear-gradient(160deg, #141B33 0%, #2A3358 55%, #3B4E8C 100%)",
                color: "#fff", padding: "72px 24px 56px",
            }}>
                <div style={{ maxWidth: 860, margin: "0 auto" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
                        <span style={{
                            fontSize: 12, letterSpacing: 2, padding: "3px 10px", borderRadius: 999,
                            background: closed ? "rgba(255,255,255,.18)" : "rgba(74,222,128,.2)",
                            color: closed ? "#D1D5DB" : "#4ADE80", fontWeight: 600,
                        }}>
                            {closed ? "已结束" : "进行中"}
                        </span>
                        <span style={{ fontSize: 13, color: "#B7C0DC" }}>{activity.period}</span>
                    </div>
                    <h1 style={{ margin: "0 0 12px", fontSize: 40, letterSpacing: 1 }}>{activity.title}</h1>
                    <p style={{ margin: 0, fontSize: 16, color: "#C9D2EC", maxWidth: 560, lineHeight: 1.8 }}>
                        {activity.subtitle}
                    </p>
                    <div style={{ marginTop: 28 }}>
                        <SignupPanel activityId={ACTIVITY_ID} loggedIn={me.active} alreadySigned={mySigned} closed={closed} />
                    </div>
                </div>
            </section>

            <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px 64px", display: "grid", gap: 20 }}>
                <section style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "22px 26px" }}>
                    <h2 style={{ margin: "0 0 12px", fontSize: 17 }}>活动规则</h2>
                    <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14.5, lineHeight: 2, color: "#374151" }}>
                        {rules.map((r, i) => <li key={i}>{r}</li>)}
                    </ol>
                </section>

                <section style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "22px 26px" }}>
                    <h2 style={{ margin: "0 0 4px", fontSize: 17 }}>参与名单</h2>
                    <p style={{ margin: "0 0 14px", fontSize: 13, color: "#9CA3AF" }}>
                        已有 {signups.length} 人报名{me.active ? "" : "(登录后可加入)"}
                    </p>
                    {signups.length === 0 ? (
                        <p style={{ margin: 0, fontSize: 14, color: "#6B7280" }}>还没有人报名,来当第一个。</p>
                    ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {signups.map((s) => (
                                <span key={s.userId} style={{
                                    fontSize: 13, padding: "4px 12px", borderRadius: 999,
                                    background: "#EEF1F8", color: "#3B4E8C", fontWeight: 500,
                                }}>
                                    {s.nickname}
                                </span>
                            ))}
                        </div>
                    )}
                </section>

                <p style={{ margin: 0, fontSize: 12.5, color: "#9CA3AF" }}>
                    本页由独立 zone 应用渲染;活动文案在管理端"数据集合 / activity-pages"维护,改完刷新即生效。
                    <a href="/" style={{ color: "#3B4E8C", marginLeft: 8 }}>← 返回主站</a>
                </p>
            </div>
        </main>
    );
}

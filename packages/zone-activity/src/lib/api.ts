/**
 * zone 服务端直连平台 API 的小工具集。
 * 公开集合读写口现状是双 /api 前缀(存量路径瑕疵,公开接口硬化时统一)。
 */
const API = (process.env.OPTIMUS_API_URL || "http://localhost:8084/api").replace(/\/$/, "");

export interface Identity {
    active: boolean;
    user?: { id?: string; username?: string; nickname?: string; email?: string };
}

export interface ActivityPage {
    title: string;
    subtitle?: string;
    period?: string;
    status?: "open" | "closed";
    rules?: string;
}

export interface Signup {
    activityId: string;
    userId: string;
    nickname: string;
}

export async function introspectClient(token: string | undefined): Promise<Identity> {
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

export async function getActivity(id: string): Promise<ActivityPage | null> {
    try {
        const res = await fetch(`${API}/api/dictionary/activity-pages/${encodeURIComponent(id)}`, { cache: "no-store" });
        const json = await res.json();
        return json?.code === 200 ? json.data : null;
    } catch {
        return null;
    }
}

export async function getSignups(activityId: string): Promise<Signup[]> {
    try {
        const res = await fetch(`${API}/api/dictionary/activity-signups`, { cache: "no-store" });
        const json = await res.json();
        const items: Array<{ value: Signup }> = json?.data?.items ?? [];
        return items.map((i) => i.value).filter((v) => v.activityId === activityId);
    } catch {
        return [];
    }
}

/** 报名写入:key = activityId-userId,collection+key 唯一 → 天然一人一报 */
export async function writeSignup(activityId: string, userId: string, nickname: string): Promise<{ ok: boolean; msg?: string }> {
    const res = await fetch(`${API}/api/dictionary/activity-signups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            key: `${activityId}-${userId}`,
            value: { activityId, userId, nickname },
        }),
        cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.code === 200) return { ok: true };
    // "字典项已存在" = 重复报名,对用户来说等价于已报名成功
    if (String(json?.msg ?? "").includes("已存在")) return { ok: true, msg: "已报过名" };
    return { ok: false, msg: json?.msg || `HTTP ${res.status}` };
}

"use client";

/**
 * 页内登录弹窗——Next 生态共享 UI 的正统方案(Multi-Zones 官方推荐即共享包)。
 * 自包含:不依赖宿主的 Provider/样式体系,登录直接调同域 /api/client-user/login
 * (Multi-Zones 下 zone 与主站同域,cookie 由主站 API 代理写入,SDK 不碰凭据存储)。
 * 分发形态:npm 包只发编译产物(dist),源码留在主站仓库。
 */

import { useState } from "react";

export interface LoginModalProps {
    open: boolean;
    onClose: () => void;
    /** 登录成功后回调。常见做法:window.location.reload() 让 SSR 重取身份 */
    onSuccess: (user: { userId?: string; username?: string; nickname?: string }) => void;
    /** 登录接口路径,默认同域主站代理 */
    loginPath?: string;
    title?: string;
}

const S: Record<string, React.CSSProperties> = {
    mask: {
        position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,20,40,.55)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    },
    card: {
        width: "min(400px, 100%)", background: "#fff", borderRadius: 14,
        boxShadow: "0 24px 64px rgba(10,15,35,.35)", padding: "32px 32px 28px",
        position: "relative", fontFamily: "system-ui, 'PingFang SC', sans-serif",
    },
    close: {
        position: "absolute", top: 10, right: 14, border: "none", background: "transparent",
        fontSize: 22, color: "#9CA3AF", cursor: "pointer", lineHeight: 1,
    },
    h: { margin: "0 0 4px", fontSize: 22, color: "#111827", textAlign: "center" },
    sub: { margin: "0 0 20px", fontSize: 13, color: "#6B7280", textAlign: "center" },
    label: { display: "block", fontSize: 13, color: "#374151", margin: "12px 0 4px" },
    input: {
        width: "100%", boxSizing: "border-box", padding: "10px 12px", fontSize: 14,
        border: "1px solid #D1D5DB", borderRadius: 8, outline: "none",
    },
    err: { margin: "10px 0 0", fontSize: 13, color: "#B91C1C" },
    btn: {
        width: "100%", marginTop: 18, padding: "11px 0", fontSize: 15, fontWeight: 600,
        border: "none", borderRadius: 8, background: "#1F2937", color: "#fff", cursor: "pointer",
    },
};

export function LoginModal({ open, onClose, onSuccess, loginPath = "/api/client-user/login", title = "登录" }: LoginModalProps) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    if (!open) return null;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) { setError("请输入用户名和密码"); return; }
        setBusy(true);
        setError("");
        try {
            const res = await fetch(loginPath, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ username, password }),
            });
            const json = await res.json().catch(() => null);
            if (res.ok && json?.code === 200) {
                onSuccess(json.data?.user ?? {});
            } else {
                setError(json?.msg || "登录失败,请检查账号密码");
            }
        } catch {
            setError("网络异常,稍后再试");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div style={S.mask} onClick={onClose}>
            <div style={S.card} onClick={(e) => e.stopPropagation()}>
                <button style={S.close} onClick={onClose} aria-label="关闭">×</button>
                <h2 style={S.h}>{title}</h2>
                <p style={S.sub}>登录你的账号以继续</p>
                <form onSubmit={submit}>
                    <label style={S.label}>用户名</label>
                    <input
                        style={S.input}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        placeholder="用户名或邮箱"
                    />
                    <label style={S.label}>密码</label>
                    <input
                        style={S.input}
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        placeholder="密码"
                    />
                    {error && <p style={S.err}>{error}</p>}
                    <button style={{ ...S.btn, opacity: busy ? 0.6 : 1 }} disabled={busy} type="submit">
                        {busy ? "登录中..." : "登 录"}
                    </button>
                </form>
            </div>
        </div>
    );
}

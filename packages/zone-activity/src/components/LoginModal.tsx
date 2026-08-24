"use client";

import { useEffect } from "react";

/**
 * 共享登录弹层:iframe 加载主站的 /auth/login-embed(同域相对路径,经主域到主应用)。
 * 主站不给我们任何组件代码——契约只有一个 URL 和一条完成消息。
 * 登录成功消息(同源校验)→ 整页刷新,SSR 重取 cookie 身份,报名状态一并更新。
 */
export default function LoginModal({ onClose }: { onClose: () => void }) {
    useEffect(() => {
        const onMessage = (e: MessageEvent) => {
            // zone 与主站同域(Multi-Zones 前提),只认同源消息
            if (e.origin !== window.location.origin) return;
            if (e.data?.type === "optimus:login-success") {
                window.location.reload();
            }
        };
        window.addEventListener("message", onMessage);
        return () => window.removeEventListener("message", onMessage);
    }, []);

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed", inset: 0, zIndex: 1000,
                background: "rgba(15, 20, 40, .55)", backdropFilter: "blur(2px)",
                display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: "relative", width: "min(440px, 100%)", height: 560,
                    background: "#fff", borderRadius: 14, overflow: "hidden",
                    boxShadow: "0 24px 64px rgba(10, 15, 35, .35)",
                }}
            >
                <button
                    onClick={onClose}
                    aria-label="关闭登录窗口"
                    style={{
                        position: "absolute", top: 10, right: 12, zIndex: 1,
                        border: "none", background: "transparent", fontSize: 22,
                        color: "#9CA3AF", cursor: "pointer", lineHeight: 1,
                    }}
                >
                    ×
                </button>
                <iframe
                    src="/auth/login-embed"
                    title="登录"
                    style={{ width: "100%", height: "100%", border: "none" }}
                />
            </div>
        </div>
    );
}

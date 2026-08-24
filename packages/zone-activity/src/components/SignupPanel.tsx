"use client";

import { useState } from "react";
import { LoginModal } from "@optimus/auth-ui";

/**
 * 报名交互区(客户端组件)。三态:未登录引导 / 可报名 / 已报名。
 * 未登录时弹共享登录窗——@optimus/auth-ui SDK(同栈子应用的正解,构建时集成,
 * 只含编译产物);异构/外部子应用则用主站 /auth/login-embed 的 iframe 通道。
 * 报名请求走同域相对路径,cookie 自动携带,身份校验在 zone 服务端。
 */
export default function SignupPanel({
    activityId,
    loggedIn,
    alreadySigned,
    closed,
}: {
    activityId: string;
    loggedIn: boolean;
    alreadySigned: boolean;
    closed: boolean;
}) {
    const [state, setState] = useState<"idle" | "busy" | "done">(alreadySigned ? "done" : "idle");
    const [msg, setMsg] = useState("");
    const [loginOpen, setLoginOpen] = useState(false);

    const signup = async () => {
        setState("busy");
        setMsg("");
        try {
            const res = await fetch("/activity/api/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ activityId }),
            });
            const json = await res.json();
            if (res.ok && json.code === 200) {
                setState("done");
                setMsg(json.msg);
            } else {
                setState("idle");
                setMsg(json.msg || "报名失败,稍后再试");
            }
        } catch {
            setState("idle");
            setMsg("网络异常,稍后再试");
        }
    };

    if (closed) {
        return <div style={{ color: "#9CA3AF", fontSize: 14 }}>本期活动已结束,感谢关注。</div>;
    }
    if (!loggedIn) {
        return (
            <>
                <button
                    onClick={() => setLoginOpen(true)}
                    style={{
                        padding: "10px 28px", borderRadius: 8, border: "none", cursor: "pointer",
                        background: "#1F2937", color: "#fff", fontSize: 15,
                    }}
                >
                    登录后报名
                </button>
                <LoginModal
                    open={loginOpen}
                    onClose={() => setLoginOpen(false)}
                    onSuccess={() => window.location.reload()}
                />
            </>
        );
    }
    if (state === "done") {
        return (
            <div style={{ color: "#15803D", fontSize: 15, fontWeight: 600 }}>
                ✓ 已报名{msg && msg !== "报名成功" ? `(${msg})` : ",期待你的作品"}
            </div>
        );
    }
    return (
        <div>
            <button
                onClick={signup}
                disabled={state === "busy"}
                style={{
                    padding: "10px 32px", borderRadius: 8, border: "none", cursor: "pointer",
                    background: state === "busy" ? "#93A5C4" : "#3B4E8C", color: "#fff", fontSize: 15, fontWeight: 600,
                }}
            >
                {state === "busy" ? "提交中..." : "立即报名"}
            </button>
            {msg && <div style={{ color: "#B91C1C", fontSize: 13, marginTop: 8 }}>{msg}</div>}
        </div>
    );
}

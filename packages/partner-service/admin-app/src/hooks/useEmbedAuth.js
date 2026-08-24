import { useEffect, useRef, useState } from "react";

/**
 * 包一层 @optimus/admin-embed(全局 UMD,由 index.html 的 <script> 标签引入)。
 * baseOrigin 取 document.referrer——iframe 被基座加载时浏览器会带这个头,
 * 协议本身(EmbedFrame/admin-embed)不接受额外改造,不能靠 query 参数传。
 *
 * 返回 { status, token, perms, error }。status: 'handshaking' | 'ready' | 'error'。
 */
export function useEmbedAuth() {
    const [state, setState] = useState({ status: "handshaking", token: null, perms: [], error: null });
    const tokenRef = useRef(null);

    useEffect(() => {
        const sdk = window.OptimusAdminEmbed;
        if (!sdk) {
            setState({ status: "error", token: null, perms: [], error: "admin-embed.js 未加载" });
            return;
        }

        const baseOrigin = document.referrer ? new URL(document.referrer).origin : "";
        if (!baseOrigin) {
            setState({
                status: "error",
                token: null,
                perms: [],
                error: "未检测到基座来源(document.referrer 为空),本页需要在管理后台的 embed 入口里打开",
            });
            return;
        }

        sdk.init({ baseOrigin })
            .then((ctx) => {
                tokenRef.current = ctx.token;
                setState({ status: "ready", token: ctx.token, perms: ctx.perms || [], error: null });
            })
            .catch((err) => {
                setState({ status: "error", token: null, perms: [], error: err.message || "握手失败" });
            });

        const unsubscribe = sdk.onTokenRefresh((token) => {
            tokenRef.current = token;
            setState((prev) => ({ ...prev, token }));
        });
        return unsubscribe;
    }, []);

    // 提供一个稳定的 getter 给 axios 拦截器用(避免闭包拿到过期的 state.token)
    const getToken = () => tokenRef.current;
    const refreshToken = () => window.OptimusAdminEmbed.requestToken().then((token) => {
        tokenRef.current = token;
        return token;
    });

    return { ...state, getToken, refreshToken };
}

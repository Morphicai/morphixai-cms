/**
 * @optimus/admin-embed — 管理后台子应用侧的嵌入 SDK(UMD 单文件,零构建零依赖)。
 *
 * 子应用被基座 iframe 加载后,用它完成握手拿到 token/用户/权限/locale/theme。
 * 协议时序(子应用先发起,避免基座对着没加载完的 iframe 喊话):
 *   子应用 → 基座: { type: "optimus:ready", version: 1 }
 *   基座 → 子应用: { type: "optimus:handshake", payload: {...} }
 *   子应用 → 基座: { type: "optimus:refresh-token" }
 *   基座 → 子应用: { type: "optimus:token", payload: { token } }
 *
 * 安全边界:init 必须传 baseOrigin,不匹配的消息一律丢弃;token 只经
 * postMessage 定向传递,不走 URL(URL 会进历史和日志)。
 * 故意写成 UMD 而不是 TS+构建链:消费者一半是 <script> 标签直引,
 * 一百行的包不值得一条构建流水线。
 */
(function (root, factory) {
    if (typeof module === "object" && module.exports) {
        module.exports = factory();
    } else {
        root.OptimusAdminEmbed = factory();
    }
})(typeof self !== "undefined" ? self : this, function () {
    "use strict";

    var state = {
        baseOrigin: null,
        context: null, // 握手拿到的 { token, user, perms, locale, theme }
        refreshCallbacks: [],
        pendingTokenResolvers: [],
    };

    function onMessage(event) {
        if (!state.baseOrigin || event.origin !== state.baseOrigin) return; // 非基座消息,丢
        var msg = event.data;
        if (!msg || typeof msg.type !== "string") return;

        if (msg.type === "optimus:token" && msg.payload && msg.payload.token) {
            if (state.context) state.context.token = msg.payload.token;
            state.refreshCallbacks.forEach(function (cb) {
                try { cb(msg.payload.token); } catch (e) { /* 子应用回调自己的错自己担 */ }
            });
            state.pendingTokenResolvers.splice(0).forEach(function (resolve) {
                resolve(msg.payload.token);
            });
        }
    }

    /**
     * 与基座握手。opts: { baseOrigin: string, timeoutMs?: number }
     * 返回 Promise<{ token, user, perms, locale, theme }>。
     * 不在基座 iframe 内(直接打开)会在超时后 reject,子应用据此降级。
     */
    function init(opts) {
        if (!opts || !opts.baseOrigin) {
            return Promise.reject(new Error("init 需要 baseOrigin"));
        }
        state.baseOrigin = opts.baseOrigin.replace(/\/$/, "");
        var timeoutMs = opts.timeoutMs || 3000;

        window.addEventListener("message", onMessage);

        return new Promise(function (resolve, reject) {
            var settled = false;
            var timer = setTimeout(function () {
                if (settled) return;
                settled = true;
                window.removeEventListener("message", onHandshake);
                reject(new Error("握手超时:不在基座内打开,或 baseOrigin 不匹配"));
            }, timeoutMs);

            function onHandshake(event) {
                if (event.origin !== state.baseOrigin) return;
                var msg = event.data;
                if (!msg || msg.type !== "optimus:handshake" || !msg.payload) return;
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                window.removeEventListener("message", onHandshake);
                state.context = msg.payload;
                resolve(msg.payload);
            }

            window.addEventListener("message", onHandshake);
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({ type: "optimus:ready", version: 1 }, state.baseOrigin);
            }
            // 不在 iframe 里就没人回话,等 timeout reject 即可
        });
    }

    /** 请求基座刷新并下发新 token */
    function requestToken() {
        if (!state.baseOrigin) return Promise.reject(new Error("先 init"));
        return new Promise(function (resolve, reject) {
            var timer = setTimeout(function () {
                var i = state.pendingTokenResolvers.indexOf(wrapped);
                if (i >= 0) state.pendingTokenResolvers.splice(i, 1);
                reject(new Error("刷新 token 超时"));
            }, 5000);
            function wrapped(token) {
                clearTimeout(timer);
                resolve(token);
            }
            state.pendingTokenResolvers.push(wrapped);
            window.parent.postMessage({ type: "optimus:refresh-token" }, state.baseOrigin);
        });
    }

    /** 基座主动或应答下发新 token 时的回调(比如基座自己续期了) */
    function onTokenRefresh(cb) {
        state.refreshCallbacks.push(cb);
        return function unsubscribe() {
            var i = state.refreshCallbacks.indexOf(cb);
            if (i >= 0) state.refreshCallbacks.splice(i, 1);
        };
    }

    /** 读当前握手上下文(未握手为 null) */
    function getContext() {
        return state.context;
    }

    return { init: init, requestToken: requestToken, onTokenRefresh: onTokenRefresh, getContext: getContext };
});

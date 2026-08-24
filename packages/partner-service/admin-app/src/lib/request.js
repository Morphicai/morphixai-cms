import axios from "axios";
import { message } from "antd";

/**
 * 照抄 optimus-ui 的 shared/utils/axios.js 的响应归一化逻辑(兼容
 * { code, data, msg } 和 { success, data, msg } 两种后端返回形状),
 * 目的是让从 optimus-ui 搬过来的页面组件(判断 response?.success / response?.data)
 * 不用改一行就能继续工作。
 *
 * 与 optimus-ui 原版的关键差异:token 不来自 localStorage,而是 embed 握手
 * 拿到的短期 token(见 configureAuth);401 时不走 optimus-ui 自己的
 * /update/token 刷新接口,而是通过 admin-embed SDK 向基座要一个新 token
 * (基座自己管理会话续期,子应用没有独立的 refresh token)。
 */
let authGetToken = () => null;
let authRefreshToken = () => Promise.reject(new Error("尚未完成 embed 握手"));

export function configureAuth({ getToken, refreshToken }) {
    authGetToken = getToken;
    authRefreshToken = refreshToken;
}

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_PARTNER_SERVICE_BASE_URL || "",
    transformResponse: [
        function (dataStr) {
            try {
                const parsed = JSON.parse(dataStr);
                let success, code, data, msg, error;
                if ("success" in parsed) {
                    success = parsed.success;
                    code = success ? 200 : parsed.code || 0;
                    data = parsed.data || {};
                    msg = parsed.msg;
                    error = parsed.error;
                } else {
                    code = parsed.code || 0;
                    success = code === 200;
                    data = parsed.data || {};
                    msg = parsed.msg;
                    error = parsed.error;
                }
                return { success, code, data, msg, error };
            } catch (e) {
                const raw = typeof dataStr === "string" ? dataStr.trim() : "";
                return { success: false, code: -100, data: null, msg: raw ? raw.substring(0, 300) : "请求失败" };
            }
        },
    ],
});

export async function request({ type = "get", data = {}, showTip = true, url, headers = {} }, isRetry = false) {
    try {
        const { data: responseData, status } = await axiosInstance.request({
            method: type,
            url,
            params: type.toLowerCase() === "get" ? data : {},
            data: type.toLowerCase() !== "get" ? data : {},
            headers: {
                Authorization: authGetToken() ? `Bearer ${authGetToken()}` : "",
                ...headers,
            },
        });

        const result = responseData && status ? responseData : { code: -100, msg: "网络请求失败！" };

        if (showTip && result.msg && result.code !== 200) {
            if (result.error) {
                result.error.some((item) => {
                    message.error(item);
                    return true;
                });
            } else {
                message.error(result.msg || "请求失败");
            }
        }
        return result;
    } catch (error) {
        const { status, data: errData = {} } = error?.response || {};
        const failedResponse = {
            success: false,
            code: status || -100,
            data: null,
            msg: errData.msg || errData.message || "请求失败",
            error: errData.error,
        };

        if (status === 401 && !isRetry) {
            try {
                await authRefreshToken();
                return request({ type, data, showTip, url, headers }, true);
            } catch (refreshError) {
                if (showTip) message.error("登录状态已失效,请刷新管理后台页面重新进入");
                return failedResponse;
            }
        }

        if (showTip) message.error(failedResponse.msg);
        return failedResponse;
    }
}

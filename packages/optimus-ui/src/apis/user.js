import { pick } from "lodash";
import { request } from "../shared/utils/axios";
import storage from "../shared/utils/storage";

/**
 * 登录
 */
export async function login({ account, password, verifyCode, captchaId }) {
    const res = await request({
        type: "post",
        url: "/login",
        data: { account, password, verifyCode, captchaId },
    });

    if (res.success && res?.data?.user) {
        storage(
            "user",
            JSON.stringify(
                Object.assign(
                    { username: res.data?.user?.account },
                    pick(res.data.user, [
                        "id",
                        "fullName",
                        "type",
                        "roleIds",
                        "avatar",
                    ]),
                ),
            ),
        );
    }

    return res;
}

/**
 *
 * @param {string} token
 * 更新Token
 * @returns
 */
export async function refreshToken() {
    return await request(
        {
            type: "post",
            url: "/update/token",
            headers: { Authorization: "Bearer " + storage("refresh-token") },
        },
        true,
    );
}

export function getCaptchaImage(data = { width: 100, height: 50 }) {
    return request(
        {
            type: "get",
            url: "/captcha/img",
            data,
        },
        true,
    );
}

export function changePassword({ data = {} }) {
    return request(
        {
            type: "post",
            url: "/changePassword",
            data,
        },
        true,
    );
}

export async function getAllMenu() {
    return await request({
        type: "get",
        url: "/perm/menu",
    });
}

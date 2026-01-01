import { request } from "../shared/utils/axios";

/**
 * 分页获取所有意见反馈
 * @param {*} param0
 * @returns
 */
export function getContactFeedback({ page = 1, size=10 }) {
    return request({
        type: "get",
        url: "/m/contact/feedback/list",
        data: { page: page - 1, size },
    });
}

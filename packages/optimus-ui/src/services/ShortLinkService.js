import { request } from "../shared/utils/axios";

class ShortLinkService {
    /**
     * 获取短链列表
     */
    async list(params) {
        return request({
            type: "get",
            url: "/system/short-link",
            data: params,
        });
    }

    /**
     * 创建短链
     */
    async create(data) {
        return request({
            type: "post",
            url: "/system/short-link",
            data,
        });
    }

    /**
     * 更新短链
     */
    async update(id, data) {
        return request({
            type: "put",
            url: `/system/short-link/${id}`,
            data,
        });
    }

    /**
     * 删除短链
     */
    async delete(id) {
        return request({
            type: "delete",
            url: `/system/short-link/${id}`,
        });
    }

    /**
     * 获取短链详情
     */
    async getDetail(id) {
        return request({
            type: "get",
            url: `/system/short-link/${id}`,
        });
    }

    /**
     * 解析短链token（公开接口）
     */
    async resolve(token) {
        return request({
            type: "get",
            url: `/public/short-link/resolve/${token}`,
        });
    }
}

const shortLinkService = new ShortLinkService();
export default shortLinkService;

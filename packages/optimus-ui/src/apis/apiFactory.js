/**
 * 用于生成标准的增删改查 API
 */
import { request } from "../shared/utils/axios";

const API_INSTANCES = {};

export default function apiFactory({
    name = "",
    baseUrl = "",
    onCallApi = (_, params) => {
        return params;
    },
    ignoreCache = false,
}) {
    if (!name) {
        throw new Error("name不能为空");
    }

    if (API_INSTANCES[name] && !ignoreCache) {
        return API_INSTANCES[name];
    }

    /**
     * 添加
     * @param {*} param0
     * @returns
     */
    function create(data) {
        const params = {
            type: "post",
            url: `${baseUrl}${name}/create`,
            data: data,
        };
        const requestParams = onCallApi("create", params) || params;
        return request(requestParams);
    }

    /**
     * 获取列表
     * @param {*} param0
     * @returns
     */
    function list({ page, size = 10, ...queryParams }) {
        const params = {
            type: "get",
            url: `${baseUrl}${name}/list`,
            data: { page: page, size, ...queryParams },
        };
        const requestParams = onCallApi("list", params) || params;
        return request(requestParams);
    }

    /**
     * 更新
     * @returns
     */
    function update(data = {}) {
        const { id } = data;
        const params = {
            type: "patch",
            url: `${baseUrl}${name}/${id}`,
            data: data,
        };
        const requestParams = onCallApi("update", params) || params;
        return request(requestParams);
    }

    /**
     * 删除
     * @param {*} id
     * @returns
     */
    function remove(id) {
        const params = {
            type: "delete",
            url: `${baseUrl}${name}/${id}`,
        };
        const requestParams = onCallApi("remove", params) || params;
        return request(requestParams);
    }

    //查询某一条
    function query(id) {
        const params = {
            type: "get",
            url: `${baseUrl}${name}/${id}`,
        };
        const requestParams = onCallApi("query", params) || params;
        return request(requestParams);
    }
    const apiInstance = {
        create,
        remove,
        update,
        query,
        list,
    };
    API_INSTANCES[name] = apiInstance;
    return apiInstance;
}

import { request } from "../shared/utils/axios";

/**
 * 系统安装相关API
 */
export const setupApi = {
    /**
     * 获取系统状态
     */
    getStatus: () => {
        return request({
            type: "get",
            url: "/setup/status",
        });
    },

    /**
     * 初始化系统
     * @param {Object} data - 初始化数据
     * @param {string} data.account - 管理员账号
     * @param {string} data.password - 管理员密码
     * @param {string} data.fullName - 管理员姓名
     * @param {string} data.email - 管理员邮箱
     * @param {string} data.phoneNum - 管理员手机号
     * @param {string} data.siteName - 站点名称
     * @param {string} data.siteDescription - 站点描述
     */
    initialize: (data) => {
        return request({
            type: "post",
            url: "/setup/initialize",
            data,
        });
    },
};


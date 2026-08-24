import { request } from "../lib/request";

/**
 * 管理后台 - 合伙人管理 Service。照抄自 optimus-ui 的
 * services/AdminPartnerService.js,URL 原样保留——这些接口迁移后
 * 路径本来就没变(@Controller("biz/partner/admin") 未动)。
 */
class AdminPartnerService {
    async getDashboard() {
        return request({ type: "get", url: "/biz/partner/admin/dashboard" });
    }

    async list(params) {
        return request({ type: "get", url: "/biz/partner/admin/partners", data: params });
    }

    async getDetail(partnerId) {
        return request({ type: "get", url: `/biz/partner/admin/partners/${partnerId}` });
    }

    async getTeam(partnerId, params) {
        return request({ type: "get", url: `/biz/partner/admin/partners/${partnerId}/team`, data: params });
    }

    async getPoints(partnerId, params) {
        return request({ type: "get", url: `/biz/partner/admin/partners/${partnerId}/points`, data: params });
    }

    async getChannels(partnerId) {
        return request({ type: "get", url: `/biz/partner/admin/partners/${partnerId}/channels` });
    }

    async freeze(partnerId, reason) {
        return request({ type: "put", url: `/biz/partner/admin/partners/${partnerId}/freeze`, data: { reason } });
    }

    async unfreeze(partnerId) {
        return request({ type: "put", url: `/biz/partner/admin/partners/${partnerId}/unfreeze` });
    }

    async correctUplink(partnerId, newUplinkPartnerId) {
        return request({
            type: "post",
            url: `/biz/partner/admin/partners/${partnerId}/correct-uplink`,
            data: { newUplinkPartnerId },
        });
    }

    async updateRemark(partnerId, remark) {
        return request({ type: "put", url: `/biz/partner/admin/partners/${partnerId}/remark`, data: { remark } });
    }

    async refreshCache() {
        return request({ type: "post", url: "/biz/partner/admin/cache/refresh" });
    }

    async clearAllData(data) {
        return request({ type: "delete", url: "/biz/partner/admin/partners/clear-all-data", data });
    }

    async getTaskLogs(partnerId, page, pageSize) {
        return request({
            type: "get",
            url: `/biz/partner/admin/partners/${partnerId}/task-logs`,
            data: { page, pageSize },
        });
    }

    async analyzeInviteTasks(partnerId) {
        return request({ type: "get", url: `/biz/partner/admin/partners/${partnerId}/analyze-invite-tasks` });
    }

    async fixInviteTasks(partnerId) {
        return request({ type: "post", url: `/biz/partner/admin/partners/${partnerId}/fix-invite-tasks` });
    }
}

const adminPartnerService = new AdminPartnerService();
export default adminPartnerService;

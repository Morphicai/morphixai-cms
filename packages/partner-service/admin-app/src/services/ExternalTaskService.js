import { request } from "../lib/request";

/**
 * 外部任务服务(管理后台)。照抄自 optimus-ui 的 services/ExternalTaskService.js,
 * URL 原样保留(@Controller("admin/external-task") 未动)。
 */
class ExternalTaskService {
    async getSubmissions(params) {
        return request({ type: "get", url: "/admin/external-task/submissions", data: params });
    }

    async getSubmissionDetail(id) {
        return request({ type: "get", url: `/admin/external-task/submissions/${id}` });
    }

    async approveSubmission(id, data = {}) {
        return request({ type: "post", url: `/admin/external-task/submissions/${id}/approve`, data });
    }

    async rejectSubmission(id, data) {
        return request({ type: "post", url: `/admin/external-task/submissions/${id}/reject`, data });
    }

    async getStatistics() {
        return request({ type: "get", url: "/admin/external-task/statistics" });
    }
}

const externalTaskService = new ExternalTaskService();
export default externalTaskService;

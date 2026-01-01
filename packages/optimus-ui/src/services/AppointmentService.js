import { request } from "../shared/utils/axios";

class AppointmentService {
    /**
     * 查询预约记录列表
     * @param {Object} params 查询参数
     * @returns {Promise<Object>} 预约记录列表
     */
    async list(params) {
        const response = await request({
            type: "get",
            url: "/biz/appointment/list",
            data: params,
        });

        return {
            success: response.code === 200,
            data: response.data?.items || [],
            total: response.data?.total || 0,
            error: response.msg,
        };
    }

    /**
     * 导出预约记录为 Excel
     * @param {Object} params 查询参数
     * @returns {Promise<Object>} 导出结果
     */
    async export(params) {
        try {
            const accessToken = localStorage.getItem("access-token");

            if (!accessToken) {
                throw new Error("未登录或登录已过期");
            }

            // 构建查询参数
            const queryString = new URLSearchParams(params).toString();
            
            // 获取 API 基础 URL
            const baseUrl = process.env.REACT_APP_API_BASE_URL;
            const apiUrl = `${baseUrl}/biz/appointment/export${queryString ? `?${queryString}` : ""}`;

            // 使用 fetch 下载文件
            const response = await fetch(apiUrl, {
                method: "GET",
                headers: {
                    Authorization: accessToken,
                },
            });

            // 检查响应状态
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.msg || errorData.error || `导出失败 (${response.status})`);
            }

            // 获取文件名
            const contentDisposition = response.headers.get("Content-Disposition");
            let fileName = `预约记录_${new Date().toISOString().split("T")[0]}.xlsx`;
            if (contentDisposition) {
                const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
                if (matches != null && matches[1]) {
                    fileName = decodeURIComponent(matches[1].replace(/['"]/g, ""));
                }
            }

            // 获取文件 Blob
            const blob = await response.blob();

            // 创建下载链接
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            link.style.display = "none";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            return { success: true };
        } catch (error) {
            console.error("导出预约记录失败:", error);
            return { success: false, error: error.message };
        }
    }
}

const appointmentService = new AppointmentService();
export default appointmentService;

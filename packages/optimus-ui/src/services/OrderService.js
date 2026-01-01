import { request } from "../shared/utils/axios";

class OrderService {
    /**
     * 查询订单列表（管理后台）
     */
    async list(params) {
        const response = await request({
            method: "get",
            url: "/admin/order/list",
            params,
        });
        return response;
    }

    /**
     * 获取订单统计
     */
    async getStats() {
        const response = await request({
            method: "get",
            url: "/admin/order/stats",
        });
        return response;
    }

    /**
     * 查询订单详情
     */
    async getDetail(orderNo) {
        const response = await request({
            method: "get",
            url: `/admin/order/${orderNo}`,
        });
        return response;
    }
}

const orderService = new OrderService();
export default orderService;

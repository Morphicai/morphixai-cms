import { request } from '../shared/utils/axios';

/**
 * 商品服务类
 */
class ProductService {
    /**
     * 获取商品列表
     * @param {Object} params - 查询参数
     * @returns {Promise}
     */
    async list(params = {}) {
        try {
            const { page = 1, pageSize = 10, productCode, productName, productType, status } = params;

            const response = await request({
                type: 'get',
                url: '/admin/game/products',
                data: {
                    page,
                    pageSize,
                    productCode,
                    productName,
                    productType,
                    status,
                },
            });

            if (response.code === 200 && response.data) {
                return {
                    data: response.data.items || [],
                    total: response.data.total || 0,
                    success: true,
                };
            }

            return {
                data: [],
                total: 0,
                success: false,
                error: response.msg || '获取列表失败',
            };
        } catch (error) {
            console.error('获取商品列表失败:', error);
            return {
                data: [],
                total: 0,
                success: false,
                error: error.message,
            };
        }
    }
}

const productService = new ProductService();
export default productService;

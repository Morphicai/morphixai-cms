/**
 * 商品管理 - 商品数据常量
 */

/**
 * 商品列表（代码中维护）
 */
export const PRODUCTS = [
  {
    id: 1,
    productCode: 'CREATE_CHARACTER',
    productName: '全服创建角色',
    productType: 'service',
    price: 0.00,
    originalPrice: 0.00,
    description: '全服创建游戏角色服务',
    status: 'active',
    stock: 999999,
    createDate: '2024-01-01 00:00:00',
  },
  {
    id: 2,
    productCode: 'CREATE_GUILD',
    productName: '公会',
    productType: 'service',
    price: 0.00,
    originalPrice: 0.00,
    description: '创建游戏公会服务',
    status: 'active',
    stock: 999999,
    createDate: '2024-01-01 00:00:00',
  },
];

/**
 * 商品类型枚举
 */
export const PRODUCT_TYPE_ENUM = {
  service: { text: '服务', color: 'blue' },
};

/**
 * 商品状态枚举
 */
export const PRODUCT_STATUS_ENUM = {
  active: { text: '上架', color: 'success' },
  inactive: { text: '下架', color: 'default' },
};

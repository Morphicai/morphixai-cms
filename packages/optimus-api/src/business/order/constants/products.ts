/**
 * 产品配置常量
 * 硬编码的两个产品，用于订单系统识别和处理
 */

export interface ProductConfig {
    /** 产品ID */
    id: string;
    /** 产品名称 */
    name: string;
    /** 产品价格 */
    price: number;
    /** 产品描述（可选） */
    description?: string;
}

/**
 * 全服角色配置
 */
export const PRODUCT_CHARACTER_ALL_SERVER: ProductConfig = {
    id: "CHARACTER_ALL_SERVER",
    name: "全服角色",
    price: 18,
    description: "付费创建全服角色",
};

/**
 * 单服公会配置
 */
export const PRODUCT_GUILD_SINGLE_SERVER: ProductConfig = {
    id: "GUILD_SINGLE_SERVER",
    name: "单服公会",
    price: 0,
    description: "免费创建单服公会",
};

/**
 * 全服公会配置
 */
export const PRODUCT_GUILD_ALL_SERVER: ProductConfig = {
    id: "GUILD_ALL_SERVER",
    name: "全服公会",
    price: 18,
    description: "付费创建全服公会",
};

/**
 * 所有产品配置映射
 */
export const PRODUCTS: Record<string, ProductConfig> = {
    [PRODUCT_CHARACTER_ALL_SERVER.id]: PRODUCT_CHARACTER_ALL_SERVER,
    [PRODUCT_GUILD_SINGLE_SERVER.id]: PRODUCT_GUILD_SINGLE_SERVER,
    [PRODUCT_GUILD_ALL_SERVER.id]: PRODUCT_GUILD_ALL_SERVER,
};

/**
 * 根据产品ID获取产品配置
 * @param productId 产品ID
 * @returns 产品配置，如果不存在则返回 undefined
 */
export function getProductById(productId: string): ProductConfig | undefined {
    return PRODUCTS[productId];
}

/**
 * 验证产品ID是否有效
 * @param productId 产品ID
 * @returns 是否为有效的产品ID
 */
export function isValidProductId(productId: string): boolean {
    return productId in PRODUCTS;
}

/**
 * 获取所有产品列表
 * @returns 所有产品配置数组
 */
export function getAllProducts(): ProductConfig[] {
    return Object.values(PRODUCTS);
}

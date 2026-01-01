import { CreateOrderWithAuthDto } from "../dto/create-order.dto";

/**
 * 参数验证结果
 */
export interface ValidationResult {
    /** 是否验证通过 */
    valid: boolean;
    /** 错误信息列表 */
    errors: string[];
}

/**
 * 商品参数验证器接口
 * 每个商品可以定义自己的参数验证规则
 */
export interface IProductValidator {
    /**
     * 获取验证器支持的产品ID
     */
    getProductId(): string;

    /**
     * 验证订单参数
     * @param dto 创建订单请求
     * @returns 验证结果
     */
    validate(dto: CreateOrderWithAuthDto): ValidationResult;

    /**
     * 获取必需参数列表（用于文档和提示）
     * @returns 必需参数列表
     */
    getRequiredParams(): string[];

    /**
     * 获取可选参数列表（用于文档和提示）
     * @returns 可选参数列表
     */
    getOptionalParams(): string[];
}

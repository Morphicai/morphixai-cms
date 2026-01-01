import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { IProductValidator, ValidationResult } from "../interfaces/product-validator.interface";
import { CreateOrderWithAuthDto } from "../dto/create-order.dto";
import { MultiRegionRoleValidator } from "../validators/multi-region-role.validator";
import { CreateGuildValidator } from "../validators/create-guild.validator";

/**
 * 商品参数验证服务
 * 负责管理和调度所有商品参数验证器
 */
@Injectable()
export class ProductValidatorService implements OnModuleInit {
    private readonly logger = new Logger(ProductValidatorService.name);
    private readonly validators = new Map<string, IProductValidator>();

    constructor(
        private readonly multiRegionRoleValidator: MultiRegionRoleValidator,
        private readonly createGuildValidator: CreateGuildValidator,
    ) {}

    /**
     * 模块初始化时注册所有验证器
     */
    async onModuleInit() {
        this.registerValidator(this.multiRegionRoleValidator);
        this.registerValidator(this.createGuildValidator);

        this.logger.log(`已注册 ${this.validators.size} 个商品参数验证器`);
    }

    /**
     * 注册商品参数验证器
     * @param validator 验证器实例
     */
    private registerValidator(validator: IProductValidator): void {
        const productId = validator.getProductId();
        if (this.validators.has(productId)) {
            this.logger.warn(`商品参数验证器已存在，将被覆盖: ${productId}`);
        }
        this.validators.set(productId, validator);
        this.logger.debug(`注册商品参数验证器: ${productId} -> ${validator.constructor.name}`);
    }

    /**
     * 验证订单参数
     * @param dto 创建订单请求
     * @returns 验证结果
     */
    validate(dto: CreateOrderWithAuthDto): ValidationResult {
        const validator = this.validators.get(dto.productId);

        if (!validator) {
            // 如果没有找到验证器，返回通过（向后兼容）
            this.logger.debug(`未找到商品参数验证器: productId=${dto.productId}，跳过验证`);
            return {
                valid: true,
                errors: [],
            };
        }

        const result = validator.validate(dto);

        if (!result.valid) {
            this.logger.warn(`商品参数验证失败: productId=${dto.productId}, errors=${JSON.stringify(result.errors)}`);
        } else {
            this.logger.debug(`商品参数验证通过: productId=${dto.productId}`);
        }

        return result;
    }

    /**
     * 获取商品的必需参数列表
     * @param productId 产品ID
     * @returns 必需参数列表
     */
    getRequiredParams(productId: string): string[] {
        const validator = this.validators.get(productId);
        return validator ? validator.getRequiredParams() : [];
    }

    /**
     * 获取商品的可选参数列表
     * @param productId 产品ID
     * @returns 可选参数列表
     */
    getOptionalParams(productId: string): string[] {
        const validator = this.validators.get(productId);
        return validator ? validator.getOptionalParams() : [];
    }

    /**
     * 获取所有已注册的验证器
     * @returns 验证器映射
     */
    getValidators(): Map<string, IProductValidator> {
        return this.validators;
    }

    /**
     * 检查是否有验证器支持指定的产品
     * @param productId 产品ID
     * @returns 是否支持
     */
    hasValidator(productId: string): boolean {
        return this.validators.has(productId);
    }
}

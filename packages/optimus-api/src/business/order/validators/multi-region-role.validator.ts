import { Injectable } from "@nestjs/common";
import { IProductValidator, ValidationResult } from "../interfaces/product-validator.interface";
import { CreateOrderWithAuthDto } from "../dto/create-order.dto";

/**
 * 多区创建角色商品参数验证器
 */
@Injectable()
export class MultiRegionRoleValidator implements IProductValidator {
    getProductId(): string {
        return "MULTI_REGION_CREATE_ROLE";
    }

    validate(dto: CreateOrderWithAuthDto): ValidationResult {
        const errors: string[] = [];

        // 1. 验证必需参数：角色名
        if (!dto.roleName || dto.roleName.trim() === "") {
            errors.push("角色名(roleName)是必需的");
        } else {
            // 验证角色名长度
            if (dto.roleName.length < 2 || dto.roleName.length > 20) {
                errors.push("角色名长度必须在2-20个字符之间");
            }
            // 验证角色名格式（可选）
            const roleNamePattern = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;
            if (!roleNamePattern.test(dto.roleName)) {
                errors.push("角色名只能包含中文、英文、数字和下划线");
            }
        }

        // 2. 验证必需参数：区服名
        if (!dto.serverName || dto.serverName.trim() === "") {
            errors.push("区服名(serverName)是必需的");
        }

        // 3. 验证扩展参数（如果有特殊要求）
        if (dto.extrasParams) {
            // 例如：验证区服ID
            if (dto.extrasParams.serverId && typeof dto.extrasParams.serverId !== "string") {
                errors.push("区服ID(extrasParams.serverId)必须是字符串");
            }

            // 例如：验证角色ID
            if (dto.extrasParams.roleId && typeof dto.extrasParams.roleId !== "string") {
                errors.push("角色ID(extrasParams.roleId)必须是字符串");
            }
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    getRequiredParams(): string[] {
        return ["roleName", "serverName"];
    }

    getOptionalParams(): string[] {
        return ["cpOrderNo", "extrasParams.serverId", "extrasParams.roleId"];
    }
}

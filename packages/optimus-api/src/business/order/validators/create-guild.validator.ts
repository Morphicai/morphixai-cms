import { Injectable } from "@nestjs/common";
import { IProductValidator, ValidationResult } from "../interfaces/product-validator.interface";
import { CreateOrderWithAuthDto } from "../dto/create-order.dto";

/**
 * 创建公会商品参数验证器
 */
@Injectable()
export class CreateGuildValidator implements IProductValidator {
    getProductId(): string {
        return "CREATE_GUILD";
    }

    validate(dto: CreateOrderWithAuthDto): ValidationResult {
        const errors: string[] = [];

        // 1. 验证必需参数：区服名
        if (!dto.serverName || dto.serverName.trim() === "") {
            errors.push("区服名(serverName)是必需的");
        }

        // 2. 验证扩展参数中的公会名（必需）
        if (!dto.extrasParams || !dto.extrasParams.guildName) {
            errors.push("公会名(extrasParams.guildName)是必需的");
        } else {
            const guildName = dto.extrasParams.guildName;

            // 验证公会名类型
            if (typeof guildName !== "string") {
                errors.push("公会名(extrasParams.guildName)必须是字符串");
            } else {
                // 验证公会名长度
                if (guildName.length < 2 || guildName.length > 20) {
                    errors.push("公会名长度必须在2-20个字符之间");
                }

                // 验证公会名格式
                const guildNamePattern = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;
                if (!guildNamePattern.test(guildName)) {
                    errors.push("公会名只能包含中文、英文、数字和下划线");
                }
            }
        }

        // 3. 验证可选参数：公会宣言
        if (dto.extrasParams?.guildDeclaration) {
            const declaration = dto.extrasParams.guildDeclaration;
            if (typeof declaration !== "string") {
                errors.push("公会宣言(extrasParams.guildDeclaration)必须是字符串");
            } else if (declaration.length > 200) {
                errors.push("公会宣言长度不能超过200个字符");
            }
        }

        // 4. 验证可选参数：公会标签
        if (dto.extrasParams?.guildTag) {
            const tag = dto.extrasParams.guildTag;
            if (typeof tag !== "string") {
                errors.push("公会标签(extrasParams.guildTag)必须是字符串");
            } else if (tag.length > 10) {
                errors.push("公会标签长度不能超过10个字符");
            }
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    getRequiredParams(): string[] {
        return ["serverName", "extrasParams.guildName"];
    }

    getOptionalParams(): string[] {
        return ["cpOrderNo", "extrasParams.guildDeclaration", "extrasParams.guildTag", "extrasParams.serverId"];
    }
}

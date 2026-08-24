import { Injectable, Logger } from "@nestjs/common";
import { PointRule } from "../types/point-rule.type";
import { PointRuleType } from "../enums/point-rule-type.enum";

/**
 * 积分规则服务
 * 负责根据规则和业务参数计算积分
 */
@Injectable()
export class PointRuleService {
    private readonly logger = new Logger(PointRuleService.name);

    /**
     * 计算积分
     * @param rule 积分规则
     * @param businessParams 业务参数
     * @returns 积分值
     */
    calculatePoints(rule: PointRule, businessParams?: Record<string, any>): number {
        // 外部任务的积分从 businessParams.pointsReward 中获取
        if (businessParams?.pointsReward !== undefined) {
            return Number(businessParams.pointsReward);
        }

        switch (rule.type) {
            case PointRuleType.FIXED:
                return this.calculateFixedPoints(rule.value);

            case PointRuleType.PER_AMOUNT:
                return this.calculatePerAmountPoints(rule.rate, businessParams);

            default:
                this.logger.warn(`未知的积分规则类型: ${(rule as any).type}`);
                return 0;
        }
    }

    /**
     * 计算固定积分
     */
    private calculateFixedPoints(value: number): number {
        return value;
    }

    /**
     * 计算按金额比例积分
     */
    private calculatePerAmountPoints(rate: number, businessParams?: Record<string, any>): number {
        if (!businessParams || !businessParams.amount) {
            this.logger.warn("按金额比例计算积分时缺少 amount 参数");
            return 0;
        }

        const amount = Number(businessParams.amount);
        if (isNaN(amount)) {
            this.logger.warn(`无效的 amount 值: ${businessParams.amount}`);
            return 0;
        }

        return Math.floor(amount * rate);
    }
}

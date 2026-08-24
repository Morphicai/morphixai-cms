import { PointRuleType } from "../enums/point-rule-type.enum";

/**
 * 固定积分规则
 */
export interface FixedPointRule {
    type: PointRuleType.FIXED;
    value: number;
}

/**
 * 按金额比例积分规则
 */
export interface PerAmountPointRule {
    type: PointRuleType.PER_AMOUNT;
    rate: number;
}

/**
 * 积分规则联合类型
 */
export type PointRule = FixedPointRule | PerAmountPointRule;

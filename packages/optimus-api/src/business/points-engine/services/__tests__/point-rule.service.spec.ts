import { Test, TestingModule } from "@nestjs/testing";
import { PointRuleService } from "../point-rule.service";
import { PointRuleType } from "../../enums/point-rule-type.enum";

describe("PointRuleService", () => {
    let service: PointRuleService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [PointRuleService],
        }).compile();

        service = module.get<PointRuleService>(PointRuleService);
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });

    describe("calculatePoints - FIXED", () => {
        it("应该返回固定积分值", () => {
            const rule = {
                type: PointRuleType.FIXED,
                value: 100,
            };

            const points = service.calculatePoints(rule);

            expect(points).toBe(100);
        });

        it("应该支持不同的固定值", () => {
            const rule = {
                type: PointRuleType.FIXED,
                value: 50,
            };

            const points = service.calculatePoints(rule);

            expect(points).toBe(50);
        });
    });

    describe("calculatePoints - PER_AMOUNT", () => {
        it("应该根据金额计算积分", () => {
            const rule = {
                type: PointRuleType.PER_AMOUNT,
                rate: 10,
            };

            const businessParams = {
                amount: 100,
            };

            const points = service.calculatePoints(rule, businessParams);

            expect(points).toBe(1000); // 100 * 10
        });

        it("应该向下取整", () => {
            const rule = {
                type: PointRuleType.PER_AMOUNT,
                rate: 0.5,
            };

            const businessParams = {
                amount: 99,
            };

            const points = service.calculatePoints(rule, businessParams);

            expect(points).toBe(49); // Math.floor(99 * 0.5)
        });

        it("缺少 amount 参数时应该返回 0", () => {
            const rule = {
                type: PointRuleType.PER_AMOUNT,
                rate: 10,
            };

            const points = service.calculatePoints(rule, {});

            expect(points).toBe(0);
        });

        it("amount 为无效值时应该返回 0", () => {
            const rule = {
                type: PointRuleType.PER_AMOUNT,
                rate: 10,
            };

            const businessParams = {
                amount: "invalid",
            };

            const points = service.calculatePoints(rule, businessParams);

            expect(points).toBe(0);
        });
    });

    describe("calculatePoints - 未知规则类型", () => {
        it("应该返回 0 并记录警告", () => {
            const rule = {
                type: "UNKNOWN" as any,
            };

            const points = service.calculatePoints(rule);

            expect(points).toBe(0);
        });
    });
});

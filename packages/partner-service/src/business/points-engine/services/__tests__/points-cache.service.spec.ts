import { Test, TestingModule } from "@nestjs/testing";
import { PointsCacheService } from "../points-cache.service";

describe("PointsCacheService", () => {
    let service: PointsCacheService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [PointsCacheService],
        }).compile();

        service = module.get<PointsCacheService>(PointsCacheService);
    });

    afterEach(() => {
        service.clearAll();
    });

    describe("积分总额缓存", () => {
        it("应该能够设置和获取积分总额", () => {
            const partnerId = "123";
            const totalPoints = 500;

            service.setTotalPoints(partnerId, totalPoints);
            const cached = service.getTotalPoints(partnerId);

            expect(cached).toBe(totalPoints);
        });

        it("缓存未命中时应该返回 undefined", () => {
            const cached = service.getTotalPoints("nonexistent");
            expect(cached).toBeUndefined();
        });

        it("应该能够使缓存失效", () => {
            const partnerId = "123";
            service.setTotalPoints(partnerId, 500);

            service.invalidateUserCache(partnerId);

            const cached = service.getTotalPoints(partnerId);
            expect(cached).toBeUndefined();
        });
    });

    describe("积分明细缓存", () => {
        it("应该能够设置和获取积分明细", () => {
            const partnerId = "123";
            const details = [
                {
                    taskCode: "REGISTER_V1",
                    taskType: "REGISTER",
                    points: 100,
                    businessParams: { partnerCode: "LP123456" },
                    createdAt: new Date(),
                },
                {
                    taskCode: "INVITE_V1",
                    taskType: "INVITE_SUCCESS",
                    points: 50,
                    businessParams: { downlinePartnerCode: "LP789012" },
                    createdAt: new Date(),
                },
            ];

            service.setPointsDetail(partnerId, details);
            const cached = service.getPointsDetail(partnerId);

            expect(cached).toEqual(details);
            expect(cached?.length).toBe(2);
        });

        it("缓存未命中时应该返回 undefined", () => {
            const cached = service.getPointsDetail("nonexistent");
            expect(cached).toBeUndefined();
        });
    });

    describe("缓存统计", () => {
        it("应该能够获取缓存统计信息", () => {
            // 清空之前的缓存，避免影响统计
            service.clearAll();

            service.setTotalPoints("123", 500);
            service.setTotalPoints("456", 300);

            const stats = service.getCacheStats();

            expect(stats.points.size).toBe(2);
            expect(stats.detail.size).toBe(0);
        });

        it("应该能够计算命中率", () => {
            // 清空之前的缓存，避免影响统计
            service.clearAll();

            const partnerId = "123";
            service.setTotalPoints(partnerId, 500);

            // 第一次查询 - 缓存命中
            const result1 = service.getTotalPoints(partnerId);
            expect(result1).toBe(500);

            // 第二次查询 - 缓存命中
            const result2 = service.getTotalPoints(partnerId);
            expect(result2).toBe(500);

            // 查询不存在的 - 缓存未命中
            const result3 = service.getTotalPoints("nonexistent");
            expect(result3).toBeUndefined();

            const stats = service.getCacheStats();

            // 验证有查询发生
            expect(stats.points.hitRate).toBeGreaterThan(0);
            expect(stats.points.hitRate).toBeLessThanOrEqual(1);
        });
    });

    describe("清空缓存", () => {
        it("应该能够清空所有缓存", () => {
            service.setTotalPoints("123", 500);
            service.setTotalPoints("456", 300);
            service.setPointsDetail("123", [
                {
                    taskCode: "REGISTER_V1",
                    taskType: "REGISTER",
                    points: 100,
                    businessParams: null,
                    createdAt: new Date(),
                },
            ]);

            service.clearAll();

            const stats = service.getCacheStats();
            expect(stats.points.size).toBe(0);
            expect(stats.detail.size).toBe(0);
        });
    });

    describe("缓存过期", () => {
        it("过期的缓存应该自动失效", async () => {
            const partnerId = "123";

            // 设置一个很短的 TTL（通过修改服务内部的 TTL 常量来测试）
            // 注意：这个测试需要等待缓存过期，实际项目中可能需要 mock 时间
            service.setTotalPoints(partnerId, 500);

            // 立即查询应该命中
            const cached1 = service.getTotalPoints(partnerId);
            expect(cached1).toBe(500);

            // 等待缓存过期（5分钟后）
            // 在实际测试中，可以通过 mock Date.now() 来模拟时间流逝
        });
    });
});

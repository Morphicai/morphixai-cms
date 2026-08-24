import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { GameActionTaskHandler } from "../game-action-task.handler";
import { TaskCompletionLogEntity } from "../../entities/task-completion-log.entity";
import { TaskType } from "../../enums/task-type.enum";
import { PointRuleType } from "../../enums/point-rule-type.enum";
import { TaskConfig } from "../../types/task-config.type";

// 2026-08-24 修复:同 register-task/invite-task,handle() 加了 config 参数、
// 构造函数加了 TaskCompletionLogEntity 仓库依赖,测试没跟上签名变化
describe("GameActionTaskHandler", () => {
    let handler: GameActionTaskHandler;

    const mockRepository = {
        count: jest.fn(),
    };

    const baseConfig: TaskConfig = {
        taskCode: "GAME_ACTION",
        taskType: TaskType.GAME_ACTION,
        triggerEventType: "game_action",
        pointRule: { type: PointRuleType.FIXED, value: 50 },
        enabled: true,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameActionTaskHandler,
                {
                    provide: getRepositoryToken(TaskCompletionLogEntity),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        handler = module.get<GameActionTaskHandler>(GameActionTaskHandler);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should be defined", () => {
        expect(handler).toBeDefined();
    });

    it("应该有正确的任务类型", () => {
        expect(handler.taskType).toBe(TaskType.GAME_ACTION);
    });

    describe("handle", () => {
        it("应该成功处理游戏升级任务", async () => {
            const event = {
                taskCode: "GAME_LEVEL_UP_10",
                partnerId: "1",
                partnerCode: "LP123456",
                uid: "user123",
                timestamp: Date.now(),
                businessParams: {
                    level: 10,
                    characterClass: "Warrior",
                },
            };

            const result = await handler.handle(event, baseConfig);

            expect(result.isValid).toBe(true);
            expect(result.partnerId).toBe("1");
            expect(result.uid).toBe("user123");
            expect(result.businessParams).toEqual({
                level: 10,
                characterClass: "Warrior",
            });
        });

        it("应该成功处理首次充值任务", async () => {
            const event = {
                taskCode: "FIRST_RECHARGE",
                partnerId: "2",
                partnerCode: "LP789012",
                uid: "user456",
                timestamp: Date.now(),
                businessParams: {
                    amount: 100,
                    currency: "USD",
                    orderId: "ORDER123456",
                },
            };

            const result = await handler.handle(event, baseConfig);

            expect(result.isValid).toBe(true);
            expect(result.partnerId).toBe("2");
            expect(result.uid).toBe("user456");
            expect(result.businessParams).toEqual({
                amount: 100,
                currency: "USD",
                orderId: "ORDER123456",
            });
        });

        it("应该成功处理副本通关任务", async () => {
            const event = {
                taskCode: "FIRST_DUNGEON_CLEAR",
                partnerId: "3",
                partnerCode: "LP345678",
                uid: "user789",
                timestamp: Date.now(),
                businessParams: {
                    dungeonId: "DUNGEON_001",
                    clearTime: 1800,
                    difficulty: "NORMAL",
                },
            };

            const result = await handler.handle(event, baseConfig);

            expect(result.isValid).toBe(true);
            expect(result.partnerId).toBe("3");
            expect(result.uid).toBe("user789");
            expect(result.businessParams).toEqual({
                dungeonId: "DUNGEON_001",
                clearTime: 1800,
                difficulty: "NORMAL",
            });
        });

        it("应该处理空的 businessParams", async () => {
            const event = {
                taskCode: "SOME_TASK",
                partnerId: "4",
                partnerCode: "LP999999",
                uid: "user999",
                timestamp: Date.now(),
                businessParams: {},
            };

            const result = await handler.handle(event, baseConfig);

            expect(result.isValid).toBe(true);
            expect(result.partnerId).toBe("4");
            expect(result.uid).toBe("user999");
            expect(result.businessParams).toEqual({});
        });

        it("已达到次数上限时应该拒绝", async () => {
            mockRepository.count.mockResolvedValue(3);
            const event = {
                taskCode: "GAME_LEVEL_UP_10",
                partnerId: "1",
                partnerCode: "LP123456",
                uid: "user123",
                timestamp: Date.now(),
                businessParams: {},
            };

            const result = await handler.handle(event, { ...baseConfig, maxCompletionCount: 3 });

            expect(result.isValid).toBe(false);
            expect(result.reason).toBe("任务已达到上限（3次）");
        });
    });
});

import { Test, TestingModule } from "@nestjs/testing";
import { GameActionTaskHandler } from "../game-action-task.handler";
import { TaskType } from "../../enums/task-type.enum";

describe("GameActionTaskHandler", () => {
    let handler: GameActionTaskHandler;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [GameActionTaskHandler],
        }).compile();

        handler = module.get<GameActionTaskHandler>(GameActionTaskHandler);
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

            const result = await handler.handle(event);

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

            const result = await handler.handle(event);

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

            const result = await handler.handle(event);

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

            const result = await handler.handle(event);

            expect(result.isValid).toBe(true);
            expect(result.partnerId).toBe("4");
            expect(result.uid).toBe("user999");
            expect(result.businessParams).toEqual({});
        });
    });
});

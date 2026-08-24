import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { RegisterTaskHandler } from "../register-task.handler";
import { TaskCompletionLogEntity } from "../../entities/task-completion-log.entity";
import { TaskType } from "../../enums/task-type.enum";
import { PointRuleType } from "../../enums/point-rule-type.enum";
import { PartnerEventType } from "../../../partner/events/partner-event.dto";
import { TaskConfig } from "../../types/task-config.type";

// 2026-08-24 修复:handle() 后来加了第二个参数 config(用于读取
// maxCompletionCount 做次数限制),构造函数也加了 TaskCompletionLogEntity
// 仓库依赖(用于查询已完成次数)——这两处都是签名变了,测试没跟上
describe("RegisterTaskHandler", () => {
    let handler: RegisterTaskHandler;

    const mockRepository = {
        count: jest.fn(),
    };

    const baseConfig: TaskConfig = {
        taskCode: "REGISTER",
        taskType: TaskType.REGISTER,
        triggerEventType: PartnerEventType.REGISTER_SELF,
        pointRule: { type: PointRuleType.FIXED, value: 100 },
        enabled: true,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RegisterTaskHandler,
                {
                    provide: getRepositoryToken(TaskCompletionLogEntity),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        handler = module.get<RegisterTaskHandler>(RegisterTaskHandler);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should be defined", () => {
        expect(handler).toBeDefined();
    });

    it("应该有正确的任务类型", () => {
        expect(handler.taskType).toBe(TaskType.REGISTER);
    });

    describe("handle", () => {
        it("应该成功处理注册事件", async () => {
            const timestamp = Date.now();
            const event = {
                eventType: PartnerEventType.REGISTER_SELF as const,
                partnerId: "1",
                partnerCode: "LP123456",
                uid: "user123",
                timestamp,
            };

            const result = await handler.handle(event, baseConfig);

            expect(result.isValid).toBe(true);
            expect(result.partnerId).toBe("1");
            expect(result.uid).toBe("user123");
            expect(result.businessParams).toEqual({
                partnerCode: "LP123456",
                registerTime: timestamp,
            });
        });

        it("应该处理不同的用户", async () => {
            const timestamp = Date.now();
            const event = {
                eventType: PartnerEventType.REGISTER_SELF as const,
                partnerId: "999",
                partnerCode: "LP999999",
                uid: "user999",
                timestamp,
            };

            const result = await handler.handle(event, baseConfig);

            expect(result.isValid).toBe(true);
            expect(result.partnerId).toBe("999");
            expect(result.uid).toBe("user999");
            expect(result.businessParams).toEqual({
                partnerCode: "LP999999",
                registerTime: timestamp,
            });
        });

        it("已达到次数上限时应该拒绝", async () => {
            mockRepository.count.mockResolvedValue(1);
            const event = {
                eventType: PartnerEventType.REGISTER_SELF as const,
                partnerId: "1",
                partnerCode: "LP123456",
                uid: "user123",
                timestamp: Date.now(),
            };

            const result = await handler.handle(event, { ...baseConfig, maxCompletionCount: 1 });

            expect(result.isValid).toBe(false);
            expect(result.reason).toBe("注册任务已完成");
        });
    });
});

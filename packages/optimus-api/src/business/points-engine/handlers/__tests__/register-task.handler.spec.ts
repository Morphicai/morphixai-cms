import { Test, TestingModule } from "@nestjs/testing";
import { RegisterTaskHandler } from "../register-task.handler";
import { TaskType } from "../../enums/task-type.enum";
import { PartnerEventType } from "../../../partner/events/partner-event.dto";

describe("RegisterTaskHandler", () => {
    let handler: RegisterTaskHandler;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [RegisterTaskHandler],
        }).compile();

        handler = module.get<RegisterTaskHandler>(RegisterTaskHandler);
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

            const result = await handler.handle(event);

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

            const result = await handler.handle(event);

            expect(result.isValid).toBe(true);
            expect(result.partnerId).toBe("999");
            expect(result.uid).toBe("user999");
            expect(result.businessParams).toEqual({
                partnerCode: "LP999999",
                registerTime: timestamp,
            });
        });
    });
});

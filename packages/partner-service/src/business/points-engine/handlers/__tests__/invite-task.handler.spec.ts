import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { InviteTaskHandler } from "../invite-task.handler";
import { TaskCompletionLogEntity } from "../../entities/task-completion-log.entity";
import { TaskType } from "../../enums/task-type.enum";
import { PartnerEventType } from "../../../partner/events/partner-event.dto";

describe("InviteTaskHandler", () => {
    let handler: InviteTaskHandler;
    let repository: Repository<TaskCompletionLogEntity>;

    const mockRepository = {
        findOne: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InviteTaskHandler,
                {
                    provide: getRepositoryToken(TaskCompletionLogEntity),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        handler = module.get<InviteTaskHandler>(InviteTaskHandler);
        repository = module.get<Repository<TaskCompletionLogEntity>>(getRepositoryToken(TaskCompletionLogEntity));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should be defined", () => {
        expect(handler).toBeDefined();
    });

    it("应该有正确的任务类型", () => {
        expect(handler.taskType).toBe(TaskType.INVITE_SUCCESS);
    });

    describe("handle", () => {
        it("应该成功处理邀请事件", async () => {
            const timestamp = Date.now();
            const event = {
                eventType: PartnerEventType.REGISTER_DOWNLINE_L1 as const,
                partnerId: "1",
                partnerCode: "LP123456",
                uid: "user1",
                downlinePartnerId: "2",
                downlinePartnerCode: "LP789012",
                downlineUid: "user2",
                sourceChannelId: "channel1",
                timestamp,
            };

            mockRepository.findOne.mockResolvedValue(null);

            const result = await handler.handle(event);

            expect(result.isValid).toBe(true);
            expect(result.partnerId).toBe("1");
            expect(result.uid).toBe("user1");
            expect(result.relatedPartnerId).toBe("2");
            expect(result.relatedUid).toBe("user2");
            expect(result.businessParams).toEqual({
                inviterPartnerCode: "LP123456",
                downlinePartnerCode: "LP789012",
                sourceChannelId: "channel1",
                inviteTime: timestamp,
            });
        });

        it("邀请关系已奖励时应该返回失败", async () => {
            const event = {
                eventType: PartnerEventType.REGISTER_DOWNLINE_L1 as const,
                partnerId: "1",
                partnerCode: "LP123456",
                uid: "user1",
                downlinePartnerId: "2",
                downlinePartnerCode: "LP789012",
                downlineUid: "user2",
                timestamp: Date.now(),
            };

            mockRepository.findOne.mockResolvedValue({
                id: "1",
                taskType: TaskType.INVITE_SUCCESS,
                partnerId: "1",
                relatedPartnerId: "2",
            });

            const result = await handler.handle(event);

            expect(result.isValid).toBe(false);
            expect(result.reason).toBe("邀请关系已奖励");
        });

        it("应该正确查询已有记录", async () => {
            const event = {
                eventType: PartnerEventType.REGISTER_DOWNLINE_L1 as const,
                partnerId: "1",
                partnerCode: "LP123456",
                uid: "user1",
                downlinePartnerId: "2",
                downlinePartnerCode: "LP789012",
                downlineUid: "user2",
                timestamp: Date.now(),
            };

            mockRepository.findOne.mockResolvedValue(null);

            await handler.handle(event);

            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: {
                    taskType: TaskType.INVITE_SUCCESS,
                    partnerId: "1",
                    relatedPartnerId: "2",
                },
            });
        });
    });
});

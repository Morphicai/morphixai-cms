import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { InviteTaskHandler } from "../invite-task.handler";
import { TaskCompletionLogEntity } from "../../entities/task-completion-log.entity";
import { TaskType } from "../../enums/task-type.enum";
import { PointRuleType } from "../../enums/point-rule-type.enum";
import { PartnerEventType } from "../../../partner/events/partner-event.dto";
import { TaskConfig } from "../../types/task-config.type";

// 2026-08-24 修复:handle() 加了 config 参数(次数限制读 config.maxCompletionCount)。
// 另外查重逻辑本身也改了——之前按 taskType 查重复奖励记录,现在改成按 config.taskCode
// 查(代码里留着注释"✅ 使用 taskCode 而不是 taskType"),同一个 taskType 下可以有多个
// taskCode 的邀请任务(比如"邀请1人"和"邀请5人"分别计次),按 taskType 查会把它们混在一起
// 误判为已奖励,这是当时的真实修复,测试的断言要跟着改成 taskCode
describe("InviteTaskHandler", () => {
    let handler: InviteTaskHandler;
    let repository: Repository<TaskCompletionLogEntity>;

    const mockRepository = {
        findOne: jest.fn(),
        count: jest.fn(),
    };

    const baseConfig: TaskConfig = {
        taskCode: "INVITE_L1",
        taskType: TaskType.INVITE_SUCCESS,
        triggerEventType: PartnerEventType.REGISTER_DOWNLINE_L1,
        pointRule: { type: PointRuleType.FIXED, value: 200 },
        enabled: true,
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

            const result = await handler.handle(event, baseConfig);

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
                taskCode: baseConfig.taskCode,
                partnerId: "1",
                relatedPartnerId: "2",
            });

            const result = await handler.handle(event, baseConfig);

            expect(result.isValid).toBe(false);
            expect(result.reason).toBe("邀请关系已奖励");
        });

        it("应该按 taskCode(而非 taskType)查询已有记录", async () => {
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

            await handler.handle(event, baseConfig);

            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: {
                    taskCode: baseConfig.taskCode,
                    partnerId: "1",
                    relatedPartnerId: "2",
                },
            });
        });

        it("已达到次数上限时应该拒绝", async () => {
            mockRepository.count.mockResolvedValue(1);
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

            const result = await handler.handle(event, { ...baseConfig, maxCompletionCount: 1 });

            expect(result.isValid).toBe(false);
            expect(result.reason).toBe("邀请任务已达到上限（1次）");
            // 命中次数上限就应该提前返回,不用再去查重复奖励记录
            expect(mockRepository.findOne).not.toHaveBeenCalled();
        });
    });
});

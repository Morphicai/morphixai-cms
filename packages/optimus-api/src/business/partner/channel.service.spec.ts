import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ChannelService } from "./channel.service";
import { PartnerChannelEntity } from "./entities/partner-channel.entity";
import { PartnerProfileEntity } from "./entities/partner-profile.entity";
import { ChannelStatus } from "./enums/channel-status.enum";
import { InvalidChannelException, ChannelNotBelongToInviterException } from "./exceptions/partner.exception";

describe("ChannelService", () => {
    let service: ChannelService;
    let channelRepository: Repository<PartnerChannelEntity>;
    let profileRepository: Repository<PartnerProfileEntity>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChannelService,
                {
                    provide: getRepositoryToken(PartnerChannelEntity),
                    useValue: {
                        findOne: jest.fn(),
                        save: jest.fn(),
                        create: jest.fn(),
                        find: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(PartnerProfileEntity),
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<ChannelService>(ChannelService);
        channelRepository = module.get<Repository<PartnerChannelEntity>>(getRepositoryToken(PartnerChannelEntity));
        profileRepository = module.get<Repository<PartnerProfileEntity>>(getRepositoryToken(PartnerProfileEntity));
    });

    describe("disableChannel", () => {
        it("应该成功禁用渠道", async () => {
            const channelId = "1";
            const partnerId = "100";
            const mockChannel = {
                id: channelId,
                partnerId,
                channelCode: "CH1234",
                status: ChannelStatus.ACTIVE,
            } as PartnerChannelEntity;

            jest.spyOn(channelRepository, "findOne").mockResolvedValue(mockChannel);
            jest.spyOn(channelRepository, "save").mockResolvedValue({
                ...mockChannel,
                status: ChannelStatus.DISABLED,
            });

            await service.disableChannel(channelId, partnerId);

            expect(channelRepository.findOne).toHaveBeenCalledWith({
                where: { id: channelId },
            });
            expect(channelRepository.save).toHaveBeenCalledWith({
                ...mockChannel,
                status: ChannelStatus.DISABLED,
            });
        });

        it("应该在渠道不存在时抛出InvalidChannelException", async () => {
            const channelId = "999";
            const partnerId = "100";

            jest.spyOn(channelRepository, "findOne").mockResolvedValue(null);

            await expect(service.disableChannel(channelId, partnerId)).rejects.toThrow(InvalidChannelException);
        });

        it("应该在渠道不属于该合伙人时抛出ChannelNotBelongToInviterException", async () => {
            const channelId = "1";
            const partnerId = "100";
            const otherPartnerId = "200";
            const mockChannel = {
                id: channelId,
                partnerId: otherPartnerId,
                channelCode: "CH1234",
                status: ChannelStatus.ACTIVE,
            } as PartnerChannelEntity;

            jest.spyOn(channelRepository, "findOne").mockResolvedValue(mockChannel);

            await expect(service.disableChannel(channelId, partnerId)).rejects.toThrow(
                ChannelNotBelongToInviterException,
            );
        });

        it("应该保留历史数据而不删除记录", async () => {
            const channelId = "1";
            const partnerId = "100";
            const mockChannel = {
                id: channelId,
                partnerId,
                channelCode: "CH1234",
                status: ChannelStatus.ACTIVE,
            } as PartnerChannelEntity;

            jest.spyOn(channelRepository, "findOne").mockResolvedValue(mockChannel);
            const saveSpy = jest.spyOn(channelRepository, "save").mockResolvedValue({
                ...mockChannel,
                status: ChannelStatus.DISABLED,
            });

            await service.disableChannel(channelId, partnerId);

            // 验证调用了save而不是delete
            expect(saveSpy).toHaveBeenCalled();
            // 验证状态被更新为DISABLED
            expect(saveSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: ChannelStatus.DISABLED,
                }),
            );
        });
    });
});

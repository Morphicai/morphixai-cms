import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PartnerService } from "./partner.service";
import { HierarchyService } from "./hierarchy.service";
import { PartnerProfileEntity } from "./entities/partner-profile.entity";
import { PartnerChannelEntity } from "./entities/partner-channel.entity";
import { AdminOperationLogEntity } from "./entities/admin-operation-log.entity";
import { PartnerStatus } from "./enums/partner-status.enum";
import { StarLevel } from "./enums/star-level.enum";
import { ChannelStatus } from "./enums/channel-status.enum";
import { JoinMode } from "./dto/join-partner.dto";
import {
    InvalidInviterException,
    InvalidChannelException,
    DuplicateUserIdException,
} from "./exceptions/partner.exception";

describe("PartnerService", () => {
    let service: PartnerService;
    let profileRepository: Repository<PartnerProfileEntity>;
    let channelRepository: Repository<PartnerChannelEntity>;
    let hierarchyService: HierarchyService;

    const mockProfileRepository = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    };

    const mockChannelRepository = {
        findOne: jest.fn(),
    };

    const mockAdminLogRepository = {
        create: jest.fn(),
        save: jest.fn(),
    };

    const mockHierarchyService = {
        createRelationship: jest.fn(),
    };

    const mockEventEmitter = {
        emit: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PartnerService,
                {
                    provide: getRepositoryToken(PartnerProfileEntity),
                    useValue: mockProfileRepository,
                },
                {
                    provide: getRepositoryToken(PartnerChannelEntity),
                    useValue: mockChannelRepository,
                },
                {
                    provide: getRepositoryToken(AdminOperationLogEntity),
                    useValue: mockAdminLogRepository,
                },
                {
                    provide: HierarchyService,
                    useValue: mockHierarchyService,
                },
                {
                    provide: EventEmitter2,
                    useValue: mockEventEmitter,
                },
            ],
        }).compile();

        service = module.get<PartnerService>(PartnerService);
        profileRepository = module.get<Repository<PartnerProfileEntity>>(getRepositoryToken(PartnerProfileEntity));
        channelRepository = module.get<Repository<PartnerChannelEntity>>(getRepositoryToken(PartnerChannelEntity));
        hierarchyService = module.get<HierarchyService>(HierarchyService);

        // Reset mocks
        jest.clearAllMocks();
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });

    describe("generatePartnerCode", () => {
        it("should generate a partner code with LP prefix and 6 digits", async () => {
            mockProfileRepository.findOne.mockResolvedValue(null);

            const code = await service.generatePartnerCode();

            expect(code).toMatch(/^LP\d{6}$/);
        });

        it("should retry if code already exists", async () => {
            mockProfileRepository.findOne
                .mockResolvedValueOnce({ partnerCode: "LP123456" })
                .mockResolvedValueOnce(null);

            const code = await service.generatePartnerCode();

            expect(code).toMatch(/^LP\d{6}$/);
            expect(mockProfileRepository.findOne).toHaveBeenCalledTimes(2);
        });
    });

    describe("getProfileByUid", () => {
        it("should return profile if exists", async () => {
            const mockProfile = { uid: "test-uid", partnerCode: "LP123456" };
            mockProfileRepository.findOne.mockResolvedValue(mockProfile);

            const result = await service.getProfileByUid("test-uid");

            expect(result).toEqual(mockProfile);
            expect(mockProfileRepository.findOne).toHaveBeenCalledWith({
                where: { uid: "test-uid" },
            });
        });

        it("should return null if not exists", async () => {
            mockProfileRepository.findOne.mockResolvedValue(null);

            const result = await service.getProfileByUid("test-uid");

            expect(result).toBeNull();
        });
    });

    describe("getProfileByCode", () => {
        it("should return profile if exists", async () => {
            const mockProfile = { uid: "test-uid", partnerCode: "LP123456" };
            mockProfileRepository.findOne.mockResolvedValue(mockProfile);

            const result = await service.getProfileByCode("LP123456");

            expect(result).toEqual(mockProfile);
            expect(mockProfileRepository.findOne).toHaveBeenCalledWith({
                where: { partnerCode: "LP123456" },
            });
        });
    });

    describe("createProfile", () => {
        it("should create a new partner profile", async () => {
            const uid = "test-uid";
            const partnerCode = "LP123456";
            const mockProfile = {
                uid,
                partnerCode,
                status: PartnerStatus.ACTIVE,
                currentStar: "NEW",
                totalMira: "0",
            };

            mockProfileRepository.findOne.mockResolvedValue(null);
            mockProfileRepository.create.mockReturnValue(mockProfile);
            mockProfileRepository.save.mockResolvedValue(mockProfile);

            const result = await service.createProfile(uid, partnerCode);

            expect(result).toEqual(mockProfile);
            expect(mockProfileRepository.create).toHaveBeenCalledWith({
                uid,
                partnerCode,
                status: PartnerStatus.ACTIVE,
                currentStar: StarLevel.NEW,
                totalMira: "0",
            });
        });

        it("should throw DuplicateUserIdException if uid already exists", async () => {
            mockProfileRepository.findOne.mockResolvedValue({ uid: "test-uid" });

            await expect(service.createProfile("test-uid", "LP123456")).rejects.toThrow(DuplicateUserIdException);
        });
    });

    describe("validateInviter", () => {
        it("should return inviter if valid", async () => {
            const mockInviter = {
                partnerId: "1",
                partnerCode: "LP123456",
                status: PartnerStatus.ACTIVE,
            };
            mockProfileRepository.findOne.mockResolvedValue(mockInviter);

            const result = await service.validateInviter("LP123456");

            expect(result).toEqual(mockInviter);
        });

        it("should throw InvalidInviterException if inviter not found", async () => {
            mockProfileRepository.findOne.mockResolvedValue(null);

            await expect(service.validateInviter("LP999999")).rejects.toThrow(InvalidInviterException);
        });

        it("should throw InvalidInviterException if inviter is frozen", async () => {
            const mockInviter = {
                partnerId: "1",
                partnerCode: "LP123456",
                status: PartnerStatus.FROZEN,
            };
            mockProfileRepository.findOne.mockResolvedValue(mockInviter);

            await expect(service.validateInviter("LP123456")).rejects.toThrow(InvalidInviterException);
        });
    });

    describe("validateChannel", () => {
        it("should return channel if valid", async () => {
            const mockChannel = {
                id: "1",
                partnerId: "1",
                channelCode: "CH001",
                status: ChannelStatus.ACTIVE,
            };
            mockChannelRepository.findOne.mockResolvedValue(mockChannel);

            const result = await service.validateChannel("1", "CH001");

            expect(result).toEqual(mockChannel);
        });

        it("should throw InvalidChannelException if channel not found", async () => {
            mockChannelRepository.findOne.mockResolvedValue(null);

            await expect(service.validateChannel("1", "CH999")).rejects.toThrow(InvalidChannelException);
        });

        it("should throw InvalidChannelException if channel is disabled", async () => {
            const mockChannel = {
                id: "1",
                partnerId: "1",
                channelCode: "CH001",
                status: ChannelStatus.DISABLED,
            };
            mockChannelRepository.findOne.mockResolvedValue(mockChannel);

            await expect(service.validateChannel("1", "CH001")).rejects.toThrow(InvalidChannelException);
        });
    });

    describe("joinPartner", () => {
        describe("self mode", () => {
            it("should create partner profile without uplink", async () => {
                const uid = "test-uid";
                const mockProfile = {
                    uid,
                    partnerCode: "LP123456",
                    status: PartnerStatus.ACTIVE,
                };

                mockProfileRepository.findOne.mockResolvedValue(null);
                mockProfileRepository.create.mockReturnValue(mockProfile);
                mockProfileRepository.save.mockResolvedValue(mockProfile);

                const result = await service.joinPartner(uid, { mode: JoinMode.SELF });

                expect(result).toEqual(mockProfile);
                expect(mockProfileRepository.findOne).toHaveBeenCalledWith({
                    where: { uid },
                });
            });
        });

        describe("invite mode", () => {
            it("should create partner profile with valid inviter", async () => {
                const uid = "test-uid";
                const inviterCode = "LP123456";
                const mockInviter = {
                    partnerId: "1",
                    partnerCode: inviterCode,
                    status: PartnerStatus.ACTIVE,
                };
                const mockProfile = {
                    uid,
                    partnerCode: "LP789012",
                    status: PartnerStatus.ACTIVE,
                };

                // Spy on service methods
                jest.spyOn(service, "getProfileByUid").mockResolvedValue(null);
                jest.spyOn(service, "validateInviter").mockResolvedValue(mockInviter as any);
                jest.spyOn(service, "createProfile").mockResolvedValue(mockProfile as any);

                const result = await service.joinPartner(uid, {
                    mode: JoinMode.INVITE,
                    inviterCode,
                });

                expect(result).toEqual(mockProfile);
                expect(service.validateInviter).toHaveBeenCalledWith(inviterCode);
            });

            it("should validate channel if provided", async () => {
                const uid = "test-uid";
                const inviterCode = "LP123456";
                const channelCode = "CH001";
                const mockInviter = {
                    partnerId: "1",
                    partnerCode: inviterCode,
                    status: PartnerStatus.ACTIVE,
                };
                const mockChannel = {
                    id: "1",
                    partnerId: "1",
                    channelCode,
                    status: ChannelStatus.ACTIVE,
                };
                const mockProfile = {
                    uid,
                    partnerCode: "LP789012",
                    status: PartnerStatus.ACTIVE,
                };

                // Spy on service methods
                jest.spyOn(service, "getProfileByUid").mockResolvedValue(null);
                jest.spyOn(service, "validateInviter").mockResolvedValue(mockInviter as any);
                jest.spyOn(service, "validateChannel").mockResolvedValue(mockChannel as any);
                jest.spyOn(service, "createProfile").mockResolvedValue(mockProfile as any);

                const result = await service.joinPartner(uid, {
                    mode: JoinMode.INVITE,
                    inviterCode,
                    channelCode,
                });

                expect(result).toEqual(mockProfile);
                expect(service.validateInviter).toHaveBeenCalledWith(inviterCode);
                expect(service.validateChannel).toHaveBeenCalledWith("1", channelCode);
            });

            it("should throw InvalidInviterException if inviter invalid", async () => {
                const uid = "test-uid";
                const inviterCode = "LP999999";

                mockProfileRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

                await expect(
                    service.joinPartner(uid, {
                        mode: JoinMode.INVITE,
                        inviterCode,
                    }),
                ).rejects.toThrow(InvalidInviterException);
            });
        });

        describe("idempotency", () => {
            it("should return existing profile if already registered", async () => {
                const uid = "test-uid";
                const existingProfile = {
                    uid,
                    partnerCode: "LP123456",
                    status: PartnerStatus.ACTIVE,
                };

                mockProfileRepository.findOne.mockResolvedValue(existingProfile);

                const result = await service.joinPartner(uid, { mode: JoinMode.SELF });

                expect(result).toEqual(existingProfile);
                expect(mockProfileRepository.create).not.toHaveBeenCalled();
                expect(mockProfileRepository.save).not.toHaveBeenCalled();
            });
        });
    });
});

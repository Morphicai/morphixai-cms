import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ConfigService } from "@nestjs/config";
import { PartnerService } from "../partner.service";
import { PartnerProfileEntity } from "../entities/partner-profile.entity";
import { PartnerChannelEntity } from "../entities/partner-channel.entity";
import { AdminOperationLogEntity } from "../entities/admin-operation-log.entity";
import { HierarchyService } from "../hierarchy.service";
import { ValidationService } from "../../../shared/services/validation.service";
import { PartnerStatus } from "../enums/partner-status.enum";
import { StarLevel } from "../enums/star-level.enum";

describe("PartnerService - 团队名称敏感词校验", () => {
    let service: PartnerService;
    let validationService: ValidationService;
    let profileRepository: Repository<PartnerProfileEntity>;

    const mockProfile: PartnerProfileEntity = {
        partnerId: "1",
        uid: "test_user_123",
        userId: "test_user_123",
        userSource: "game",
        username: "测试用户",
        partnerCode: "LP123456",
        status: PartnerStatus.ACTIVE,
        currentStar: StarLevel.NEW,
        totalMira: "0",
        teamName: "正常团队名称",
        joinTime: new Date(),
        lastUpdateTime: new Date(),
        remark: null,
        extraData: null,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PartnerService,
                {
                    provide: getRepositoryToken(PartnerProfileEntity),
                    useValue: {
                        findOne: jest.fn(),
                        save: jest.fn(),
                        create: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(PartnerChannelEntity),
                    useValue: {},
                },
                {
                    provide: getRepositoryToken(AdminOperationLogEntity),
                    useValue: {},
                },
                {
                    provide: HierarchyService,
                    useValue: {
                        getUplink: jest.fn(),
                    },
                },
                {
                    provide: EventEmitter2,
                    useValue: {
                        emit: jest.fn(),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string, defaultValue?: any) => {
                            const config = {
                                SENSITIVE_WORD_ENABLED: false,
                                SENSITIVE_WORD_API_URL: "",
                                SENSITIVE_WORD_API_KEY: "",
                            };
                            return config[key] ?? defaultValue;
                        }),
                    },
                },
                ValidationService, // 使用真实的 ValidationService
            ],
        }).compile();

        service = module.get<PartnerService>(PartnerService);
        validationService = module.get<ValidationService>(ValidationService);
        profileRepository = module.get<Repository<PartnerProfileEntity>>(getRepositoryToken(PartnerProfileEntity));
    });

    describe("updateTeamName - 更新团队名称", () => {
        it("应该成功更新正常的团队名称", async () => {
            // Arrange
            const uid = "test_user_123";
            const teamName = "精英战队";

            jest.spyOn(profileRepository, "findOne").mockResolvedValue(mockProfile);
            jest.spyOn(profileRepository, "save").mockResolvedValue({ ...mockProfile, teamName });

            // Act
            await service.updateTeamName(uid, teamName);

            // Assert
            expect(profileRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    teamName: "精英战队",
                }),
            );
        });

        it("应该拦截包含敏感词的团队名称", async () => {
            // Arrange
            const uid = "test_user_123";
            const sensitiveTeamName = "官方客服团队"; // 包含敏感词"官方"

            jest.spyOn(profileRepository, "findOne").mockResolvedValue(mockProfile);

            // Act & Assert
            await expect(service.updateTeamName(uid, sensitiveTeamName)).rejects.toThrow(BadRequestException);
            await expect(service.updateTeamName(uid, sensitiveTeamName)).rejects.toThrow(
                "团队名称包含敏感词，请重新输入",
            );
        });

        it("应该拦截包含外挂相关敏感词的团队名称", async () => {
            // Arrange
            const uid = "test_user_123";
            const sensitiveTeamName = "外挂工作室"; // 包含敏感词"外挂"

            jest.spyOn(profileRepository, "findOne").mockResolvedValue(mockProfile);

            // Act & Assert
            await expect(service.updateTeamName(uid, sensitiveTeamName)).rejects.toThrow(BadRequestException);
        });

        it("应该拦截包含代练相关敏感词的团队名称", async () => {
            // Arrange
            const uid = "test_user_123";
            const sensitiveTeamName = "专业代练团队"; // 包含敏感词"代练"

            jest.spyOn(profileRepository, "findOne").mockResolvedValue(mockProfile);

            // Act & Assert
            await expect(service.updateTeamName(uid, sensitiveTeamName)).rejects.toThrow(BadRequestException);
        });

        it("应该允许空团队名称", async () => {
            // Arrange
            const uid = "test_user_123";
            const teamName = "";

            jest.spyOn(profileRepository, "findOne").mockResolvedValue(mockProfile);
            jest.spyOn(profileRepository, "save").mockResolvedValue({ ...mockProfile, teamName: null });

            // Act
            await service.updateTeamName(uid, teamName);

            // Assert
            expect(profileRepository.save).toHaveBeenCalled();
        });

        it("应该通过正常的团队名称（不包含敏感词）", async () => {
            // Arrange
            const uid = "test_user_123";
            const normalTeamNames = ["勇士联盟", "传奇战队", "精英小队", "冒险者公会", "星辰战团"];

            jest.spyOn(profileRepository, "findOne").mockResolvedValue(mockProfile);
            jest.spyOn(profileRepository, "save").mockResolvedValue(mockProfile);

            // Act & Assert
            for (const teamName of normalTeamNames) {
                await expect(service.updateTeamName(uid, teamName)).resolves.not.toThrow();
            }
        });
    });

    describe("joinPartner - 加入合伙人计划时的团队名称校验", () => {
        it("应该拦截加入时提供的包含敏感词的团队名称", async () => {
            // Arrange
            const uid = "new_user_123";
            const dto = {
                userRegisterTime: Date.now(),
                teamName: "官方运营团队", // 包含敏感词
            };

            jest.spyOn(profileRepository, "findOne").mockResolvedValue(null); // 新用户

            // Act & Assert
            await expect(service.joinPartner(uid, dto)).rejects.toThrow(BadRequestException);
            await expect(service.joinPartner(uid, dto)).rejects.toThrow("团队名称包含敏感词，请重新输入");
        });

        it("应该允许加入时提供正常的团队名称", async () => {
            // Arrange
            const uid = "new_user_123";
            const dto = {
                userRegisterTime: Date.now(),
                teamName: "梦想战队",
            };

            jest.spyOn(profileRepository, "findOne").mockResolvedValue(null); // 新用户
            jest.spyOn(profileRepository, "create").mockReturnValue(mockProfile);
            jest.spyOn(profileRepository, "save").mockResolvedValue(mockProfile);
            jest.spyOn(service as any, "generatePartnerCode").mockResolvedValue("LP123456");

            // Act
            const result = await service.joinPartner(uid, dto);

            // Assert
            expect(result).toBeDefined();
            expect(profileRepository.save).toHaveBeenCalled();
        });

        it("应该允许加入时不提供团队名称", async () => {
            // Arrange
            const uid = "new_user_123";
            const dto = {
                userRegisterTime: Date.now(),
            };

            jest.spyOn(profileRepository, "findOne").mockResolvedValue(null); // 新用户
            jest.spyOn(profileRepository, "create").mockReturnValue(mockProfile);
            jest.spyOn(profileRepository, "save").mockResolvedValue(mockProfile);
            jest.spyOn(service as any, "generatePartnerCode").mockResolvedValue("LP123456");

            // Act
            const result = await service.joinPartner(uid, dto);

            // Assert
            expect(result).toBeDefined();
            expect(profileRepository.save).toHaveBeenCalled();
        });
    });
});

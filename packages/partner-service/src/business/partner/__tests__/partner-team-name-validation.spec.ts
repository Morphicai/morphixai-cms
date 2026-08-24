import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PartnerService } from "../partner.service";
import { PartnerProfileEntity } from "../entities/partner-profile.entity";
import { PartnerChannelEntity } from "../entities/partner-channel.entity";
import { AdminOperationLogEntity } from "../entities/admin-operation-log.entity";
import { HierarchyService } from "../hierarchy.service";
import { PartnerStatus } from "../enums/partner-status.enum";
import { StarLevel } from "../enums/star-level.enum";
import { UserSource } from "../../../shared/interfaces/user-identity.interface";
import { DuplicateTeamNameException, TeamNameImmutableException } from "../exceptions/partner.exception";
import { TaskCompletionLogEntity } from "../../points-engine/entities/task-completion-log.entity";
import { PointsCacheService } from "../../points-engine/services/points-cache.service";
import { PointsService } from "../../points-engine/services/points.service";

// 2026-08-24 重写:这个文件原来测的是"团队名称敏感词校验"(引用一个从未存在于
// partner-service 里的 ../../../shared/services/validation.service),但真实的
// validateTeamName() 从写出来就只做两件事——重名校验(DuplicateTeamNameException)
// 和一次性锁定(TeamNameImmutableException,团队名称设置过就不能再改)——partner.service.ts
// 里明确留着注释"ValidationService removed - game-specific sensitive word checking"。
// 敏感词过滤这个功能不是"还没做完",是已经被移除了,继续测一个不存在的功能没有意义,
// 改成测真实存在的两条业务规则
describe("PartnerService - 团队名称校验(重名 + 一次性锁定)", () => {
    let service: PartnerService;
    let profileRepository: Repository<PartnerProfileEntity>;

    const buildProfile = (overrides: Partial<PartnerProfileEntity> = {}): PartnerProfileEntity =>
        ({
            partnerId: "1",
            uid: "test_user_123",
            userId: "test_user_123",
            userSource: UserSource.INTERNAL,
            username: "测试用户",
            partnerCode: "LP123456",
            status: PartnerStatus.ACTIVE,
            currentStar: StarLevel.NEW,
            totalMira: "0",
            teamName: null,
            joinTime: new Date(),
            lastUpdateTime: new Date(),
            remark: null,
            extraData: null,
            ...overrides,
        }) as PartnerProfileEntity;

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
                { provide: getRepositoryToken(PartnerChannelEntity), useValue: {} },
                { provide: getRepositoryToken(AdminOperationLogEntity), useValue: {} },
                { provide: getRepositoryToken(TaskCompletionLogEntity), useValue: { find: jest.fn() } },
                { provide: HierarchyService, useValue: { getUplink: jest.fn() } },
                { provide: EventEmitter2, useValue: { emit: jest.fn() } },
                { provide: PointsCacheService, useValue: { getTotalPoints: jest.fn() } },
                { provide: PointsService, useValue: { getTotalPoints: jest.fn() } },
            ],
        }).compile();

        service = module.get<PartnerService>(PartnerService);
        profileRepository = module.get<Repository<PartnerProfileEntity>>(getRepositoryToken(PartnerProfileEntity));
    });

    describe("updateTeamName - 更新团队名称", () => {
        it("尚未设置过团队名称时,应该成功设置", async () => {
            const uid = "test_user_123";
            const teamName = "精英战队";
            const profile = buildProfile({ teamName: null });

            jest.spyOn(service, "getProfileByUserId").mockResolvedValueOnce(profile);
            jest.spyOn(profileRepository, "findOne").mockResolvedValueOnce(null); // 重名校验:没有同名的
            jest.spyOn(profileRepository, "save").mockResolvedValue({ ...profile, teamName });

            await service.updateTeamName(uid, teamName);

            expect(profileRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({ teamName: "精英战队" }),
            );
        });

        it("已经设置过团队名称后,不允许再次修改", async () => {
            const uid = "test_user_123";
            const profile = buildProfile({ teamName: "已经定好的战队" });

            jest.spyOn(service, "getProfileByUserId").mockResolvedValueOnce(profile);

            await expect(service.updateTeamName(uid, "想改成这个")).rejects.toThrow(TeamNameImmutableException);
        });

        it("团队名称已被其他合伙人占用时应该拦截", async () => {
            const uid = "test_user_123";
            const teamName = "已被占用的战队名";
            const profile = buildProfile({ teamName: null });
            const otherPartnerWithSameName = buildProfile({ partnerId: "2", uid: "other_user", teamName });

            jest.spyOn(service, "getProfileByUserId").mockResolvedValueOnce(profile);
            jest.spyOn(profileRepository, "findOne").mockResolvedValueOnce(otherPartnerWithSameName);

            await expect(service.updateTeamName(uid, teamName)).rejects.toThrow(DuplicateTeamNameException);
        });

        it("应该允许空团队名称(视为不设置)", async () => {
            const uid = "test_user_123";
            const profile = buildProfile({ teamName: null });

            jest.spyOn(service, "getProfileByUserId").mockResolvedValueOnce(profile);
            jest.spyOn(profileRepository, "save").mockResolvedValue({ ...profile, teamName: "" });

            await service.updateTeamName(uid, "");

            // 空字符串命中 validateTeamName 的提前返回,不会去查重名
            expect(profileRepository.findOne).not.toHaveBeenCalled();
            expect(profileRepository.save).toHaveBeenCalled();
        });

        it("应该通过一批不重名的正常团队名称", async () => {
            const uid = "test_user_123";
            const normalTeamNames = ["勇士联盟", "传奇战队", "精英小队", "冒险者公会", "星辰战团"];

            for (const teamName of normalTeamNames) {
                const profile = buildProfile({ teamName: null });
                jest.spyOn(service, "getProfileByUserId").mockResolvedValueOnce(profile);
                jest.spyOn(profileRepository, "findOne").mockResolvedValueOnce(null);
                jest.spyOn(profileRepository, "save").mockResolvedValueOnce({ ...profile, teamName });

                await expect(service.updateTeamName(uid, teamName)).resolves.not.toThrow();
            }
        });

        it("尚未注册为合伙人时应该报错", async () => {
            jest.spyOn(service, "getProfileByUserId").mockResolvedValueOnce(null);
            jest.spyOn(service, "getProfileByUid").mockResolvedValueOnce(null);

            await expect(service.updateTeamName("not_a_partner", "随便什么名字")).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe("joinPartner - 加入合伙人计划时的团队名称校验", () => {
        it("加入时提供的团队名称与他人重复应该拦截", async () => {
            const uid = "new_user_123";
            const dto = { userRegisterTime: Date.now(), teamName: "已经被占用的名字" };
            const duplicateProfile = buildProfile({ partnerId: "999", teamName: dto.teamName });

            jest.spyOn(service, "getProfileByUserId").mockResolvedValue(null);
            jest.spyOn(service, "getProfileByUid").mockResolvedValue(null);
            jest.spyOn(profileRepository, "findOne").mockResolvedValueOnce(duplicateProfile);

            await expect(service.joinPartner(uid, dto)).rejects.toThrow(DuplicateTeamNameException);
        });

        it("应该允许加入时提供未被占用的团队名称", async () => {
            const uid = "new_user_123";
            const dto = { userRegisterTime: Date.now(), teamName: "梦想战队" };
            const createdProfile = buildProfile({ teamName: dto.teamName });

            jest.spyOn(service, "getProfileByUserId").mockResolvedValue(null);
            jest.spyOn(service, "getProfileByUid").mockResolvedValue(null);
            jest.spyOn(profileRepository, "findOne").mockResolvedValueOnce(null); // 重名校验通过
            jest.spyOn(profileRepository, "create").mockReturnValue(createdProfile);
            jest.spyOn(profileRepository, "save").mockResolvedValue(createdProfile);
            jest.spyOn(service as any, "generatePartnerCode").mockResolvedValue("LP123456");

            const result = await service.joinPartner(uid, dto);

            expect(result).toBeDefined();
            expect(profileRepository.save).toHaveBeenCalled();
        });

        it("应该允许加入时不提供团队名称", async () => {
            const uid = "new_user_123";
            const dto = { userRegisterTime: Date.now() };
            const createdProfile = buildProfile({ teamName: null });

            jest.spyOn(service, "getProfileByUserId").mockResolvedValue(null);
            jest.spyOn(service, "getProfileByUid").mockResolvedValue(null);
            jest.spyOn(profileRepository, "create").mockReturnValue(createdProfile);
            jest.spyOn(profileRepository, "save").mockResolvedValue(createdProfile);
            jest.spyOn(service as any, "generatePartnerCode").mockResolvedValue("LP123456");

            const result = await service.joinPartner(uid, dto);

            expect(result).toBeDefined();
            expect(profileRepository.save).toHaveBeenCalled();
            // 没传 teamName,validateTeamName 提前返回,不应该去查重名
            expect(profileRepository.findOne).not.toHaveBeenCalled();
        });
    });
});

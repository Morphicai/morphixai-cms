import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { StatisticsService } from "./statistics.service";
import { PartnerProfileEntity } from "./entities/partner-profile.entity";
import { PartnerHierarchyEntity } from "./entities/partner-hierarchy.entity";
import { PartnerChannelEntity } from "./entities/partner-channel.entity";
import { PartnerStatus } from "./enums/partner-status.enum";
import { StarLevel } from "./enums/star-level.enum";

describe("StatisticsService", () => {
    let service: StatisticsService;
    let profileRepository: Repository<PartnerProfileEntity>;
    let hierarchyRepository: Repository<PartnerHierarchyEntity>;
    let channelRepository: Repository<PartnerChannelEntity>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StatisticsService,
                {
                    provide: getRepositoryToken(PartnerProfileEntity),
                    useValue: {
                        findOne: jest.fn(),
                        find: jest.fn(),
                        save: jest.fn(),
                        create: jest.fn(),
                        createQueryBuilder: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(PartnerHierarchyEntity),
                    useValue: {
                        findOne: jest.fn(),
                        findAndCount: jest.fn(),
                        count: jest.fn(),
                        save: jest.fn(),
                        create: jest.fn(),
                        createQueryBuilder: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(PartnerChannelEntity),
                    useValue: {
                        findOne: jest.fn(),
                        find: jest.fn(),
                        save: jest.fn(),
                        create: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<StatisticsService>(StatisticsService);
        profileRepository = module.get<Repository<PartnerProfileEntity>>(getRepositoryToken(PartnerProfileEntity));
        hierarchyRepository = module.get<Repository<PartnerHierarchyEntity>>(
            getRepositoryToken(PartnerHierarchyEntity),
        );
        channelRepository = module.get<Repository<PartnerChannelEntity>>(getRepositoryToken(PartnerChannelEntity));
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });

    describe("getTeamOverview", () => {
        it("should return team overview with L1 and L2 counts", async () => {
            // Arrange
            const partnerId = "1";
            jest.spyOn(hierarchyRepository, "count")
                .mockResolvedValueOnce(5) // L1 count
                .mockResolvedValueOnce(10); // L2 count

            // Act
            const result = await service.getTeamOverview(partnerId);

            // Assert
            expect(result).toEqual({
                totalL1: 5,
                totalL2: 10,
            });
            expect(hierarchyRepository.count).toHaveBeenCalledTimes(2);
            expect(hierarchyRepository.count).toHaveBeenNthCalledWith(1, {
                where: {
                    parentPartnerId: partnerId,
                    level: 1,
                    isActive: true,
                },
            });
            expect(hierarchyRepository.count).toHaveBeenNthCalledWith(2, {
                where: {
                    parentPartnerId: partnerId,
                    level: 2,
                    isActive: true,
                },
            });
        });

        it("should return zero counts when no downlines exist", async () => {
            // Arrange
            const partnerId = "1";
            jest.spyOn(hierarchyRepository, "count").mockResolvedValue(0);

            // Act
            const result = await service.getTeamOverview(partnerId);

            // Assert
            expect(result).toEqual({
                totalL1: 0,
                totalL2: 0,
            });
        });
    });

    describe("getTeamMembers", () => {
        it("should return team members with complete information", async () => {
            // Arrange
            const partnerId = "1";
            const level = 1;
            const pagination = { page: 1, pageSize: 10 };

            const mockHierarchyRecords: Partial<PartnerHierarchyEntity>[] = [
                {
                    id: "1",
                    parentPartnerId: "1",
                    childPartnerId: "2",
                    level: 1,
                    sourceChannelId: "100",
                    bindTime: new Date("2024-01-01"),
                    isActive: true,
                },
                {
                    id: "2",
                    parentPartnerId: "1",
                    childPartnerId: "3",
                    level: 1,
                    sourceChannelId: null,
                    bindTime: new Date("2024-01-02"),
                    isActive: true,
                },
            ];

            const mockProfiles: Partial<PartnerProfileEntity>[] = [
                {
                    partnerId: "2",
                    uid: "uid-2",
                    partnerCode: "LP000002",
                    currentStar: StarLevel.NEW,
                    status: PartnerStatus.ACTIVE,
                    joinTime: new Date("2024-01-01"),
                    totalMira: "0",
                },
                {
                    partnerId: "3",
                    uid: "uid-3",
                    partnerCode: "LP000003",
                    currentStar: StarLevel.S1,
                    status: PartnerStatus.ACTIVE,
                    joinTime: new Date("2024-01-02"),
                    totalMira: "100",
                },
            ];

            jest.spyOn(hierarchyRepository, "findAndCount").mockResolvedValue([
                mockHierarchyRecords as PartnerHierarchyEntity[],
                2,
            ]);

            const mockQueryBuilder = {
                where: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(mockProfiles),
            };
            jest.spyOn(profileRepository, "createQueryBuilder").mockReturnValue(mockQueryBuilder as any);

            // Act
            const result = await service.getTeamMembers(partnerId, level, pagination);

            // Assert
            expect(result.total).toBe(2);
            expect(result.items).toHaveLength(2);
            expect(result.items[0]).toEqual({
                partnerId: "2",
                uid: "uid-2",
                partnerCode: "LP000002",
                currentStar: StarLevel.NEW,
                joinTime: mockProfiles[0].joinTime,
                sourceChannelId: "100",
            });
            expect(result.items[1]).toEqual({
                partnerId: "3",
                uid: "uid-3",
                partnerCode: "LP000003",
                currentStar: StarLevel.S1,
                joinTime: mockProfiles[1].joinTime,
                sourceChannelId: null,
            });
        });

        it("should support pagination", async () => {
            // Arrange
            const partnerId = "1";
            const level = 1;
            const pagination = { page: 2, pageSize: 5 };

            jest.spyOn(hierarchyRepository, "findAndCount").mockResolvedValue([[], 0]);

            const mockQueryBuilder = {
                where: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
            };
            jest.spyOn(profileRepository, "createQueryBuilder").mockReturnValue(mockQueryBuilder as any);

            // Act
            const result = await service.getTeamMembers(partnerId, level, pagination);

            // Assert
            expect(hierarchyRepository.findAndCount).toHaveBeenCalledWith({
                where: {
                    parentPartnerId: partnerId,
                    level,
                    isActive: true,
                },
                skip: 5, // (page - 1) * pageSize = (2 - 1) * 5
                take: 5,
                order: {
                    bindTime: "DESC",
                },
            });
            expect(result.page).toBe(2);
            expect(result.pageSize).toBe(5);
        });

        it("should filter by level correctly", async () => {
            // Arrange
            const partnerId = "1";
            const level = 2;
            const pagination = { page: 1, pageSize: 10 };

            jest.spyOn(hierarchyRepository, "findAndCount").mockResolvedValue([[], 0]);

            const mockQueryBuilder = {
                where: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
            };
            jest.spyOn(profileRepository, "createQueryBuilder").mockReturnValue(mockQueryBuilder as any);

            // Act
            await service.getTeamMembers(partnerId, level, pagination);

            // Assert
            expect(hierarchyRepository.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        level: 2,
                    }),
                }),
            );
        });
    });
});

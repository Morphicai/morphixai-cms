import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { HierarchyService } from "./hierarchy.service";
import { PartnerHierarchyEntity } from "./entities/partner-hierarchy.entity";
import { PartnerProfileEntity } from "./entities/partner-profile.entity";
import { AdminOperationLogEntity } from "./entities/admin-operation-log.entity";
import { InvalidPartnerIdException, UplinkImmutableException } from "./exceptions/partner.exception";

describe("HierarchyService", () => {
    let service: HierarchyService;
    let hierarchyRepository: Repository<PartnerHierarchyEntity>;
    let profileRepository: Repository<PartnerProfileEntity>;

    const mockHierarchyRepository = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        findAndCount: jest.fn(),
    };

    const mockProfileRepository = {
        findOne: jest.fn(),
    };

    const mockAdminLogRepository = {
        create: jest.fn(),
        save: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HierarchyService,
                {
                    provide: getRepositoryToken(PartnerHierarchyEntity),
                    useValue: mockHierarchyRepository,
                },
                {
                    provide: getRepositoryToken(PartnerProfileEntity),
                    useValue: mockProfileRepository,
                },
                {
                    provide: getRepositoryToken(AdminOperationLogEntity),
                    useValue: mockAdminLogRepository,
                },
            ],
        }).compile();

        service = module.get<HierarchyService>(HierarchyService);
        hierarchyRepository = module.get(getRepositoryToken(PartnerHierarchyEntity));
        profileRepository = module.get(getRepositoryToken(PartnerProfileEntity));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("createRelationship", () => {
        it("应该创建一级关系", async () => {
            const parentId = "1";
            const childId = "2";
            const channelId = "100";

            // Mock parent and child exist
            mockProfileRepository.findOne
                .mockResolvedValueOnce({ partnerId: parentId })
                .mockResolvedValueOnce({ partnerId: childId });

            // Mock no existing uplink
            mockHierarchyRepository.findOne.mockResolvedValueOnce(null);

            // Mock relationship creation
            const mockRelation = { id: "1", parentPartnerId: parentId, childPartnerId: childId, level: 1 };
            mockHierarchyRepository.create.mockReturnValue(mockRelation);
            mockHierarchyRepository.save.mockResolvedValue(mockRelation);

            // Mock no parent uplink (no level 2 relation)
            mockHierarchyRepository.findOne.mockResolvedValueOnce(null);

            await service.createRelationship(parentId, childId, channelId);

            expect(mockHierarchyRepository.create).toHaveBeenCalledWith({
                parentPartnerId: parentId,
                childPartnerId: childId,
                level: 1,
                sourceChannelId: channelId,
                isActive: true,
            });
            expect(mockHierarchyRepository.save).toHaveBeenCalledTimes(1);
        });

        it("应该在父级有上级时创建二级关系", async () => {
            const grandparentId = "1";
            const parentId = "2";
            const childId = "3";

            // Mock parent and child exist
            mockProfileRepository.findOne
                .mockResolvedValueOnce({ partnerId: parentId })
                .mockResolvedValueOnce({ partnerId: childId });

            // Mock no existing uplink for child
            mockHierarchyRepository.findOne.mockResolvedValueOnce(null);

            // Mock level 1 relationship creation
            const mockLevel1Relation = { id: "1", parentPartnerId: parentId, childPartnerId: childId, level: 1 };
            mockHierarchyRepository.create.mockReturnValueOnce(mockLevel1Relation);
            mockHierarchyRepository.save.mockResolvedValueOnce(mockLevel1Relation);

            // Mock parent has uplink
            mockHierarchyRepository.findOne.mockResolvedValueOnce({
                parentPartnerId: grandparentId,
                childPartnerId: parentId,
                level: 1,
            });

            // Mock level 2 relationship creation
            const mockLevel2Relation = {
                id: "2",
                parentPartnerId: grandparentId,
                childPartnerId: childId,
                level: 2,
            };
            mockHierarchyRepository.create.mockReturnValueOnce(mockLevel2Relation);
            mockHierarchyRepository.save.mockResolvedValueOnce(mockLevel2Relation);

            await service.createRelationship(parentId, childId);

            expect(mockHierarchyRepository.save).toHaveBeenCalledTimes(2);
            expect(mockHierarchyRepository.create).toHaveBeenCalledWith({
                parentPartnerId: grandparentId,
                childPartnerId: childId,
                level: 2,
                sourceChannelId: null,
                isActive: true,
            });
        });

        it("应该在父级不存在时抛出异常", async () => {
            mockProfileRepository.findOne.mockResolvedValueOnce(null);

            await expect(service.createRelationship("1", "2")).rejects.toThrow(InvalidPartnerIdException);
        });

        it("应该在子级不存在时抛出异常", async () => {
            mockProfileRepository.findOne.mockResolvedValueOnce({ partnerId: "1" }).mockResolvedValueOnce(null);

            await expect(service.createRelationship("1", "2")).rejects.toThrow(InvalidPartnerIdException);
        });

        it("应该在子级已有上级时抛出异常", async () => {
            mockProfileRepository.findOne
                .mockResolvedValueOnce({ partnerId: "1" })
                .mockResolvedValueOnce({ partnerId: "2" });

            mockHierarchyRepository.findOne.mockResolvedValueOnce({
                parentPartnerId: "999",
                childPartnerId: "2",
                level: 1,
                isActive: true,
            });

            await expect(service.createRelationship("1", "2")).rejects.toThrow(UplinkImmutableException);
        });
    });

    describe("getDownlines", () => {
        it("应该返回一级下线列表", async () => {
            const partnerId = "1";
            const mockDownlines = [
                { id: "1", parentPartnerId: partnerId, childPartnerId: "2", level: 1 },
                { id: "2", parentPartnerId: partnerId, childPartnerId: "3", level: 1 },
            ];

            mockHierarchyRepository.findAndCount.mockResolvedValue([mockDownlines, 2]);

            const result = await service.getDownlines(partnerId, 1, { page: 1, pageSize: 10 });

            expect(result.items).toEqual(mockDownlines);
            expect(result.total).toBe(2);
            expect(result.page).toBe(1);
            expect(result.pageSize).toBe(10);
        });

        it("应该只返回活跃关系", async () => {
            const partnerId = "1";

            mockHierarchyRepository.findAndCount.mockResolvedValue([[], 0]);

            await service.getDownlines(partnerId, 1, { page: 1, pageSize: 10 });

            expect(mockHierarchyRepository.findAndCount).toHaveBeenCalledWith({
                where: {
                    parentPartnerId: partnerId,
                    level: 1,
                    isActive: true,
                },
                skip: 0,
                take: 10,
                order: {
                    bindTime: "DESC",
                },
            });
        });
    });

    describe("getUplink", () => {
        it("应该返回直接上级", async () => {
            const partnerId = "2";
            const mockUplink = {
                id: "1",
                parentPartnerId: "1",
                childPartnerId: partnerId,
                level: 1,
                isActive: true,
            };

            mockHierarchyRepository.findOne.mockResolvedValue(mockUplink);

            const result = await service.getUplink(partnerId);

            expect(result).toEqual(mockUplink);
            expect(mockHierarchyRepository.findOne).toHaveBeenCalledWith({
                where: {
                    childPartnerId: partnerId,
                    level: 1,
                    isActive: true,
                },
            });
        });

        it("应该在没有上级时返回null", async () => {
            mockHierarchyRepository.findOne.mockResolvedValue(null);

            const result = await service.getUplink("1");

            expect(result).toBeNull();
        });
    });
});

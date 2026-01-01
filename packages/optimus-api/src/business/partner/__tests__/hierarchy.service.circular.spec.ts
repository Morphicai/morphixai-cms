import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { HierarchyService } from "../hierarchy.service";
import { PartnerHierarchyEntity } from "../entities/partner-hierarchy.entity";
import { PartnerProfileEntity } from "../entities/partner-profile.entity";
import { AdminOperationLogEntity } from "../entities/admin-operation-log.entity";
import { CircularReferenceException } from "../exceptions/partner.exception";

describe("HierarchyService - 循环引用检测", () => {
    let service: HierarchyService;
    let hierarchyRepository: Repository<PartnerHierarchyEntity>;
    let profileRepository: Repository<PartnerProfileEntity>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HierarchyService,
                {
                    provide: getRepositoryToken(PartnerHierarchyEntity),
                    useValue: {
                        findOne: jest.fn(),
                        find: jest.fn(),
                        findAndCount: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        query: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(PartnerProfileEntity),
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(AdminOperationLogEntity),
                    useValue: {
                        create: jest.fn(),
                        save: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<HierarchyService>(HierarchyService);
        hierarchyRepository = module.get<Repository<PartnerHierarchyEntity>>(
            getRepositoryToken(PartnerHierarchyEntity),
        );
        profileRepository = module.get<Repository<PartnerProfileEntity>>(getRepositoryToken(PartnerProfileEntity));
    });

    describe("checkCircularReference - 只检测2层以内的循环", () => {
        it("应该检测到自我邀请 (1层循环: A->A)", async () => {
            const result = await service.checkCircularReference("1", "1");
            expect(result).toBe(true);
        });

        it("应该检测到2层循环 (A->B->A)", async () => {
            // 模拟查询结果：A是B的直接下线（level=1）
            jest.spyOn(hierarchyRepository, "query").mockResolvedValue([{ found: 1 }]);

            const result = await service.checkCircularReference("1", "2");
            expect(result).toBe(true);
        });

        it("应该允许3层循环 (A->B->C->A)", async () => {
            // 模拟查询结果：A不是C的直接下线（level=1），而是间接下线（level=2）
            jest.spyOn(hierarchyRepository, "query").mockResolvedValue([]);

            const result = await service.checkCircularReference("1", "3");
            expect(result).toBe(false);
        });

        it("应该允许4层及以上循环 (A->B->C->D->A)", async () => {
            // 模拟查询结果：A不是D的直接下线
            jest.spyOn(hierarchyRepository, "query").mockResolvedValue([]);

            const result = await service.checkCircularReference("1", "4");
            expect(result).toBe(false);
        });

        it("应该允许正常的上下级关系", async () => {
            // 模拟查询结果：没有找到循环
            jest.spyOn(hierarchyRepository, "query").mockResolvedValue([]);

            const result = await service.checkCircularReference("1", "2");
            expect(result).toBe(false);
        });

        it("查询失败时应该返回true（安全优先）", async () => {
            // 模拟查询失败
            jest.spyOn(hierarchyRepository, "query").mockRejectedValue(new Error("Database error"));

            const result = await service.checkCircularReference("1", "2");
            expect(result).toBe(true);
        });
    });

    describe("createRelationship - 循环检测集成", () => {
        beforeEach(() => {
            // 模拟合伙人存在
            jest.spyOn(profileRepository, "findOne").mockResolvedValue({
                partnerId: "1",
                uid: "test",
                partnerCode: "LP123456",
            } as PartnerProfileEntity);

            // 模拟没有现有上级
            jest.spyOn(hierarchyRepository, "findOne").mockResolvedValue(null);

            // 模拟创建和保存成功
            jest.spyOn(hierarchyRepository, "create").mockReturnValue({} as PartnerHierarchyEntity);
            jest.spyOn(hierarchyRepository, "save").mockResolvedValue({} as PartnerHierarchyEntity);
        });

        it("应该阻止自我邀请", async () => {
            await expect(service.createRelationship("1", "1")).rejects.toThrow(CircularReferenceException);
        });

        it("应该阻止循环邀请", async () => {
            // 模拟检测到循环
            jest.spyOn(hierarchyRepository, "query").mockResolvedValue([{ found: 1 }]);

            await expect(service.createRelationship("1", "2")).rejects.toThrow(CircularReferenceException);
        });

        it("应该允许正常的邀请关系", async () => {
            // 模拟没有循环
            jest.spyOn(hierarchyRepository, "query").mockResolvedValue([]);

            await expect(service.createRelationship("1", "2")).resolves.not.toThrow();
        });
    });

    describe("correctUplink - 管理员纠错也需要循环检测", () => {
        beforeEach(() => {
            // 模拟合伙人存在
            jest.spyOn(profileRepository, "findOne").mockResolvedValue({
                partnerId: "1",
                uid: "test",
                partnerCode: "LP123456",
            } as PartnerProfileEntity);

            // 模拟现有关系
            jest.spyOn(hierarchyRepository, "findOne").mockResolvedValue({
                id: "1",
                parentPartnerId: "2",
                childPartnerId: "3",
                level: 1,
                isActive: true,
            } as PartnerHierarchyEntity);

            jest.spyOn(hierarchyRepository, "create").mockReturnValue({} as PartnerHierarchyEntity);
            jest.spyOn(hierarchyRepository, "save").mockResolvedValue({} as PartnerHierarchyEntity);
        });

        it("管理员纠错时应该阻止循环", async () => {
            // 模拟检测到循环
            jest.spyOn(hierarchyRepository, "query").mockResolvedValue([{ found: 1 }]);

            await expect(service.correctUplink("2", "3", "admin1", "测试纠错")).rejects.toThrow(
                CircularReferenceException,
            );
        });

        it("管理员纠错时应该允许正常关系", async () => {
            // 模拟没有循环
            jest.spyOn(hierarchyRepository, "query").mockResolvedValue([]);

            await expect(service.correctUplink("3", "1", "admin1", "测试纠错")).resolves.not.toThrow();
        });
    });
});

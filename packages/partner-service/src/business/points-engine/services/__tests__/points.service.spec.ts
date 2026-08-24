import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PointsService } from "../points.service";
import { PointRuleService } from "../point-rule.service";
import { PointsCacheService } from "../points-cache.service";
import { TaskCompletionLogEntity } from "../../entities/task-completion-log.entity";
import { TaskType } from "../../enums/task-type.enum";
import { TaskStatus } from "../../enums/task-status.enum";

describe("PointsService", () => {
    let service: PointsService;
    let repository: Repository<TaskCompletionLogEntity>;
    let pointRuleService: PointRuleService;
    let cacheService: PointsCacheService;

    const mockRepository = {
        find: jest.fn(),
    };

    const mockPointRuleService = {
        calculatePoints: jest.fn(),
    };

    const mockCacheService = {
        getTotalPoints: jest.fn(),
        setTotalPoints: jest.fn(),
        getPointsDetail: jest.fn(),
        setPointsDetail: jest.fn(),
        invalidateUserCache: jest.fn(),
        getCacheStats: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PointsService,
                {
                    provide: getRepositoryToken(TaskCompletionLogEntity),
                    useValue: mockRepository,
                },
                {
                    provide: PointRuleService,
                    useValue: mockPointRuleService,
                },
                {
                    provide: PointsCacheService,
                    useValue: mockCacheService,
                },
            ],
        }).compile();

        service = module.get<PointsService>(PointsService);
        repository = module.get<Repository<TaskCompletionLogEntity>>(getRepositoryToken(TaskCompletionLogEntity));
        pointRuleService = module.get<PointRuleService>(PointRuleService);
        cacheService = module.get<PointsCacheService>(PointsCacheService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });

    describe("getUserPoints", () => {
        it("应该返回用户总积分", async () => {
            const userId = "1";
            const mockLogs = [
                {
                    id: "1",
                    taskCode: "REGISTER_V1",
                    taskType: TaskType.REGISTER,
                    partnerId: userId,
                    uid: "user1",
                    status: TaskStatus.COMPLETED,
                    businessParams: {},
                    createdAt: new Date(),
                },
                {
                    id: "2",
                    taskCode: "INVITE_V1",
                    taskType: TaskType.INVITE_SUCCESS,
                    partnerId: userId,
                    uid: "user1",
                    status: TaskStatus.COMPLETED,
                    businessParams: {},
                    createdAt: new Date(),
                },
            ];

            // 模拟缓存未命中
            mockCacheService.getTotalPoints.mockReturnValue(undefined);
            mockRepository.find.mockResolvedValue(mockLogs);
            mockPointRuleService.calculatePoints.mockReturnValueOnce(100).mockReturnValueOnce(300);

            const totalPoints = await service.getUserPoints(userId);

            expect(totalPoints).toBe(400);
            expect(mockCacheService.getTotalPoints).toHaveBeenCalledWith(userId);
            expect(mockCacheService.setTotalPoints).toHaveBeenCalledWith(userId, 400);
            expect(mockRepository.find).toHaveBeenCalledWith({
                where: {
                    partnerId: userId,
                    status: TaskStatus.COMPLETED,
                },
                order: {
                    createdAt: "ASC",
                },
            });
        });

        it("没有任务记录时应该返回 0", async () => {
            const userId = "1";
            mockCacheService.getTotalPoints.mockReturnValue(undefined);
            mockRepository.find.mockResolvedValue([]);

            const totalPoints = await service.getUserPoints(userId);

            expect(totalPoints).toBe(0);
            expect(mockCacheService.setTotalPoints).toHaveBeenCalledWith(userId, 0);
        });
    });

    describe("getUserPointsDetail", () => {
        it("应该返回积分明细列表", async () => {
            const userId = "1";
            const mockLogs = [
                {
                    id: "1",
                    taskCode: "REGISTER_V1",
                    taskType: TaskType.REGISTER,
                    partnerId: userId,
                    uid: "user1",
                    status: TaskStatus.COMPLETED,
                    businessParams: { partnerCode: "LP123456" },
                    createdAt: new Date("2025-12-06T10:00:00Z"),
                },
            ];

            mockCacheService.getPointsDetail.mockReturnValue(undefined);
            mockRepository.find.mockResolvedValue(mockLogs);
            mockPointRuleService.calculatePoints.mockReturnValue(100);

            const detail = await service.getUserPointsDetail(userId);

            expect(detail).toHaveLength(1);
            expect(detail[0]).toMatchObject({
                taskCode: "REGISTER_V1",
                taskType: TaskType.REGISTER,
                points: 100,
                businessParams: { partnerCode: "LP123456" },
            });
            expect(mockCacheService.getPointsDetail).toHaveBeenCalledWith(userId);
            expect(mockCacheService.setPointsDetail).toHaveBeenCalled();
        });

        it("应该按创建时间倒序排列", async () => {
            const userId = "1";
            mockCacheService.getPointsDetail.mockReturnValue(undefined);
            mockRepository.find.mockResolvedValue([]);

            await service.getUserPointsDetail(userId);

            expect(mockRepository.find).toHaveBeenCalledWith({
                where: {
                    partnerId: userId,
                    status: TaskStatus.COMPLETED,
                },
                order: {
                    createdAt: "DESC",
                },
            });
        });
    });
});

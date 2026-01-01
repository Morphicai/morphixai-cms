import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, Connection } from "typeorm";
import { ArticleService } from "./article.service";
import { ArticleEntity } from "./entities/article.entity";
import { ArticleVersionEntity } from "../article-version/entities/article-version.entity";
import { CategoryEntity } from "../category/entities/category.entity";
import { ArticleOperationLogService } from "./services/article-operation-log.service";

describe("ArticleService", () => {
    let service: ArticleService;

    const mockArticleRepository = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        })),
        remove: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
    };

    const mockVersionRepository = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn(),
        createQueryBuilder: jest.fn(),
        count: jest.fn(),
    };

    const mockCategoryRepository = {
        findOne: jest.fn(),
        find: jest.fn(),
    };

    const mockConnection = {
        createQueryRunner: jest.fn(() => ({
            connect: jest.fn(),
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            rollbackTransaction: jest.fn(),
            release: jest.fn(),
            manager: {
                save: jest.fn(),
                create: jest.fn(),
            },
        })),
    };

    const mockOperationLogService = {
        logOperation: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ArticleService,
                {
                    provide: getRepositoryToken(ArticleEntity),
                    useValue: mockArticleRepository,
                },
                {
                    provide: getRepositoryToken(ArticleVersionEntity),
                    useValue: mockVersionRepository,
                },
                {
                    provide: getRepositoryToken(CategoryEntity),
                    useValue: mockCategoryRepository,
                },
                {
                    provide: Connection,
                    useValue: mockConnection,
                },
                {
                    provide: ArticleOperationLogService,
                    useValue: mockOperationLogService,
                },
            ],
        }).compile();

        service = module.get<ArticleService>(ArticleService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });

    describe("findAll", () => {
        it("should be defined", () => {
            expect(service.findAll).toBeDefined();
        });
    });

    describe("getStats", () => {
        it("should return article statistics", async () => {
            mockArticleRepository.count
                .mockResolvedValueOnce(10) // total
                .mockResolvedValueOnce(3) // draft
                .mockResolvedValueOnce(5) // published
                .mockResolvedValueOnce(2); // archived

            const result = await service.getStats();

            expect(result).toEqual({
                total: 10,
                draft: 3,
                published: 5,
                archived: 2,
            });
        });
    });
});

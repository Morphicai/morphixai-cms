import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, Connection } from "typeorm";
import { ArticleVersionService } from "./article-version.service";
import { ArticleVersionEntity } from "./entities/article-version.entity";
import { ArticleEntity } from "../article/entities/article.entity";
import { CategoryEntity } from "../category/entities/category.entity";
import { VersionDiffService } from "./services/version-diff.service";

describe("ArticleVersionService", () => {
    let service: ArticleVersionService;

    const mockVersionRepository = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn(),
        createQueryBuilder: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
    };

    const mockArticleRepository = {
        findOne: jest.fn(),
        save: jest.fn(),
    };

    const mockCategoryRepository = {
        findOne: jest.fn(),
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
                findOne: jest.fn(),
            },
        })),
    };

    const mockVersionDiffService = {
        compareVersions: jest.fn().mockResolvedValue({
            version1: { id: 1, versionNumber: 1, createDate: new Date() },
            version2: { id: 2, versionNumber: 2, createDate: new Date() },
            differences: [],
            summary: { totalChanges: 0, changedFields: [] },
        }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ArticleVersionService,
                {
                    provide: getRepositoryToken(ArticleVersionEntity),
                    useValue: mockVersionRepository,
                },
                {
                    provide: getRepositoryToken(ArticleEntity),
                    useValue: mockArticleRepository,
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
                    provide: VersionDiffService,
                    useValue: mockVersionDiffService,
                },
            ],
        }).compile();

        service = module.get<ArticleVersionService>(ArticleVersionService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });

    describe("findByArticle", () => {
        it("should return versions for an article", async () => {
            const mockArticle = { id: 1, categoryId: 1 };
            const mockVersions = [
                { id: 1, articleId: 1, versionNumber: 1 },
                { id: 2, articleId: 1, versionNumber: 2 },
            ];

            mockArticleRepository.findOne.mockResolvedValue(mockArticle);
            mockVersionRepository.find.mockResolvedValue(mockVersions);

            const result = await service.findByArticle(1);

            expect(result).toEqual(mockVersions);
            expect(mockVersionRepository.find).toHaveBeenCalledWith({
                where: { articleId: 1 },
                order: { versionNumber: "DESC" },
            });
        });
    });

    describe("canDeleteVersion", () => {
        it("should return true for deletable draft version", async () => {
            const mockVersion = {
                id: 1,
                status: "draft",
                isCurrent: false,
                article: {
                    publishedVersionId: 2,
                },
            };

            mockVersionRepository.findOne.mockResolvedValue(mockVersion);

            const result = await service.canDeleteVersion(1);

            expect(result.canDelete).toBe(true);
        });

        it("should return false for current version", async () => {
            const mockVersion = {
                id: 1,
                status: "draft",
                isCurrent: true,
            };

            mockVersionRepository.findOne.mockResolvedValue(mockVersion);

            const result = await service.canDeleteVersion(1);

            expect(result.canDelete).toBe(false);
            expect(result.reason).toBeDefined();
        });

        it("should return false for published version", async () => {
            const mockVersion = {
                id: 1,
                status: "published",
                isCurrent: false,
                article: {
                    publishedVersionId: 1,
                },
            };

            mockVersionRepository.findOne.mockResolvedValue(mockVersion);

            const result = await service.canDeleteVersion(1);

            expect(result.canDelete).toBe(false);
            expect(result.reason).toBeDefined();
        });
    });

    describe("getVersionStats", () => {
        it("should return version statistics", async () => {
            const mockArticle = { id: 1, categoryId: 1 };
            const mockVersions = [
                { id: 1, status: "published", isCurrent: true, versionNumber: 3 },
                { id: 2, status: "draft", isCurrent: false, versionNumber: 2 },
                { id: 3, status: "archived", isCurrent: false, versionNumber: 1 },
            ];

            mockArticleRepository.findOne.mockResolvedValue(mockArticle);
            mockVersionRepository.find.mockResolvedValue(mockVersions);

            const result = await service.getVersionStats(1);

            expect(result).toBeDefined();
            expect(result.totalVersions).toBe(3);
            expect(result.draftVersions).toBe(1);
            expect(result.publishedVersions).toBe(1);
            expect(result.archivedVersions).toBe(1);
        });
    });
});

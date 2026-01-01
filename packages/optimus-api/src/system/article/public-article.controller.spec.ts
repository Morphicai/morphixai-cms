import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { PublicArticleController } from "./public-article.controller";
import { ArticleService } from "./article.service";
import { FindAllArticleDto } from "./dto/find-all-article.dto";

describe("PublicArticleController", () => {
    let controller: PublicArticleController;
    let service: ArticleService;

    const mockArticleService = {
        findAll: jest.fn(),
        search: jest.fn(),
        findOne: jest.fn(),
        findBySlug: jest.fn(),
        findOneForPublic: jest.fn(),
        findBySlugForPublic: jest.fn(),
    };

    // 用于 findOneForPublic 和 findBySlugForPublic 的扁平化 DTO mock
    const mockPublicArticleDetail = {
        id: 1,
        slug: "test-article",
        status: "published",
        publishedAt: new Date(),
        category: {
            id: 1,
            name: "测试分类",
            code: "test-category",
        },
        title: "测试文章",
        summary: "测试摘要",
        content: "测试内容",
        coverImages: [],
        sortWeight: 0,
        seoTitle: "",
        seoDescription: "",
        seoKeywords: "",
        createDate: new Date(),
        updateDate: new Date(),
    };

    // 用于 findAll 和 search 的实体 mock（保持原有结构）
    const mockPublishedArticle = {
        id: 1,
        slug: "test-article",
        status: "published",
        publishedAt: new Date(),
        categoryId: 1,
        category: {
            id: 1,
            name: "测试分类",
            code: "test-category",
        },
        currentVersion: {
            title: "测试文章",
            summary: "测试摘要",
            content: "测试内容",
            coverImages: [],
            sortWeight: 0,
        },
    };

    const mockDraftArticle = {
        ...mockPublishedArticle,
        status: "draft",
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PublicArticleController],
            providers: [
                {
                    provide: ArticleService,
                    useValue: mockArticleService,
                },
            ],
        }).compile();

        controller = module.get<PublicArticleController>(PublicArticleController);
        service = module.get<ArticleService>(ArticleService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("findPublished", () => {
        it("应该返回已发布的文章列表", async () => {
            const query: FindAllArticleDto = {
                page: 1,
                pageSize: 10,
            };

            const mockResult = {
                items: [mockPublishedArticle],
                total: 1,
                page: 1,
                pageSize: 10,
                totalPages: 1,
            };

            mockArticleService.findAll.mockResolvedValue(mockResult);

            const result = await controller.findPublished(query);

            expect(result.code).toBe(200);
            expect(result.data).toEqual(mockResult);
            expect(mockArticleService.findAll).toHaveBeenCalledWith({
                ...query,
                status: "published",
            });
        });

        it("应该支持按分类筛选", async () => {
            const query: FindAllArticleDto = {
                page: 1,
                pageSize: 10,
                categoryId: 1,
            };

            const mockResult = {
                items: [mockPublishedArticle],
                total: 1,
                page: 1,
                pageSize: 10,
                totalPages: 1,
            };

            mockArticleService.findAll.mockResolvedValue(mockResult);

            await controller.findPublished(query);

            expect(mockArticleService.findAll).toHaveBeenCalledWith({
                ...query,
                status: "published",
            });
        });
    });

    describe("searchPublished", () => {
        it("应该搜索已发布的文章", async () => {
            const keyword = "测试";
            const query: FindAllArticleDto = {
                page: 1,
                pageSize: 10,
            };

            const mockResult = {
                items: [mockPublishedArticle],
                total: 1,
                page: 1,
                pageSize: 10,
                totalPages: 1,
            };

            mockArticleService.search.mockResolvedValue(mockResult);

            const result = await controller.searchPublished(keyword, query);

            expect(result.code).toBe(200);
            expect(result.data).toEqual(mockResult);
            expect(mockArticleService.search).toHaveBeenCalledWith(keyword, {
                ...query,
                status: "published",
            });
        });
    });

    describe("findOne", () => {
        it("应该返回已发布文章的详情", async () => {
            mockArticleService.findOneForPublic.mockResolvedValue(mockPublicArticleDetail);

            const result = await controller.findOne("1");

            expect(result.code).toBe(200);
            expect(result.data).toEqual(mockPublicArticleDetail);
            expect(mockArticleService.findOneForPublic).toHaveBeenCalledWith(1);
        });

        it("当文章是草稿状态时应该抛出 NotFoundException", async () => {
            mockArticleService.findOneForPublic.mockRejectedValue(new NotFoundException("文章不存在或未发布"));

            await expect(controller.findOne("1")).rejects.toThrow(NotFoundException);
        });

        it("当文章不存在时应该抛出 NotFoundException", async () => {
            mockArticleService.findOneForPublic.mockRejectedValue(new NotFoundException());

            await expect(controller.findOne("999")).rejects.toThrow(NotFoundException);
        });
    });

    describe("findBySlug", () => {
        it("应该根据 slug 返回已发布文章的详情", async () => {
            mockArticleService.findBySlugForPublic.mockResolvedValue(mockPublicArticleDetail);

            const result = await controller.findBySlug("test-article");

            expect(result.code).toBe(200);
            expect(result.data).toEqual(mockPublicArticleDetail);
            expect(mockArticleService.findBySlugForPublic).toHaveBeenCalledWith("test-article");
        });

        it("当文章是草稿状态时应该抛出 NotFoundException", async () => {
            mockArticleService.findBySlugForPublic.mockRejectedValue(new NotFoundException("文章不存在或未发布"));

            await expect(controller.findBySlug("test-article")).rejects.toThrow(NotFoundException);
        });

        it("当文章不存在时应该抛出 NotFoundException", async () => {
            mockArticleService.findBySlugForPublic.mockRejectedValue(new NotFoundException());

            await expect(controller.findBySlug("non-existent")).rejects.toThrow(NotFoundException);
        });
    });
});

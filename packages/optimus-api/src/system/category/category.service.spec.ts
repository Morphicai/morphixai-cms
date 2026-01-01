import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CategoryService } from "./category.service";
import { CategoryEntity } from "./entities/category.entity";
import { HttpException } from "@nestjs/common";

describe("CategoryService", () => {
    let service: CategoryService;
    let repository: Repository<CategoryEntity>;

    const mockRepository = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn(),
        remove: jest.fn(),
        delete: jest.fn(),
        createQueryBuilder: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CategoryService,
                {
                    provide: getRepositoryToken(CategoryEntity),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<CategoryService>(CategoryService);
        repository = module.get<Repository<CategoryEntity>>(getRepositoryToken(CategoryEntity));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });

    describe("create", () => {
        const createDto = {
            name: "Test Category",
            code: "test-category",
            description: "Test Description",
            config: { maxCoverImages: 3, maxVersions: 10 },
        };

        it("should create a new category", async () => {
            const mockCategory = {
                id: 1,
                ...createDto,
                isBuiltIn: false,
            };

            mockRepository.findOne.mockResolvedValue(null);
            mockRepository.create.mockReturnValue(mockCategory);
            mockRepository.save.mockResolvedValue(mockCategory);

            const result = await service.create(createDto);

            expect(result).toEqual(mockCategory);
            expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { code: createDto.code } });
            expect(mockRepository.save).toHaveBeenCalled();
        });

        it("should throw error if category code already exists", async () => {
            mockRepository.findOne.mockResolvedValue({ id: 1, code: createDto.code });

            await expect(service.create(createDto)).rejects.toThrow();
        });
    });

    describe("getBuiltInCategories", () => {
        it("should return built-in categories", async () => {
            const mockCategories = [
                { id: 1, name: "新闻", code: "news", isBuiltIn: true },
                { id: 2, name: "活动", code: "activity", isBuiltIn: true },
            ];

            mockRepository.find.mockResolvedValue(mockCategories);

            const result = await service.getBuiltInCategories();

            expect(result).toEqual(mockCategories);
            expect(mockRepository.find).toHaveBeenCalledWith({
                where: { isBuiltIn: true },
                order: { sortWeight: "DESC", createDate: "ASC" },
            });
        });
    });

    describe("validateArticleAgainstCategory", () => {
        it("should validate article with valid cover images", async () => {
            const mockCategory = {
                id: 1,
                config: { maxCoverImages: 3 },
            };
            const articleData = { coverImages: ["img1.jpg", "img2.jpg"] };

            mockRepository.findOne.mockResolvedValue(mockCategory);

            await expect(service.validateArticleAgainstCategory(1, articleData)).resolves.toBeUndefined();
        });

        it("should throw error if cover images exceed limit", async () => {
            const mockCategory = {
                id: 1,
                config: { maxCoverImages: 2 },
            };
            const articleData = { coverImages: ["img1.jpg", "img2.jpg", "img3.jpg"] };

            mockRepository.findOne.mockResolvedValue(mockCategory);

            await expect(service.validateArticleAgainstCategory(1, articleData)).rejects.toThrow();
        });
    });

    describe("remove", () => {
        it("should remove non-built-in category without articles", async () => {
            const mockCategory = {
                id: 1,
                isBuiltIn: false,
                articles: [],
                children: [],
            };

            mockRepository.findOne.mockResolvedValue(mockCategory);
            mockRepository.delete.mockResolvedValue({ affected: 1 });

            await expect(service.remove(1)).resolves.toBeUndefined();
            expect(mockRepository.delete).toHaveBeenCalledWith(1);
        });

        it("should throw error when removing built-in category", async () => {
            const mockCategory = {
                id: 1,
                isBuiltIn: true,
            };

            mockRepository.findOne.mockResolvedValue(mockCategory);

            await expect(service.remove(1)).rejects.toThrow();
        });

        it("should throw error when category has articles", async () => {
            const mockCategory = {
                id: 1,
                isBuiltIn: false,
                articles: [{ id: 1 }],
            };

            mockRepository.findOne.mockResolvedValue(mockCategory);

            await expect(service.remove(1)).rejects.toThrow();
        });
    });

    describe("getCategoryConfig", () => {
        it("should return category config", async () => {
            const mockConfig = { maxCoverImages: 3, maxVersions: 10 };
            const mockCategory = {
                id: 1,
                config: mockConfig,
            };

            mockRepository.findOne.mockResolvedValue(mockCategory);

            const result = await service.getCategoryConfig(1);

            expect(result).toEqual(mockConfig);
        });

        it("should return empty object if category has no config", async () => {
            const mockCategory = {
                id: 1,
                config: null,
            };

            mockRepository.findOne.mockResolvedValue(mockCategory);

            const result = await service.getCategoryConfig(1);

            expect(result).toEqual({});
        });
    });
});

import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Connection, Brackets } from "typeorm";
import { ArticleEntity } from "./entities/article.entity";
import { CreateArticleDto } from "./dto/create-article.dto";
import { UpdateArticleDto } from "./dto/update-article.dto";
import { FindAllArticleDto } from "./dto/find-all-article.dto";
import { PaginatedArticleDto } from "./dto/paginated-article.dto";
import { PublicArticleDetailDto } from "./dto/public-article-detail.dto";
import { PaginatedArticleListDto } from "./dto/paginated-article-list.dto";
import { ArticleListItemDto } from "./dto/article-list-item.dto";
import { ArticleVersionEntity } from "../article-version/entities/article-version.entity";
import { CategoryEntity } from "../category/entities/category.entity";
import { ArticleHttpCode } from "./enums/article-http-code.enum";
import { generateSlug, validateSlugFormat, generateUniqueSlug } from "./utils/slug-generator";
import { ArticleOperationLogService } from "./services/article-operation-log.service";

@Injectable()
export class ArticleService {
    private readonly logger = new Logger(ArticleService.name);

    constructor(
        @InjectRepository(ArticleEntity)
        private readonly articleRepository: Repository<ArticleEntity>,
        @InjectRepository(ArticleVersionEntity)
        private readonly versionRepository: Repository<ArticleVersionEntity>,
        @InjectRepository(CategoryEntity)
        private readonly categoryRepository: Repository<CategoryEntity>,
        private readonly connection: Connection,
        private readonly operationLogService: ArticleOperationLogService,
    ) {}

    /**
     * Create a new article with its first version
     */
    async create(createArticleDto: CreateArticleDto, userId: string): Promise<ArticleEntity> {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Verify category exists
            const category = await queryRunner.manager.findOne(CategoryEntity, {
                where: { id: createArticleDto.categoryId },
            });

            if (!category) {
                throw new NotFoundException({
                    code: ArticleHttpCode.CATEGORY_NOT_FOUND,
                    message: `分类 ID ${createArticleDto.categoryId} 不存在`,
                });
            }

            // Validate cover images against category config
            await this.validateCoverImages(createArticleDto.coverImages, category);

            // Validate scheduled time if provided
            this.validateScheduledTime(createArticleDto.scheduledAt);

            // Validate slug format and uniqueness if provided
            const slug = createArticleDto.slug?.trim();
            if (slug && slug.length > 0) {
                if (!validateSlugFormat(slug)) {
                    throw new BadRequestException({
                        code: ArticleHttpCode.INVALID_SLUG_FORMAT,
                        message: "slug 格式无效，只能包含小写字母、数字和连字符",
                    });
                }

                // Check slug uniqueness
                const existingArticle = await queryRunner.manager.findOne(ArticleEntity, {
                    where: { slug },
                });
                if (existingArticle) {
                    throw new ConflictException({
                        code: ArticleHttpCode.ARTICLE_SLUG_ALREADY_EXISTS,
                        message: "该 slug 已被使用，请使用其他标识",
                    });
                }
            }

            // Create article
            const article = queryRunner.manager.create(ArticleEntity, {
                slug: slug && slug.length > 0 ? slug : null,
                categoryId: createArticleDto.categoryId,
                userId,
                status: "draft",
                scheduledAt: createArticleDto.scheduledAt ? new Date(createArticleDto.scheduledAt) : null,
            });

            const savedArticle = await queryRunner.manager.save(article);

            // Create first version
            const version = queryRunner.manager.create(ArticleVersionEntity, {
                articleId: savedArticle.id,
                versionNumber: 1,
                title: createArticleDto.title,
                summary: createArticleDto.summary?.trim() || null,
                content: createArticleDto.content,
                coverImages: createArticleDto.coverImages || [],
                sortWeight: createArticleDto.sortWeight || 0,
                seoTitle: createArticleDto.seoTitle?.trim() || null,
                seoDescription: createArticleDto.seoDescription?.trim() || null,
                seoKeywords: createArticleDto.seoKeywords?.trim() || null,
                status: "draft",
                isCurrent: true,
                userId,
            });

            const savedVersion = await queryRunner.manager.save(version);

            // Update article with current version reference
            await queryRunner.manager.update(ArticleEntity, savedArticle.id, {
                currentVersionId: savedVersion.id,
            });

            await queryRunner.commitTransaction();

            this.logger.log(`Created article: ${savedArticle.slug || "no-slug"} (ID: ${savedArticle.id})`);

            // Return article with relations
            return await this.findOne(savedArticle.id);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            if (
                error instanceof NotFoundException ||
                error instanceof BadRequestException ||
                error instanceof ConflictException
            ) {
                throw error;
            }
            this.logger.error(`Failed to create article: ${error.message}`, error.stack);
            throw new BadRequestException({
                code: ArticleHttpCode.ARTICLE_CREATE_FAILED,
                message: "创建文章失败",
            });
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Find all articles with pagination, filtering, and sorting
     */
    async findAll(query: FindAllArticleDto): Promise<PaginatedArticleDto> {
        try {
            const {
                page = 1,
                pageSize = 10,
                categoryId,
                categoryCode,
                status,
                sortBy = "publishedAt",
                sortOrder = "DESC",
                keyword,
            } = query;

            const queryBuilder = this.articleRepository
                .createQueryBuilder("article")
                .leftJoinAndSelect("article.category", "category")
                .leftJoinAndSelect("article.currentVersion", "currentVersion");

            // 默认不显示已删除的文章
            queryBuilder.andWhere("article.isDeleted = :isDeleted", { isDeleted: false });

            // Filter by category (including subcategories)
            // Priority: categoryCode > categoryId (for backward compatibility)
            if (categoryCode || categoryId) {
                let category: CategoryEntity;

                if (categoryCode) {
                    // Query by category code (new approach)
                    category = await this.categoryRepository.findOne({
                        where: { code: categoryCode },
                        relations: ["children"],
                    });

                    if (!category) {
                        throw new NotFoundException({
                            code: ArticleHttpCode.CATEGORY_NOT_FOUND,
                            message: `分类标识 ${categoryCode} 不存在`,
                        });
                    }
                } else {
                    // Query by category ID (deprecated, for backward compatibility)
                    category = await this.categoryRepository.findOne({
                        where: { id: categoryId },
                        relations: ["children"],
                    });

                    if (!category) {
                        throw new NotFoundException({
                            code: ArticleHttpCode.CATEGORY_NOT_FOUND,
                            message: `分类 ID ${categoryId} 不存在`,
                        });
                    }
                }

                // Get all subcategory IDs recursively
                const categoryIds = await this.getAllSubcategoryIds(category.id);
                queryBuilder.andWhere("article.categoryId IN (:...categoryIds)", { categoryIds });
            }

            // Filter by status
            if (status) {
                queryBuilder.andWhere("article.status = :status", { status });
            }

            // Search by keyword in title and content (search in version table)
            if (keyword) {
                queryBuilder.andWhere(
                    new Brackets((qb) => {
                        qb.where("currentVersion.title LIKE :keyword", { keyword: `%${keyword}%` }).orWhere(
                            "currentVersion.content LIKE :keyword",
                            { keyword: `%${keyword}%` },
                        );
                    }),
                );
            }

            // Apply sorting
            if (sortBy === "sortWeight") {
                queryBuilder.orderBy("currentVersion.sortWeight", sortOrder);
            } else if (sortBy === "publishedAt") {
                queryBuilder.orderBy("article.publishedAt", sortOrder);
            } else if (sortBy === "updateDate") {
                queryBuilder.orderBy("article.updateDate", sortOrder);
            }

            // Add secondary sort by ID for consistent ordering
            queryBuilder.addOrderBy("article.id", "DESC");

            // Get total count
            const total = await queryBuilder.getCount();

            // Apply pagination
            const skip = (page - 1) * pageSize;
            queryBuilder.skip(skip).take(pageSize);

            // Execute query
            const items = await queryBuilder.getMany();

            return {
                items,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`Failed to find articles: ${error.message}`, error.stack);
            throw new BadRequestException("查询文章列表失败");
        }
    }

    /**
     * Find all articles for public API (without content field)
     * 专门用于公开接口的列表查询，不返回文章详细内容
     */
    async findAllForPublic(query: FindAllArticleDto): Promise<PaginatedArticleListDto> {
        try {
            const {
                page = 1,
                pageSize = 10,
                categoryId,
                categoryCode,
                status,
                sortBy = "publishedAt",
                sortOrder = "DESC",
                keyword,
            } = query;

            const queryBuilder = this.articleRepository
                .createQueryBuilder("article")
                .leftJoinAndSelect("article.category", "category")
                .leftJoin("article.currentVersion", "currentVersion")
                .addSelect([
                    "currentVersion.id",
                    "currentVersion.title",
                    "currentVersion.summary",
                    "currentVersion.coverImages",
                    "currentVersion.sortWeight",
                    "currentVersion.seoTitle",
                    "currentVersion.seoDescription",
                    "currentVersion.seoKeywords",
                ]);

            // 默认不显示已删除的文章
            queryBuilder.andWhere("article.isDeleted = :isDeleted", { isDeleted: false });

            // Filter by category (including subcategories)
            if (categoryCode || categoryId) {
                let category: CategoryEntity;

                if (categoryCode) {
                    category = await this.categoryRepository.findOne({
                        where: { code: categoryCode },
                        relations: ["children"],
                    });

                    if (!category) {
                        throw new NotFoundException({
                            code: ArticleHttpCode.CATEGORY_NOT_FOUND,
                            message: `分类标识 ${categoryCode} 不存在`,
                        });
                    }
                } else {
                    category = await this.categoryRepository.findOne({
                        where: { id: categoryId },
                        relations: ["children"],
                    });

                    if (!category) {
                        throw new NotFoundException({
                            code: ArticleHttpCode.CATEGORY_NOT_FOUND,
                            message: `分类 ID ${categoryId} 不存在`,
                        });
                    }
                }

                const categoryIds = await this.getAllSubcategoryIds(category.id);
                queryBuilder.andWhere("article.categoryId IN (:...categoryIds)", { categoryIds });
            }

            // Filter by status
            if (status) {
                queryBuilder.andWhere("article.status = :status", { status });
            }

            // Search by keyword
            if (keyword) {
                queryBuilder.andWhere(
                    new Brackets((qb) => {
                        qb.where("currentVersion.title LIKE :keyword", { keyword: `%${keyword}%` }).orWhere(
                            "currentVersion.summary LIKE :keyword",
                            { keyword: `%${keyword}%` },
                        );
                    }),
                );
            }

            // Apply sorting
            if (sortBy === "sortWeight") {
                queryBuilder.orderBy("currentVersion.sortWeight", sortOrder);
            } else if (sortBy === "publishedAt") {
                queryBuilder.orderBy("article.publishedAt", sortOrder);
            } else if (sortBy === "updateDate") {
                queryBuilder.orderBy("article.updateDate", sortOrder);
            }

            queryBuilder.addOrderBy("article.id", "DESC");

            // Get total count
            const total = await queryBuilder.getCount();

            // Apply pagination
            const skip = (page - 1) * pageSize;
            queryBuilder.skip(skip).take(pageSize);

            // Execute query
            const articles = await queryBuilder.getMany();

            // Transform to list item DTOs
            const items: ArticleListItemDto[] = articles.map((article) => ({
                id: article.id,
                slug: article.slug,
                status: article.status,
                publishedAt: article.publishedAt,
                createDate: article.createDate,
                updateDate: article.updateDate,
                category: article.category,
                title: article.currentVersion?.title || "",
                summary: article.currentVersion?.summary || "",
                coverImages: article.currentVersion?.coverImages || [],
                sortWeight: article.currentVersion?.sortWeight || 0,
                seoTitle: article.currentVersion?.seoTitle || "",
                seoDescription: article.currentVersion?.seoDescription || "",
                seoKeywords: article.currentVersion?.seoKeywords || "",
            }));

            return {
                items,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`Failed to find articles for public: ${error.message}`, error.stack);
            throw new BadRequestException("查询文章列表失败");
        }
    }

    /**
     * Find article by ID (internal use, no access control)
     */
    async findOne(id: number): Promise<ArticleEntity> {
        try {
            const article = await this.articleRepository.findOne({
                where: { id },
                relations: ["category", "currentVersion", "publishedVersion", "versions"],
            });

            if (!article) {
                throw new NotFoundException({
                    code: ArticleHttpCode.ARTICLE_NOT_FOUND,
                    message: `文章 ID ${id} 不存在`,
                });
            }

            return article;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`Failed to find article ${id}: ${error.message}`, error.stack);
            throw new BadRequestException("查询文章详情失败");
        }
    }

    /**
     * Find article by ID with access control (public API)
     */
    async findOnePublic(id: number, userId?: string): Promise<ArticleEntity> {
        try {
            const article = await this.findOne(id);

            // Check access control for draft articles
            if (article.status === "draft") {
                if (!userId || article.userId !== userId) {
                    throw new NotFoundException({
                        code: ArticleHttpCode.ARTICLE_NOT_FOUND,
                        message: `文章 ID ${id} 不存在或无权访问`,
                    });
                }
            }

            return article;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`Failed to find article ${id}: ${error.message}`, error.stack);
            throw new BadRequestException("查询文章详情失败");
        }
    }

    /**
     * Find article by ID for public API (flattened structure, no version concept)
     * 专门用于公开接口，返回扁平化的数据结构，隐藏版本概念
     */
    async findOneForPublic(id: number): Promise<PublicArticleDetailDto> {
        try {
            // 只加载当前版本，不加载所有版本
            const article = await this.articleRepository.findOne({
                where: { id },
                relations: ["category", "currentVersion"],
            });

            if (!article) {
                throw new NotFoundException({
                    code: ArticleHttpCode.ARTICLE_NOT_FOUND,
                    message: `文章 ID ${id} 不存在`,
                });
            }

            // 只返回已发布的文章
            if (article.status !== "published") {
                throw new NotFoundException({
                    code: ArticleHttpCode.ARTICLE_NOT_FOUND,
                    message: "文章不存在或未发布",
                });
            }

            // 确保有当前版本
            if (!article.currentVersion) {
                throw new NotFoundException({
                    code: ArticleHttpCode.ARTICLE_NOT_FOUND,
                    message: "文章版本不存在",
                });
            }

            // 将版本数据扁平化到文章对象中
            const dto: PublicArticleDetailDto = {
                id: article.id,
                slug: article.slug,
                status: article.status,
                publishedAt: article.publishedAt,
                category: article.category,
                title: article.currentVersion.title,
                summary: article.currentVersion.summary,
                content: article.currentVersion.content,
                coverImages: article.currentVersion.coverImages || [],
                sortWeight: article.currentVersion.sortWeight,
                seoTitle: article.currentVersion.seoTitle || "",
                seoDescription: article.currentVersion.seoDescription || "",
                seoKeywords: article.currentVersion.seoKeywords || "",
                createDate: article.createDate,
                updateDate: article.updateDate,
            };

            return dto;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`Failed to find article for public ${id}: ${error.message}`, error.stack);
            throw new BadRequestException("查询文章详情失败");
        }
    }

    /**
     * Search articles with relevance scoring
     */
    async search(keyword: string, query: FindAllArticleDto): Promise<PaginatedArticleDto> {
        try {
            if (!keyword || keyword.trim().length === 0) {
                return this.findAll(query);
            }

            const { page = 1, pageSize = 10, categoryId, categoryCode, status, sortOrder = "DESC" } = query;

            // Build query with relevance scoring
            const queryBuilder = this.articleRepository
                .createQueryBuilder("article")
                .leftJoinAndSelect("article.category", "category")
                .leftJoinAndSelect("article.currentVersion", "currentVersion");

            // Filter by category if specified
            // Priority: categoryCode > categoryId (for backward compatibility)
            if (categoryCode || categoryId) {
                let category: CategoryEntity;

                if (categoryCode) {
                    category = await this.categoryRepository.findOne({
                        where: { code: categoryCode },
                    });

                    if (!category) {
                        throw new NotFoundException({
                            code: ArticleHttpCode.CATEGORY_NOT_FOUND,
                            message: `分类标识 ${categoryCode} 不存在`,
                        });
                    }
                } else {
                    category = await this.categoryRepository.findOne({
                        where: { id: categoryId },
                    });

                    if (!category) {
                        throw new NotFoundException({
                            code: ArticleHttpCode.CATEGORY_NOT_FOUND,
                            message: `分类 ID ${categoryId} 不存在`,
                        });
                    }
                }

                const categoryIds = await this.getAllSubcategoryIds(category.id);
                queryBuilder.andWhere("article.categoryId IN (:...categoryIds)", { categoryIds });
            }

            // Filter by status if specified
            if (status) {
                queryBuilder.andWhere("article.status = :status", { status });
            }

            // Search in title and content with relevance scoring
            const searchTerm = `%${keyword}%`;
            queryBuilder.andWhere(
                new Brackets((qb) => {
                    qb.where("currentVersion.title LIKE :searchTerm", { searchTerm })
                        .orWhere("currentVersion.content LIKE :searchTerm", { searchTerm })
                        .orWhere("currentVersion.summary LIKE :searchTerm", { searchTerm });
                }),
            );

            // Add relevance scoring (title matches are more relevant than content matches)
            queryBuilder.addSelect(
                `(
                    CASE 
                        WHEN currentVersion.title LIKE :exactMatch THEN 100
                        WHEN currentVersion.title LIKE :searchTerm THEN 50
                        WHEN currentVersion.summary LIKE :searchTerm THEN 30
                        WHEN currentVersion.content LIKE :searchTerm THEN 10
                        ELSE 0
                    END
                )`,
                "relevance",
            );
            queryBuilder.setParameter("exactMatch", `%${keyword}%`);

            // Sort by relevance first, then by other criteria
            queryBuilder.orderBy("relevance", sortOrder as "ASC" | "DESC");
            queryBuilder.addOrderBy("article.publishedAt", "DESC");

            // Get total count
            const total = await queryBuilder.getCount();

            // Apply pagination
            const skip = (page - 1) * pageSize;
            queryBuilder.skip(skip).take(pageSize);

            // Execute query
            const items = await queryBuilder.getMany();

            return {
                items,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            };
        } catch (error) {
            this.logger.error(`Failed to search articles: ${error.message}`, error.stack);
            throw new BadRequestException("搜索文章失败");
        }
    }

    /**
     * Find article by slug (internal use, no access control)
     */
    async findBySlug(slug: string): Promise<ArticleEntity> {
        try {
            const article = await this.articleRepository.findOne({
                where: { slug },
                relations: ["category", "currentVersion", "publishedVersion"],
            });

            if (!article) {
                throw new NotFoundException({
                    code: ArticleHttpCode.ARTICLE_NOT_FOUND,
                    message: `文章 slug '${slug}' 不存在`,
                });
            }

            return article;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`Failed to find article by slug ${slug}: ${error.message}`, error.stack);
            throw new BadRequestException("查询文章详情失败");
        }
    }

    /**
     * Find article by slug with access control (public API)
     */
    async findBySlugPublic(slug: string, userId?: string): Promise<ArticleEntity> {
        try {
            const article = await this.findBySlug(slug);

            // Check access control for draft articles
            if (article.status === "draft") {
                if (!userId || article.userId !== userId) {
                    throw new NotFoundException({
                        code: ArticleHttpCode.ARTICLE_NOT_FOUND,
                        message: `文章 slug '${slug}' 不存在或无权访问`,
                    });
                }
            }

            return article;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`Failed to find article by slug ${slug}: ${error.message}`, error.stack);
            throw new BadRequestException("查询文章详情失败");
        }
    }

    /**
     * Find article by slug for public API (flattened structure, no version concept)
     * 专门用于公开接口，返回扁平化的数据结构，隐藏版本概念
     */
    async findBySlugForPublic(slug: string): Promise<PublicArticleDetailDto> {
        try {
            // 只加载当前版本，不加载所有版本
            const article = await this.articleRepository.findOne({
                where: { slug },
                relations: ["category", "currentVersion"],
            });

            if (!article) {
                throw new NotFoundException({
                    code: ArticleHttpCode.ARTICLE_NOT_FOUND,
                    message: `文章 slug '${slug}' 不存在`,
                });
            }

            // 只返回已发布的文章
            if (article.status !== "published") {
                throw new NotFoundException({
                    code: ArticleHttpCode.ARTICLE_NOT_FOUND,
                    message: "文章不存在或未发布",
                });
            }

            // 确保有当前版本
            if (!article.currentVersion) {
                throw new NotFoundException({
                    code: ArticleHttpCode.ARTICLE_NOT_FOUND,
                    message: "文章版本不存在",
                });
            }

            // 将版本数据扁平化到文章对象中
            const dto: PublicArticleDetailDto = {
                id: article.id,
                slug: article.slug,
                status: article.status,
                publishedAt: article.publishedAt,
                category: article.category,
                title: article.currentVersion.title,
                summary: article.currentVersion.summary,
                content: article.currentVersion.content,
                coverImages: article.currentVersion.coverImages || [],
                sortWeight: article.currentVersion.sortWeight,
                seoTitle: article.currentVersion.seoTitle || "",
                seoDescription: article.currentVersion.seoDescription || "",
                seoKeywords: article.currentVersion.seoKeywords || "",
                createDate: article.createDate,
                updateDate: article.updateDate,
            };

            return dto;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`Failed to find article by slug for public ${slug}: ${error.message}`, error.stack);
            throw new BadRequestException("查询文章详情失败");
        }
    }

    /**
     * Update article by creating a new version
     */
    async update(id: number, updateArticleDto: UpdateArticleDto, userId: string): Promise<ArticleEntity> {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const article = await this.findOne(id);

            // Validate category if being updated
            if (updateArticleDto.categoryId && updateArticleDto.categoryId !== article.categoryId) {
                const category = await queryRunner.manager.findOne(CategoryEntity, {
                    where: { id: updateArticleDto.categoryId },
                });

                if (!category) {
                    throw new NotFoundException({
                        code: ArticleHttpCode.CATEGORY_NOT_FOUND,
                        message: `分类 ID ${updateArticleDto.categoryId} 不存在`,
                    });
                }

                // Update article category
                await queryRunner.manager.update(ArticleEntity, id, {
                    categoryId: updateArticleDto.categoryId,
                });
            }

            // Validate cover images if being updated
            if (updateArticleDto.coverImages) {
                await this.validateCoverImages(updateArticleDto.coverImages, article.category);
            }

            // Update scheduled time if provided
            if (updateArticleDto.scheduledAt !== undefined) {
                // Validate scheduled time if it's being set (not cleared)
                if (updateArticleDto.scheduledAt) {
                    this.validateScheduledTime(updateArticleDto.scheduledAt);
                }

                await queryRunner.manager.update(ArticleEntity, id, {
                    scheduledAt: updateArticleDto.scheduledAt ? new Date(updateArticleDto.scheduledAt) : null,
                });
            }

            // Update slug if provided
            if (updateArticleDto.slug !== undefined) {
                const newSlug = updateArticleDto.slug?.trim();

                // Validate slug format and uniqueness if provided
                if (newSlug && newSlug.length > 0) {
                    if (!validateSlugFormat(newSlug)) {
                        throw new BadRequestException({
                            code: ArticleHttpCode.INVALID_SLUG_FORMAT,
                            message: "slug 格式无效，只能包含小写字母、数字和连字符",
                        });
                    }

                    // Check slug uniqueness (excluding current article)
                    const existingArticle = await queryRunner.manager.findOne(ArticleEntity, {
                        where: { slug: newSlug },
                    });

                    // Log for debugging
                    if (existingArticle) {
                        this.logger.debug(
                            `Slug check: existing article id=${
                                existingArticle.id
                            } (type: ${typeof existingArticle.id}), current article id=${id} (type: ${typeof id}), same=${
                                existingArticle.id === id
                            }`,
                        );
                    }

                    // Use loose equality to handle potential type differences, but ensure we're comparing numbers
                    if (existingArticle && Number(existingArticle.id) !== Number(id)) {
                        throw new ConflictException({
                            code: ArticleHttpCode.ARTICLE_SLUG_ALREADY_EXISTS,
                            message: "该 slug 已被使用，请使用其他标识",
                        });
                    }
                }

                await queryRunner.manager.update(ArticleEntity, id, {
                    slug: newSlug && newSlug.length > 0 ? newSlug : null,
                });
            }

            // Create new version with updated content
            const latestVersion = await queryRunner.manager.findOne(ArticleVersionEntity, {
                where: { articleId: id },
                order: { versionNumber: "DESC" },
            });

            const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

            // Check version limit and cleanup if necessary
            await this.enforceVersionLimit(id, article.category, queryRunner.manager);

            const newVersion = queryRunner.manager.create(ArticleVersionEntity, {
                articleId: id,
                versionNumber: nextVersionNumber,
                title: updateArticleDto.title || article.currentVersion.title,
                summary:
                    updateArticleDto.summary !== undefined
                        ? updateArticleDto.summary?.trim() || null
                        : article.currentVersion.summary,
                content: updateArticleDto.content || article.currentVersion.content,
                coverImages: updateArticleDto.coverImages || article.currentVersion.coverImages,
                sortWeight: updateArticleDto.sortWeight ?? article.currentVersion.sortWeight,
                seoTitle:
                    updateArticleDto.seoTitle !== undefined
                        ? updateArticleDto.seoTitle?.trim() || null
                        : article.currentVersion.seoTitle,
                seoDescription:
                    updateArticleDto.seoDescription !== undefined
                        ? updateArticleDto.seoDescription?.trim() || null
                        : article.currentVersion.seoDescription,
                seoKeywords:
                    updateArticleDto.seoKeywords !== undefined
                        ? updateArticleDto.seoKeywords?.trim() || null
                        : article.currentVersion.seoKeywords,
                status: article.status,
                isCurrent: true,
                userId,
            });

            const savedVersion = await queryRunner.manager.save(newVersion);

            // Update current version flags
            await queryRunner.manager.update(ArticleVersionEntity, { articleId: id }, { isCurrent: false });
            await queryRunner.manager.update(ArticleVersionEntity, { id: savedVersion.id }, { isCurrent: true });

            // Update article's current version reference
            await queryRunner.manager.update(ArticleEntity, id, {
                currentVersionId: savedVersion.id,
            });

            await queryRunner.commitTransaction();

            const updatedArticle = await queryRunner.manager.findOne(ArticleEntity, { where: { id } });
            this.logger.log(
                `Updated article: ${
                    updatedArticle?.slug || "no-slug"
                } (ID: ${id}), created version ${nextVersionNumber}`,
            );

            return await this.findOne(id);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            if (
                error instanceof NotFoundException ||
                error instanceof BadRequestException ||
                error instanceof ConflictException
            ) {
                throw error;
            }
            this.logger.error(`Failed to update article ${id}: ${error.message}`, error.stack);
            throw new BadRequestException({
                code: ArticleHttpCode.ARTICLE_UPDATE_FAILED,
                message: "更新文章失败",
            });
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Publish an article
     */
    async publish(id: number): Promise<ArticleEntity> {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const article = await this.findOne(id);

            // 如果文章已经是发布状态，更新 publishedVersionId 为当前版本
            const isAlreadyPublished = article.status === "published";

            // Update article status and published time
            await queryRunner.manager.update(ArticleEntity, id, {
                status: "published",
                publishedAt: isAlreadyPublished ? article.publishedAt : new Date(),
                publishedVersionId: article.currentVersionId,
            });

            // Update current version status to published
            await queryRunner.manager.update(
                ArticleVersionEntity,
                { id: article.currentVersionId },
                { status: "published" },
            );

            await queryRunner.commitTransaction();

            this.logger.log(`Published article: ${article.slug} (ID: ${id})`);

            return await this.findOne(id);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`Failed to publish article ${id}: ${error.message}`, error.stack);
            throw new BadRequestException({
                code: ArticleHttpCode.ARTICLE_UPDATE_FAILED,
                message: "发布文章失败",
            });
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Archive an article
     */
    async archive(id: number): Promise<ArticleEntity> {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const article = await this.findOne(id);

            if (article.status === "archived") {
                throw new BadRequestException({
                    code: ArticleHttpCode.ARTICLE_UPDATE_FAILED,
                    message: "文章已经是归档状态",
                });
            }

            // Update article status
            await queryRunner.manager.update(ArticleEntity, id, {
                status: "archived",
            });

            // Update current version status to archived
            await queryRunner.manager.update(
                ArticleVersionEntity,
                { id: article.currentVersionId },
                { status: "archived" },
            );

            await queryRunner.commitTransaction();

            this.logger.log(`Archived article: ${article.slug} (ID: ${id})`);

            return await this.findOne(id);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`Failed to archive article ${id}: ${error.message}`, error.stack);
            throw new BadRequestException({
                code: ArticleHttpCode.ARTICLE_UPDATE_FAILED,
                message: "归档文章失败",
            });
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Get article statistics
     */
    async getStats(): Promise<any> {
        try {
            const total = await this.articleRepository.count();
            const draftCount = await this.articleRepository.count({ where: { status: "draft" } });
            const publishedCount = await this.articleRepository.count({ where: { status: "published" } });
            const archivedCount = await this.articleRepository.count({ where: { status: "archived" } });

            return {
                total,
                draft: draftCount,
                published: publishedCount,
                archived: archivedCount,
            };
        } catch (error) {
            this.logger.error(`Failed to get article stats: ${error.message}`, error.stack);
            throw new BadRequestException("获取文章统计信息失败");
        }
    }

    /**
     * Delete an article
     * - 已发布的文章：软删除（标记为删除，保留数据和操作记录）
     * - 草稿文章：硬删除（物理删除）
     */
    async remove(id: number, userId: string): Promise<void> {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const article = await this.findOne(id);

            // 判断是否为已发布的文章
            const isPublished = article.status === "published" || article.publishedAt !== null;

            if (isPublished) {
                // 软删除：已发布的文章
                await queryRunner.manager.update(ArticleEntity, id, {
                    isDeleted: true,
                    deletedAt: new Date(),
                    deletedBy: userId,
                });

                await queryRunner.commitTransaction();
                this.logger.log(`Soft deleted article: ${article.slug} (ID: ${id})`);
            } else {
                // 硬删除：草稿文章
                // Step 1: Clear foreign key references in article table
                await queryRunner.manager.update(ArticleEntity, id, {
                    currentVersionId: null,
                    publishedVersionId: null,
                });

                // Step 2: Delete all versions
                await queryRunner.manager.delete(ArticleVersionEntity, { articleId: id });

                // Step 3: Delete article
                await queryRunner.manager.delete(ArticleEntity, id);

                await queryRunner.commitTransaction();
                this.logger.log(`Hard deleted article: ${article.slug} (ID: ${id})`);
            }
        } catch (error) {
            await queryRunner.rollbackTransaction();
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`Failed to delete article ${id}: ${error.message}`, error.stack);
            throw new BadRequestException({
                code: ArticleHttpCode.ARTICLE_DELETE_FAILED,
                message: "删除文章失败",
            });
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Find all deleted articles
     */
    async findDeleted(query: FindAllArticleDto): Promise<PaginatedArticleDto> {
        try {
            const { page = 1, pageSize = 10, sortBy = "deletedAt", sortOrder = "DESC", keyword } = query;

            const queryBuilder = this.articleRepository
                .createQueryBuilder("article")
                .leftJoinAndSelect("article.category", "category")
                .leftJoinAndSelect("article.currentVersion", "currentVersion");

            // 只显示已删除的文章
            queryBuilder.andWhere("article.isDeleted = :isDeleted", { isDeleted: true });

            // Search by keyword
            if (keyword) {
                queryBuilder.andWhere("(currentVersion.title LIKE :keyword OR currentVersion.content LIKE :keyword)", {
                    keyword: `%${keyword}%`,
                });
            }

            // Apply sorting
            if (sortBy === "deletedAt") {
                queryBuilder.orderBy("article.deletedAt", sortOrder as "ASC" | "DESC");
            } else if (sortBy === "publishedAt") {
                queryBuilder.orderBy("article.publishedAt", sortOrder as "ASC" | "DESC");
            }

            // Add secondary sort by ID
            queryBuilder.addOrderBy("article.id", "DESC");

            // Get total count
            const total = await queryBuilder.getCount();

            // Apply pagination
            const skip = (page - 1) * pageSize;
            queryBuilder.skip(skip).take(pageSize);

            // Execute query
            const items = await queryBuilder.getMany();

            return {
                items,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            };
        } catch (error) {
            this.logger.error(`Failed to find deleted articles: ${error.message}`, error.stack);
            throw new BadRequestException("查询已删除文章列表失败");
        }
    }

    /**
     * Restore a soft-deleted article
     */
    async restore(id: number): Promise<ArticleEntity> {
        try {
            const article = await this.articleRepository.findOne({
                where: { id },
                relations: ["category", "currentVersion", "publishedVersion"],
            });

            if (!article) {
                throw new NotFoundException({
                    code: ArticleHttpCode.ARTICLE_NOT_FOUND,
                    message: `文章 ID ${id} 不存在`,
                });
            }

            if (!article.isDeleted) {
                throw new BadRequestException({
                    code: ArticleHttpCode.ARTICLE_UPDATE_FAILED,
                    message: "文章未被删除，无需恢复",
                });
            }

            await this.articleRepository.update(id, {
                isDeleted: false,
                deletedAt: null,
                deletedBy: null,
            });

            this.logger.log(`Restored article: ${article.slug} (ID: ${id})`);

            return await this.findOne(id);
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`Failed to restore article ${id}: ${error.message}`, error.stack);
            throw new BadRequestException({
                code: ArticleHttpCode.ARTICLE_UPDATE_FAILED,
                message: "恢复文章失败",
            });
        }
    }

    /**
     * Check if an article can be permanently deleted
     */
    async canPermanentlyDelete(id: number): Promise<{ canDelete: boolean; reason?: string }> {
        try {
            const article = await this.articleRepository.findOne({ where: { id } });

            if (!article) {
                return { canDelete: false, reason: "文章不存在" };
            }

            if (!article.isDeleted) {
                return { canDelete: false, reason: "文章未被删除，请先删除文章" };
            }

            const hasBeenPublished = article.publishedAt !== null || article.publishedVersionId !== null;
            if (hasBeenPublished) {
                return { canDelete: false, reason: "已发布过的文章不支持永久删除，需要保留操作记录" };
            }

            return { canDelete: true };
        } catch (error) {
            this.logger.error(`Failed to check if article ${id} can be permanently deleted: ${error.message}`);
            return { canDelete: false, reason: "检查失败" };
        }
    }

    /**
     * Permanently delete a soft-deleted article
     * Only for articles that are already soft-deleted and have never been published
     */
    async permanentlyDelete(id: number): Promise<void> {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const article = await this.articleRepository.findOne({ where: { id } });

            if (!article) {
                throw new NotFoundException({
                    code: ArticleHttpCode.ARTICLE_NOT_FOUND,
                    message: `文章 ID ${id} 不存在`,
                });
            }

            if (!article.isDeleted) {
                throw new BadRequestException({
                    code: ArticleHttpCode.ARTICLE_DELETE_FAILED,
                    message: "只能永久删除已标记为删除的文章",
                });
            }

            // 检查文章是否发布过
            const hasBeenPublished = article.publishedAt !== null || article.publishedVersionId !== null;
            if (hasBeenPublished) {
                throw new BadRequestException({
                    code: ArticleHttpCode.ARTICLE_DELETE_FAILED,
                    message: "已发布过的文章不支持永久删除，需要保留操作记录",
                });
            }

            // Step 1: Clear foreign key references
            await queryRunner.manager.update(ArticleEntity, id, {
                currentVersionId: null,
                publishedVersionId: null,
            });

            // Step 2: Delete all versions
            await queryRunner.manager.delete(ArticleVersionEntity, { articleId: id });

            // Step 3: Delete article
            await queryRunner.manager.delete(ArticleEntity, id);

            await queryRunner.commitTransaction();

            this.logger.log(`Permanently deleted article: ${article.slug} (ID: ${id})`);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`Failed to permanently delete article ${id}: ${error.message}`, error.stack);
            throw new BadRequestException({
                code: ArticleHttpCode.ARTICLE_DELETE_FAILED,
                message: "永久删除文章失败",
            });
        } finally {
            await queryRunner.release();
        }
    }

    // Helper methods

    private async getExistingSlugs(manager: any): Promise<string[]> {
        const articles = await manager.find(ArticleEntity, {
            select: ["slug"],
        });
        return articles.map((a: ArticleEntity) => a.slug);
    }

    private async getAllSubcategoryIds(categoryId: number): Promise<number[]> {
        const categoryIds = [categoryId];
        const subcategories = await this.categoryRepository.find({
            where: { parentId: categoryId },
        });

        for (const subcategory of subcategories) {
            const childIds = await this.getAllSubcategoryIds(subcategory.id);
            categoryIds.push(...childIds);
        }

        return categoryIds;
    }

    private async validateCoverImages(coverImages: string[], category: CategoryEntity): Promise<void> {
        if (!coverImages || coverImages.length === 0) {
            return;
        }

        const config = category?.config || {};
        const maxCoverImages = config.maxCoverImages || 5;

        if (coverImages.length > maxCoverImages) {
            throw new BadRequestException({
                code: ArticleHttpCode.COVER_IMAGES_EXCEED_LIMIT,
                message: `封面图片数量不能超过 ${maxCoverImages} 张`,
            });
        }
    }

    private async enforceVersionLimit(articleId: number, category: CategoryEntity, manager: any): Promise<void> {
        const config = category?.config || {};
        const maxVersions = config.maxVersions || 10;

        const versionCount = await manager.count(ArticleVersionEntity, {
            where: { articleId },
        });

        if (versionCount >= maxVersions) {
            const versionsToDelete = await manager.find(ArticleVersionEntity, {
                where: {
                    articleId,
                    status: "draft",
                    isCurrent: false,
                },
                order: { versionNumber: "ASC" },
                take: versionCount - maxVersions + 1,
            });

            if (versionsToDelete.length > 0) {
                const idsToDelete = versionsToDelete.map((v: ArticleVersionEntity) => v.id);
                await manager.delete(ArticleVersionEntity, idsToDelete);
            }
        }
    }

    /**
     * Validate scheduled publish time
     */
    private validateScheduledTime(scheduledAt: string | Date | null | undefined): void {
        if (!scheduledAt) {
            return;
        }

        const scheduledDate = typeof scheduledAt === "string" ? new Date(scheduledAt) : scheduledAt;

        // Check if date is valid
        if (isNaN(scheduledDate.getTime())) {
            throw new BadRequestException({
                code: ArticleHttpCode.INVALID_SCHEDULED_TIME,
                message: "预定发布时间格式无效",
            });
        }

        // Check if scheduled time is in the future
        const now = new Date();
        if (scheduledDate <= now) {
            throw new BadRequestException({
                code: ArticleHttpCode.SCHEDULED_TIME_IN_PAST,
                message: "预定发布时间必须晚于当前时间",
            });
        }
    }

    /**
     * Find all scheduled articles (articles with scheduledAt in the future and status is draft)
     */
    async findScheduled(): Promise<ArticleEntity[]> {
        try {
            const now = new Date();

            const articles = await this.articleRepository
                .createQueryBuilder("article")
                .leftJoinAndSelect("article.category", "category")
                .leftJoinAndSelect("article.currentVersion", "currentVersion")
                .where("article.status = :status", { status: "draft" })
                .andWhere("article.scheduledAt IS NOT NULL")
                .andWhere("article.scheduledAt <= :now", { now })
                .orderBy("article.scheduledAt", "ASC")
                .getMany();

            return articles;
        } catch (error) {
            this.logger.error(`Failed to find scheduled articles: ${error.message}`, error.stack);
            throw new BadRequestException("查询预定发布文章失败");
        }
    }

    /**
     * Find all pending scheduled articles (for display purposes)
     */
    async findPendingScheduled(): Promise<ArticleEntity[]> {
        try {
            const now = new Date();

            const articles = await this.articleRepository
                .createQueryBuilder("article")
                .leftJoinAndSelect("article.category", "category")
                .leftJoinAndSelect("article.currentVersion", "currentVersion")
                .where("article.status = :status", { status: "draft" })
                .andWhere("article.scheduledAt IS NOT NULL")
                .andWhere("article.scheduledAt > :now", { now })
                .orderBy("article.scheduledAt", "ASC")
                .getMany();

            return articles;
        } catch (error) {
            this.logger.error(`Failed to find pending scheduled articles: ${error.message}`, error.stack);
            throw new BadRequestException("查询待发布文章失败");
        }
    }

    /**
     * Update scheduled publish time with operation logging
     */
    async updateScheduledTime(id: number, scheduledAt: string | null, userId: string): Promise<ArticleEntity> {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const article = await this.findOne(id);

            // Only draft articles can have scheduled publishing
            if (article.status !== "draft") {
                throw new BadRequestException({
                    code: ArticleHttpCode.ARTICLE_UPDATE_FAILED,
                    message: "只有草稿状态的文章可以设置预定发布",
                });
            }

            const beforeData = {
                scheduledAt: article.scheduledAt,
                status: article.status,
            };

            // Validate scheduled time if it's being set (not cleared)
            if (scheduledAt) {
                this.validateScheduledTime(scheduledAt);
            }

            const newScheduledAt = scheduledAt ? new Date(scheduledAt) : null;

            // Update article scheduled time
            await queryRunner.manager.update(ArticleEntity, id, {
                scheduledAt: newScheduledAt,
            });

            const afterData = {
                scheduledAt: newScheduledAt,
                status: article.status,
            };

            // Log the operation
            const operationType = scheduledAt ? "schedule_publish" : "cancel_schedule";
            const description = scheduledAt ? `设置预定发布时间: ${scheduledAt}` : "取消预定发布";

            await this.operationLogService.createLog({
                articleId: id,
                operationType,
                description,
                beforeData,
                afterData,
                userId,
                status: "success",
            });

            await queryRunner.commitTransaction();

            this.logger.log(`Updated scheduled time for article ${id}: ${scheduledAt || "cancelled"}`);

            return await this.findOne(id);
        } catch (error) {
            await queryRunner.rollbackTransaction();

            // Log the failed operation
            await this.operationLogService.createLog({
                articleId: id,
                operationType: scheduledAt ? "schedule_publish" : "cancel_schedule",
                description: scheduledAt ? `设置预定发布时间: ${scheduledAt}` : "取消预定发布",
                userId,
                status: "failed",
                errorMessage: error.message,
            });

            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`Failed to update scheduled time for article ${id}: ${error.message}`, error.stack);
            throw new BadRequestException({
                code: ArticleHttpCode.ARTICLE_UPDATE_FAILED,
                message: "更新预定发布时间失败",
            });
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Cancel scheduled publishing
     */
    async cancelScheduledPublish(id: number, userId: string): Promise<ArticleEntity> {
        return this.updateScheduledTime(id, null, userId);
    }
}

import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ArticleEntity } from "../entities/article.entity";
import { ArticleVersionEntity } from "../../article-version/entities/article-version.entity";
import { CategoryEntity } from "../../category/entities/category.entity";
import { ArticleHttpCode } from "../enums/article-http-code.enum";
import { ArticleErrorResponse } from "../utils/article-error-response";
import { I18nType } from "../../../shared/enums/i18n.enum";
import { validateSlugFormat } from "../utils/slug-generator";

/**
 * Article Validation Service
 * Centralized validation logic for article system
 */
@Injectable()
export class ArticleValidationService {
    constructor(
        @InjectRepository(ArticleEntity)
        private readonly articleRepository: Repository<ArticleEntity>,
        @InjectRepository(ArticleVersionEntity)
        private readonly versionRepository: Repository<ArticleVersionEntity>,
        @InjectRepository(CategoryEntity)
        private readonly categoryRepository: Repository<CategoryEntity>,
    ) {}

    /**
     * Validate article creation data
     */
    async validateArticleCreation(
        data: {
            title: string;
            content: string;
            summary?: string;
            categoryId: number;
            coverImages?: string[];
            slug?: string;
            sortWeight?: number;
            scheduledAt?: string | Date;
        },
        lang: I18nType = I18nType.CHINESE,
    ): Promise<void> {
        // Validate title
        this.validateTitle(data.title, lang);

        // Validate content
        this.validateContent(data.content, lang);

        // Validate summary if provided
        if (data.summary !== undefined && data.summary !== null) {
            this.validateSummary(data.summary, lang);
        }

        // Validate category exists
        await this.validateCategoryExists(data.categoryId, lang);

        // Validate cover images
        if (data.coverImages && data.coverImages.length > 0) {
            const category = await this.categoryRepository.findOne({
                where: { id: data.categoryId },
            });
            await this.validateCoverImages(data.coverImages, category, lang);
        }

        // Validate slug if provided
        if (data.slug) {
            this.validateSlug(data.slug, lang);
            await this.validateSlugUniqueness(data.slug, lang);
        }

        // Validate sort weight
        if (data.sortWeight !== undefined) {
            this.validateSortWeight(data.sortWeight, lang);
        }

        // Validate scheduled time
        if (data.scheduledAt) {
            this.validateScheduledTime(data.scheduledAt, lang);
        }
    }

    /**
     * Validate article update data
     */
    async validateArticleUpdate(
        articleId: number,
        data: {
            title?: string;
            content?: string;
            summary?: string;
            categoryId?: number;
            coverImages?: string[];
            sortWeight?: number;
            scheduledAt?: string | Date;
        },
        lang: I18nType = I18nType.CHINESE,
    ): Promise<void> {
        // Validate title if provided
        if (data.title !== undefined) {
            this.validateTitle(data.title, lang);
        }

        // Validate content if provided
        if (data.content !== undefined) {
            this.validateContent(data.content, lang);
        }

        // Validate summary if provided
        if (data.summary !== undefined) {
            this.validateSummary(data.summary, lang);
        }

        // Validate category if being changed
        if (data.categoryId !== undefined) {
            await this.validateCategoryExists(data.categoryId, lang);

            // Validate cover images against new category
            if (data.coverImages) {
                const category = await this.categoryRepository.findOne({
                    where: { id: data.categoryId },
                });
                await this.validateCoverImages(data.coverImages, category, lang);
            }
        }

        // Validate sort weight if provided
        if (data.sortWeight !== undefined) {
            this.validateSortWeight(data.sortWeight, lang);
        }

        // Validate scheduled time if provided
        if (data.scheduledAt !== undefined && data.scheduledAt !== null) {
            this.validateScheduledTime(data.scheduledAt, lang);
        }
    }

    /**
     * Validate article title
     */
    validateTitle(title: string, lang: I18nType = I18nType.CHINESE): void {
        if (!title || title.trim().length === 0) {
            throw new BadRequestException(
                ArticleErrorResponse.validationError(
                    ArticleHttpCode.INVALID_ARTICLE_TITLE,
                    lang === I18nType.ENGLISH ? "Title cannot be empty" : "标题不能为空",
                    lang,
                ),
            );
        }

        if (title.length > 200) {
            throw new BadRequestException(
                ArticleErrorResponse.validationError(
                    ArticleHttpCode.INVALID_ARTICLE_TITLE,
                    lang === I18nType.ENGLISH ? "Title cannot exceed 200 characters" : "标题长度不能超过200个字符",
                    lang,
                ),
            );
        }
    }

    /**
     * Validate article content
     */
    validateContent(content: string, lang: I18nType = I18nType.CHINESE): void {
        if (!content || content.trim().length === 0) {
            throw new BadRequestException(
                ArticleErrorResponse.validationError(
                    ArticleHttpCode.INVALID_ARTICLE_CONTENT,
                    lang === I18nType.ENGLISH ? "Content cannot be empty" : "内容不能为空",
                    lang,
                ),
            );
        }

        // Check for minimum content length (at least 10 characters)
        if (content.trim().length < 10) {
            throw new BadRequestException(
                ArticleErrorResponse.validationError(
                    ArticleHttpCode.INVALID_ARTICLE_CONTENT,
                    lang === I18nType.ENGLISH ? "Content must be at least 10 characters" : "内容至少需要10个字符",
                    lang,
                ),
            );
        }
    }

    /**
     * Validate article summary
     */
    validateSummary(summary: string, lang: I18nType = I18nType.CHINESE): void {
        // Summary is optional, but if provided, it should not be empty
        if (summary && summary.trim().length === 0) {
            throw new BadRequestException(
                ArticleErrorResponse.validationError(
                    ArticleHttpCode.INVALID_ARTICLE_SUMMARY,
                    lang === I18nType.ENGLISH ? "Summary cannot be empty" : "摘要不能为空",
                    lang,
                ),
            );
        }

        if (summary && summary.length > 1000) {
            throw new BadRequestException(
                ArticleErrorResponse.validationError(
                    ArticleHttpCode.INVALID_ARTICLE_SUMMARY,
                    lang === I18nType.ENGLISH ? "Summary cannot exceed 1000 characters" : "摘要长度不能超过1000个字符",
                    lang,
                ),
            );
        }
    }

    /**
     * Validate slug format
     */
    validateSlug(slug: string, lang: I18nType = I18nType.CHINESE): void {
        if (!validateSlugFormat(slug)) {
            throw new BadRequestException(
                ArticleErrorResponse.validationError(
                    ArticleHttpCode.INVALID_SLUG_FORMAT,
                    lang === I18nType.ENGLISH
                        ? "Slug must contain only lowercase letters, numbers, and hyphens"
                        : "Slug只能包含小写字母、数字和连字符",
                    lang,
                ),
            );
        }
    }

    /**
     * Validate slug uniqueness
     */
    async validateSlugUniqueness(
        slug: string,
        lang: I18nType = I18nType.CHINESE,
        excludeArticleId?: number,
    ): Promise<void> {
        const existingArticle = await this.articleRepository.findOne({
            where: { slug },
        });

        if (existingArticle && existingArticle.id !== excludeArticleId) {
            throw new BadRequestException(
                ArticleErrorResponse.error(ArticleHttpCode.ARTICLE_SLUG_ALREADY_EXISTS, undefined, undefined, lang),
            );
        }
    }

    /**
     * Validate sort weight
     */
    validateSortWeight(sortWeight: number, lang: I18nType = I18nType.CHINESE): void {
        if (typeof sortWeight !== "number" || isNaN(sortWeight)) {
            throw new BadRequestException(
                ArticleErrorResponse.validationError(
                    ArticleHttpCode.INVALID_SORT_WEIGHT,
                    lang === I18nType.ENGLISH ? "Sort weight must be a number" : "排序权重必须是数字",
                    lang,
                ),
            );
        }

        if (sortWeight < 0 || sortWeight > 9999) {
            throw new BadRequestException(
                ArticleErrorResponse.validationError(
                    ArticleHttpCode.INVALID_SORT_WEIGHT,
                    lang === I18nType.ENGLISH ? "Sort weight must be between 0 and 9999" : "排序权重必须在0到9999之间",
                    lang,
                ),
            );
        }
    }

    /**
     * Validate scheduled publish time
     */
    validateScheduledTime(scheduledAt: string | Date, lang: I18nType = I18nType.CHINESE): void {
        const scheduledDate = typeof scheduledAt === "string" ? new Date(scheduledAt) : scheduledAt;

        // Check if date is valid
        if (isNaN(scheduledDate.getTime())) {
            throw new BadRequestException(
                ArticleErrorResponse.error(ArticleHttpCode.INVALID_SCHEDULED_TIME, undefined, undefined, lang),
            );
        }

        // Check if scheduled time is in the future
        const now = new Date();
        if (scheduledDate <= now) {
            throw new BadRequestException(ArticleErrorResponse.scheduledTimeInPast(lang));
        }
    }

    /**
     * Validate category exists
     */
    async validateCategoryExists(categoryId: number, lang: I18nType = I18nType.CHINESE): Promise<CategoryEntity> {
        const category = await this.categoryRepository.findOne({
            where: { id: categoryId },
        });

        if (!category) {
            throw new BadRequestException(ArticleErrorResponse.categoryNotFound(lang));
        }

        return category;
    }

    /**
     * Validate cover images
     */
    async validateCoverImages(
        coverImages: string[],
        category: CategoryEntity,
        lang: I18nType = I18nType.CHINESE,
    ): Promise<void> {
        if (!coverImages || coverImages.length === 0) {
            return;
        }

        // Validate each cover image URL
        for (const imageUrl of coverImages) {
            if (!this.isValidImageUrl(imageUrl)) {
                throw new BadRequestException(
                    ArticleErrorResponse.validationError(ArticleHttpCode.INVALID_COVER_IMAGE_URL, imageUrl, lang),
                );
            }
        }

        // Check against category config
        const config = category?.config || {};
        const maxCoverImages = config.maxCoverImages || 5;

        if (coverImages.length > maxCoverImages) {
            throw new BadRequestException(ArticleErrorResponse.coverImagesExceedLimit(maxCoverImages, lang));
        }
    }

    /**
     * Validate if URL is a valid image URL
     */
    private isValidImageUrl(url: string): boolean {
        if (!url || typeof url !== "string") {
            return false;
        }

        // Basic URL validation
        try {
            new URL(url);
        } catch {
            // If not a full URL, check if it's a valid relative path
            if (!url.startsWith("/") && !url.startsWith("./")) {
                return false;
            }
        }

        // Check for common image extensions
        const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
        const hasImageExtension = imageExtensions.some((ext) => url.toLowerCase().includes(ext));

        return hasImageExtension || url.includes("/images/") || url.includes("/uploads/");
    }

    /**
     * Validate category deletion
     */
    async validateCategoryDeletion(categoryId: number, lang: I18nType = I18nType.CHINESE): Promise<void> {
        const category = await this.categoryRepository.findOne({
            where: { id: categoryId },
            relations: ["articles", "children"],
        });

        if (!category) {
            throw new BadRequestException(ArticleErrorResponse.categoryNotFound(lang));
        }

        // Check if it's a built-in category
        if (category.isBuiltIn) {
            throw new BadRequestException(ArticleErrorResponse.builtInCategoryCannotDelete(category.name, lang));
        }

        // Check if category has articles
        if (category.articles && category.articles.length > 0) {
            throw new BadRequestException(ArticleErrorResponse.categoryHasArticles(category.articles.length, lang));
        }

        // Check if category has children
        if (category.children && category.children.length > 0) {
            throw new BadRequestException(
                ArticleErrorResponse.validationError(
                    ArticleHttpCode.CATEGORY_HAS_ARTICLES,
                    lang === I18nType.ENGLISH
                        ? `Category has ${category.children.length} subcategories`
                        : `分类下还有 ${category.children.length} 个子分类`,
                    lang,
                ),
            );
        }
    }

    /**
     * Validate built-in category protection
     */
    async validateBuiltInCategoryUpdate(
        categoryId: number,
        updateFields: string[],
        lang: I18nType = I18nType.CHINESE,
    ): Promise<void> {
        const category = await this.categoryRepository.findOne({
            where: { id: categoryId },
        });

        if (!category) {
            throw new BadRequestException(ArticleErrorResponse.categoryNotFound(lang));
        }

        if (category.isBuiltIn) {
            // Built-in categories can only update certain fields
            const allowedFields = ["description", "config", "sortWeight"];
            const invalidFields = updateFields.filter((field) => !allowedFields.includes(field));

            if (invalidFields.length > 0) {
                throw new BadRequestException(
                    ArticleErrorResponse.validationError(
                        ArticleHttpCode.BUILT_IN_CATEGORY_CANNOT_UPDATE,
                        lang === I18nType.ENGLISH
                            ? `Cannot update fields: ${invalidFields.join(", ")}`
                            : `不能修改字段: ${invalidFields.join(", ")}`,
                        lang,
                    ),
                );
            }
        }
    }

    /**
     * Validate version deletion
     */
    async validateVersionDeletion(versionId: number, lang: I18nType = I18nType.CHINESE): Promise<void> {
        const version = await this.versionRepository.findOne({
            where: { id: versionId },
            relations: ["article"],
        });

        if (!version) {
            throw new BadRequestException(ArticleErrorResponse.versionNotFound(lang));
        }

        // Cannot delete current version
        if (version.isCurrent) {
            throw new BadRequestException(ArticleErrorResponse.cannotDeleteCurrentVersion(lang));
        }

        // Cannot delete published version
        if (version.status === "published" && version.article.publishedVersionId === versionId) {
            throw new BadRequestException(ArticleErrorResponse.cannotDeletePublishedVersion(lang));
        }
    }

    /**
     * Validate version limit enforcement
     */
    async validateVersionLimit(
        articleId: number,
        category: CategoryEntity,
        lang: I18nType = I18nType.CHINESE,
    ): Promise<void> {
        const config = category?.config || {};
        const maxVersions = config.maxVersions || 10;

        const versionCount = await this.versionRepository.count({
            where: { articleId },
        });

        if (versionCount >= maxVersions) {
            throw new BadRequestException(ArticleErrorResponse.versionLimitExceeded(maxVersions, lang));
        }
    }

    /**
     * Validate category configuration
     */
    validateCategoryConfig(config: any, lang: I18nType = I18nType.CHINESE): void {
        if (!config) return;

        // Validate maxCoverImages
        if (config.maxCoverImages !== undefined) {
            if (typeof config.maxCoverImages !== "number" || config.maxCoverImages < 1 || config.maxCoverImages > 10) {
                throw new BadRequestException(
                    ArticleErrorResponse.validationError(
                        ArticleHttpCode.INVALID_CATEGORY_CONFIG,
                        lang === I18nType.ENGLISH
                            ? "maxCoverImages must be between 1 and 10"
                            : "maxCoverImages 必须在1到10之间",
                        lang,
                    ),
                );
            }
        }

        // Validate maxVersions
        if (config.maxVersions !== undefined) {
            if (typeof config.maxVersions !== "number" || config.maxVersions < 1 || config.maxVersions > 50) {
                throw new BadRequestException(
                    ArticleErrorResponse.validationError(
                        ArticleHttpCode.INVALID_CATEGORY_CONFIG,
                        lang === I18nType.ENGLISH
                            ? "maxVersions must be between 1 and 50"
                            : "maxVersions 必须在1到50之间",
                        lang,
                    ),
                );
            }
        }

        // Check for unknown config keys
        const allowedKeys = ["maxCoverImages", "maxVersions"];
        const unknownKeys = Object.keys(config).filter((key) => !allowedKeys.includes(key));
        if (unknownKeys.length > 0) {
            throw new BadRequestException(
                ArticleErrorResponse.validationError(
                    ArticleHttpCode.INVALID_CATEGORY_CONFIG,
                    lang === I18nType.ENGLISH
                        ? `Unknown config keys: ${unknownKeys.join(", ")}`
                        : `未知的配置项: ${unknownKeys.join(", ")}`,
                    lang,
                ),
            );
        }
    }

    /**
     * Validate SEO data
     */
    validateSeoData(
        seoData: {
            seoTitle?: string;
            seoDescription?: string;
            seoKeywords?: string;
        },
        lang: I18nType = I18nType.CHINESE,
    ): void {
        if (seoData.seoTitle && seoData.seoTitle.length > 200) {
            throw new BadRequestException(
                ArticleErrorResponse.validationError(
                    ArticleHttpCode.INVALID_SEO_DATA,
                    lang === I18nType.ENGLISH
                        ? "SEO title cannot exceed 200 characters"
                        : "SEO标题长度不能超过200个字符",
                    lang,
                ),
            );
        }

        if (seoData.seoDescription && seoData.seoDescription.length > 500) {
            throw new BadRequestException(
                ArticleErrorResponse.validationError(
                    ArticleHttpCode.INVALID_SEO_DATA,
                    lang === I18nType.ENGLISH
                        ? "SEO description cannot exceed 500 characters"
                        : "SEO描述长度不能超过500个字符",
                    lang,
                ),
            );
        }

        if (seoData.seoKeywords && seoData.seoKeywords.length > 500) {
            throw new BadRequestException(
                ArticleErrorResponse.validationError(
                    ArticleHttpCode.INVALID_SEO_DATA,
                    lang === I18nType.ENGLISH
                        ? "SEO keywords cannot exceed 500 characters"
                        : "SEO关键词长度不能超过500个字符",
                    lang,
                ),
            );
        }
    }
}

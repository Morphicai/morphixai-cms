import { ResultData } from "../../../shared/utils/result";
import { ArticleHttpCode } from "../enums/article-http-code.enum";
import { getArticleErrorMessage } from "../enums/article-error-messages";
import { I18nType } from "../../../shared/enums/i18n.enum";

/**
 * Article Error Response Utility
 * Provides standardized error responses for the article system
 */
export class ArticleErrorResponse {
    /**
     * Create a standardized error response
     * @param code Error code
     * @param customMessage Optional custom message (overrides default)
     * @param data Optional additional data
     * @param lang Language type (default: Chinese)
     * @returns ResultData with error information
     */
    static error(
        code: ArticleHttpCode,
        customMessage?: string,
        data?: any,
        lang: I18nType = I18nType.CHINESE,
    ): ResultData {
        const message = customMessage || getArticleErrorMessage(code, lang);
        return ResultData.fail(code, message, data);
    }

    /**
     * Create an article not found error response
     */
    static articleNotFound(lang?: I18nType): ResultData {
        return this.error(ArticleHttpCode.ARTICLE_NOT_FOUND, undefined, undefined, lang);
    }

    /**
     * Create a category not found error response
     */
    static categoryNotFound(lang?: I18nType): ResultData {
        return this.error(ArticleHttpCode.CATEGORY_NOT_FOUND, undefined, undefined, lang);
    }

    /**
     * Create a version not found error response
     */
    static versionNotFound(lang?: I18nType): ResultData {
        return this.error(ArticleHttpCode.VERSION_NOT_FOUND, undefined, undefined, lang);
    }

    /**
     * Create a validation error response
     */
    static validationError(code: ArticleHttpCode, details?: string, lang?: I18nType): ResultData {
        const message = details
            ? `${getArticleErrorMessage(code, lang)}: ${details}`
            : getArticleErrorMessage(code, lang);
        return this.error(code, message, undefined, lang);
    }

    /**
     * Create a cover images exceed limit error response
     */
    static coverImagesExceedLimit(maxImages: number, lang?: I18nType): ResultData {
        const baseMessage = getArticleErrorMessage(ArticleHttpCode.COVER_IMAGES_EXCEED_LIMIT, lang);
        const message =
            lang === I18nType.ENGLISH
                ? `${baseMessage}. Maximum allowed: ${maxImages}`
                : `${baseMessage}，最大允许数量: ${maxImages}`;
        return this.error(ArticleHttpCode.COVER_IMAGES_EXCEED_LIMIT, message, undefined, lang);
    }

    /**
     * Create a version limit exceeded error response
     */
    static versionLimitExceeded(maxVersions: number, lang?: I18nType): ResultData {
        const baseMessage = getArticleErrorMessage(ArticleHttpCode.VERSION_LIMIT_EXCEEDED, lang);
        const message =
            lang === I18nType.ENGLISH
                ? `${baseMessage}. Maximum allowed: ${maxVersions}`
                : `${baseMessage}，最大允许数量: ${maxVersions}`;
        return this.error(ArticleHttpCode.VERSION_LIMIT_EXCEEDED, message, undefined, lang);
    }

    /**
     * Create a built-in category cannot delete error response
     */
    static builtInCategoryCannotDelete(categoryName: string, lang?: I18nType): ResultData {
        const baseMessage = getArticleErrorMessage(ArticleHttpCode.BUILT_IN_CATEGORY_CANNOT_DELETE, lang);
        const message =
            lang === I18nType.ENGLISH ? `${baseMessage}: ${categoryName}` : `${baseMessage}: ${categoryName}`;
        return this.error(ArticleHttpCode.BUILT_IN_CATEGORY_CANNOT_DELETE, message, undefined, lang);
    }

    /**
     * Create a category has articles error response
     */
    static categoryHasArticles(articleCount: number, lang?: I18nType): ResultData {
        const baseMessage = getArticleErrorMessage(ArticleHttpCode.CATEGORY_HAS_ARTICLES, lang);
        const message =
            lang === I18nType.ENGLISH
                ? `${baseMessage}. Article count: ${articleCount}`
                : `${baseMessage}，文章数量: ${articleCount}`;
        return this.error(ArticleHttpCode.CATEGORY_HAS_ARTICLES, message, undefined, lang);
    }

    /**
     * Create a scheduled time in past error response
     */
    static scheduledTimeInPast(lang?: I18nType): ResultData {
        return this.error(ArticleHttpCode.SCHEDULED_TIME_IN_PAST, undefined, undefined, lang);
    }

    /**
     * Create a cannot delete published version error response
     */
    static cannotDeletePublishedVersion(lang?: I18nType): ResultData {
        return this.error(ArticleHttpCode.CANNOT_DELETE_PUBLISHED_VERSION, undefined, undefined, lang);
    }

    /**
     * Create a cannot delete current version error response
     */
    static cannotDeleteCurrentVersion(lang?: I18nType): ResultData {
        return this.error(ArticleHttpCode.CANNOT_DELETE_CURRENT_VERSION, undefined, undefined, lang);
    }
}

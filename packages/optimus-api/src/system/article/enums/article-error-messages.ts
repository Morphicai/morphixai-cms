import { ArticleHttpCode } from "./article-http-code.enum";
import { I18nType } from "../../../shared/enums/i18n.enum";

/**
 * Error message mapping for Article System
 * Supports internationalization (Chinese and English)
 */
export const ArticleErrorMessages: Record<ArticleHttpCode, Record<I18nType, string>> = {
    // Article related errors
    [ArticleHttpCode.ARTICLE_NOT_FOUND]: {
        [I18nType.CHINESE]: "文章不存在",
        [I18nType.ENGLISH]: "Article not found",
    },
    [ArticleHttpCode.ARTICLE_ALREADY_EXISTS]: {
        [I18nType.CHINESE]: "文章已存在",
        [I18nType.ENGLISH]: "Article already exists",
    },
    [ArticleHttpCode.ARTICLE_CREATE_FAILED]: {
        [I18nType.CHINESE]: "文章创建失败",
        [I18nType.ENGLISH]: "Failed to create article",
    },
    [ArticleHttpCode.ARTICLE_UPDATE_FAILED]: {
        [I18nType.CHINESE]: "文章更新失败",
        [I18nType.ENGLISH]: "Failed to update article",
    },
    [ArticleHttpCode.ARTICLE_DELETE_FAILED]: {
        [I18nType.CHINESE]: "文章删除失败",
        [I18nType.ENGLISH]: "Failed to delete article",
    },
    [ArticleHttpCode.ARTICLE_SLUG_ALREADY_EXISTS]: {
        [I18nType.CHINESE]: "文章标识符已存在",
        [I18nType.ENGLISH]: "Article slug already exists",
    },
    [ArticleHttpCode.ARTICLE_INVALID_STATUS]: {
        [I18nType.CHINESE]: "无效的文章状态",
        [I18nType.ENGLISH]: "Invalid article status",
    },
    [ArticleHttpCode.ARTICLE_CANNOT_PUBLISH]: {
        [I18nType.CHINESE]: "文章无法发布",
        [I18nType.ENGLISH]: "Article cannot be published",
    },
    [ArticleHttpCode.ARTICLE_CANNOT_ARCHIVE]: {
        [I18nType.CHINESE]: "文章无法归档",
        [I18nType.ENGLISH]: "Article cannot be archived",
    },
    [ArticleHttpCode.ARTICLE_ALREADY_PUBLISHED]: {
        [I18nType.CHINESE]: "文章已发布",
        [I18nType.ENGLISH]: "Article is already published",
    },
    [ArticleHttpCode.ARTICLE_ALREADY_ARCHIVED]: {
        [I18nType.CHINESE]: "文章已归档",
        [I18nType.ENGLISH]: "Article is already archived",
    },

    // Category related errors
    [ArticleHttpCode.CATEGORY_NOT_FOUND]: {
        [I18nType.CHINESE]: "分类不存在",
        [I18nType.ENGLISH]: "Category not found",
    },
    [ArticleHttpCode.CATEGORY_ALREADY_EXISTS]: {
        [I18nType.CHINESE]: "分类已存在",
        [I18nType.ENGLISH]: "Category already exists",
    },
    [ArticleHttpCode.CATEGORY_CREATE_FAILED]: {
        [I18nType.CHINESE]: "分类创建失败",
        [I18nType.ENGLISH]: "Failed to create category",
    },
    [ArticleHttpCode.CATEGORY_UPDATE_FAILED]: {
        [I18nType.CHINESE]: "分类更新失败",
        [I18nType.ENGLISH]: "Failed to update category",
    },
    [ArticleHttpCode.CATEGORY_DELETE_FAILED]: {
        [I18nType.CHINESE]: "分类删除失败",
        [I18nType.ENGLISH]: "Failed to delete category",
    },
    [ArticleHttpCode.CATEGORY_HAS_ARTICLES]: {
        [I18nType.CHINESE]: "分类下存在文章，无法删除",
        [I18nType.ENGLISH]: "Category has articles and cannot be deleted",
    },
    [ArticleHttpCode.BUILT_IN_CATEGORY_CANNOT_DELETE]: {
        [I18nType.CHINESE]: "内置分类不能删除",
        [I18nType.ENGLISH]: "Built-in category cannot be deleted",
    },
    [ArticleHttpCode.BUILT_IN_CATEGORY_CANNOT_UPDATE]: {
        [I18nType.CHINESE]: "内置分类不能修改",
        [I18nType.ENGLISH]: "Built-in category cannot be updated",
    },
    [ArticleHttpCode.CATEGORY_PARENT_NOT_FOUND]: {
        [I18nType.CHINESE]: "父分类不存在",
        [I18nType.ENGLISH]: "Parent category not found",
    },
    [ArticleHttpCode.CATEGORY_CIRCULAR_REFERENCE]: {
        [I18nType.CHINESE]: "分类存在循环引用",
        [I18nType.ENGLISH]: "Category has circular reference",
    },
    [ArticleHttpCode.CATEGORY_CODE_ALREADY_EXISTS]: {
        [I18nType.CHINESE]: "分类代码已存在",
        [I18nType.ENGLISH]: "Category code already exists",
    },

    // Validation errors
    [ArticleHttpCode.COVER_IMAGES_EXCEED_LIMIT]: {
        [I18nType.CHINESE]: "封面图片数量超出限制",
        [I18nType.ENGLISH]: "Cover images exceed limit",
    },
    [ArticleHttpCode.INVALID_CATEGORY_CONFIG]: {
        [I18nType.CHINESE]: "无效的分类配置",
        [I18nType.ENGLISH]: "Invalid category configuration",
    },
    [ArticleHttpCode.INVALID_ARTICLE_TITLE]: {
        [I18nType.CHINESE]: "无效的文章标题",
        [I18nType.ENGLISH]: "Invalid article title",
    },
    [ArticleHttpCode.INVALID_ARTICLE_CONTENT]: {
        [I18nType.CHINESE]: "无效的文章内容",
        [I18nType.ENGLISH]: "Invalid article content",
    },
    [ArticleHttpCode.INVALID_ARTICLE_SUMMARY]: {
        [I18nType.CHINESE]: "无效的文章摘要",
        [I18nType.ENGLISH]: "Invalid article summary",
    },
    [ArticleHttpCode.INVALID_SLUG_FORMAT]: {
        [I18nType.CHINESE]: "无效的标识符格式",
        [I18nType.ENGLISH]: "Invalid slug format",
    },
    [ArticleHttpCode.INVALID_SORT_WEIGHT]: {
        [I18nType.CHINESE]: "无效的排序权重",
        [I18nType.ENGLISH]: "Invalid sort weight",
    },
    [ArticleHttpCode.INVALID_SEO_DATA]: {
        [I18nType.CHINESE]: "无效的SEO数据",
        [I18nType.ENGLISH]: "Invalid SEO data",
    },
    [ArticleHttpCode.COVER_IMAGES_REQUIRED]: {
        [I18nType.CHINESE]: "封面图片不能为空",
        [I18nType.ENGLISH]: "Cover images are required",
    },
    [ArticleHttpCode.INVALID_COVER_IMAGE_URL]: {
        [I18nType.CHINESE]: "无效的封面图片URL",
        [I18nType.ENGLISH]: "Invalid cover image URL",
    },
    [ArticleHttpCode.INVALID_COVER_IMAGE_RESOLUTION]: {
        [I18nType.CHINESE]: "封面图片分辨率不符合要求",
        [I18nType.ENGLISH]: "Cover image resolution does not meet requirements",
    },

    // Version related errors
    [ArticleHttpCode.VERSION_NOT_FOUND]: {
        [I18nType.CHINESE]: "版本不存在",
        [I18nType.ENGLISH]: "Version not found",
    },
    [ArticleHttpCode.VERSION_CREATE_FAILED]: {
        [I18nType.CHINESE]: "版本创建失败",
        [I18nType.ENGLISH]: "Failed to create version",
    },
    [ArticleHttpCode.VERSION_DELETE_FAILED]: {
        [I18nType.CHINESE]: "版本删除失败",
        [I18nType.ENGLISH]: "Failed to delete version",
    },
    [ArticleHttpCode.VERSION_LIMIT_EXCEEDED]: {
        [I18nType.CHINESE]: "版本数量超出限制",
        [I18nType.ENGLISH]: "Version limit exceeded",
    },
    [ArticleHttpCode.CANNOT_DELETE_PUBLISHED_VERSION]: {
        [I18nType.CHINESE]: "不能删除已发布的版本",
        [I18nType.ENGLISH]: "Cannot delete published version",
    },
    [ArticleHttpCode.CANNOT_DELETE_CURRENT_VERSION]: {
        [I18nType.CHINESE]: "不能删除当前版本",
        [I18nType.ENGLISH]: "Cannot delete current version",
    },
    [ArticleHttpCode.VERSION_ALREADY_CURRENT]: {
        [I18nType.CHINESE]: "该版本已是当前版本",
        [I18nType.ENGLISH]: "Version is already current",
    },
    [ArticleHttpCode.VERSION_REVERT_FAILED]: {
        [I18nType.CHINESE]: "版本回退失败",
        [I18nType.ENGLISH]: "Failed to revert version",
    },
    [ArticleHttpCode.VERSION_COMPARE_FAILED]: {
        [I18nType.CHINESE]: "版本比较失败",
        [I18nType.ENGLISH]: "Failed to compare versions",
    },
    [ArticleHttpCode.INVALID_VERSION_NUMBER]: {
        [I18nType.CHINESE]: "无效的版本号",
        [I18nType.ENGLISH]: "Invalid version number",
    },
    [ArticleHttpCode.VERSION_ARTICLE_MISMATCH]: {
        [I18nType.CHINESE]: "版本与文章不匹配",
        [I18nType.ENGLISH]: "Version does not match article",
    },

    // Scheduled publishing errors
    [ArticleHttpCode.INVALID_SCHEDULED_TIME]: {
        [I18nType.CHINESE]: "无效的预定发布时间",
        [I18nType.ENGLISH]: "Invalid scheduled time",
    },
    [ArticleHttpCode.SCHEDULED_TIME_IN_PAST]: {
        [I18nType.CHINESE]: "预定发布时间不能早于当前时间",
        [I18nType.ENGLISH]: "Scheduled time cannot be in the past",
    },
    [ArticleHttpCode.SCHEDULED_PUBLISH_FAILED]: {
        [I18nType.CHINESE]: "预定发布失败",
        [I18nType.ENGLISH]: "Scheduled publish failed",
    },
    [ArticleHttpCode.SCHEDULED_PUBLISH_CANCELLED]: {
        [I18nType.CHINESE]: "预定发布已取消",
        [I18nType.ENGLISH]: "Scheduled publish cancelled",
    },
    [ArticleHttpCode.ARTICLE_NOT_SCHEDULED]: {
        [I18nType.CHINESE]: "文章未设置预定发布",
        [I18nType.ENGLISH]: "Article is not scheduled",
    },
};

/**
 * Get error message by code and language
 * @param code Error code
 * @param lang Language type (default: Chinese)
 * @returns Error message
 */
export function getArticleErrorMessage(code: ArticleHttpCode, lang: I18nType = I18nType.CHINESE): string {
    return ArticleErrorMessages[code]?.[lang] || "Unknown error";
}

/**
 * Slug Generator Utility
 * Generates URL-friendly slugs from article titles
 */

/**
 * Generate a URL-friendly slug from a title
 * @param title - The article title
 * @returns A URL-friendly slug
 */
export function generateSlug(title: string): string {
    if (!title) {
        throw new Error("Title cannot be empty");
    }

    return (
        title
            .toLowerCase()
            // Replace Chinese characters and spaces with hyphens
            .replace(/[\s\u4e00-\u9fa5]+/g, "-")
            // Remove special characters except hyphens
            .replace(/[^\w\-]+/g, "")
            // Replace multiple hyphens with single hyphen
            .replace(/\-\-+/g, "-")
            // Remove leading and trailing hyphens
            .replace(/^-+/, "")
            .replace(/-+$/, "")
            // Limit length to 200 characters
            .substring(0, 200)
    );
}

/**
 * Validate slug format
 * @param slug - The slug to validate
 * @returns True if valid, false otherwise
 */
export function validateSlugFormat(slug: string): boolean {
    if (!slug || slug.length === 0) {
        return false;
    }

    if (slug.length > 200) {
        return false;
    }

    // Slug should only contain lowercase letters, numbers, and hyphens
    // Should not start or end with hyphen
    const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    return slugPattern.test(slug);
}

/**
 * Generate a unique slug by appending a number if necessary
 * @param baseSlug - The base slug
 * @param existingSlugs - Array of existing slugs to check against
 * @returns A unique slug
 */
export function generateUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
    let slug = baseSlug;
    let counter = 1;

    while (existingSlugs.includes(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    return slug;
}

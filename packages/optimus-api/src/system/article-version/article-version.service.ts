import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Connection } from "typeorm";
import { ArticleVersionEntity } from "./entities/article-version.entity";
import { CreateVersionDto } from "./dto/create-version.dto";
import { UpdateVersionDto } from "./dto/update-version.dto";
import { ArticleEntity } from "../article/entities/article.entity";
import { CategoryEntity } from "../category/entities/category.entity";
import { VersionDiffService, VersionComparison } from "./services/version-diff.service";

@Injectable()
export class ArticleVersionService {
    constructor(
        @InjectRepository(ArticleVersionEntity)
        private readonly versionRepository: Repository<ArticleVersionEntity>,
        @InjectRepository(ArticleEntity)
        private readonly articleRepository: Repository<ArticleEntity>,
        @InjectRepository(CategoryEntity)
        private readonly categoryRepository: Repository<CategoryEntity>,
        private readonly connection: Connection,
        private readonly versionDiffService: VersionDiffService,
    ) {}

    async create(articleId: number, createVersionDto: CreateVersionDto, userId: string): Promise<ArticleVersionEntity> {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Verify article exists
            const article = await queryRunner.manager.findOne(ArticleEntity, {
                where: { id: articleId },
                relations: ["category"],
            });

            if (!article) {
                throw new NotFoundException("Article not found");
            }

            // Validate cover images against category config
            await this.validateCoverImages(createVersionDto.coverImages, article.category);

            // Generate next version number
            const nextVersionNumber = await this.getNextVersionNumber(articleId, queryRunner.manager);

            // Check version limit and cleanup if necessary
            await this.enforceVersionLimit(articleId, article.category, queryRunner.manager);

            // Create new version
            const version = queryRunner.manager.create(ArticleVersionEntity, {
                ...createVersionDto,
                articleId,
                userId,
                versionNumber: nextVersionNumber,
                status: createVersionDto.status || "draft",
                isCurrent: false, // Will be set by updateCurrentVersion if needed
            });

            const savedVersion = await queryRunner.manager.save(version);

            // Update current version if this is a published version or if no current version exists
            if (createVersionDto.status === "published" || !article.currentVersionId) {
                await this.updateCurrentVersion(articleId, savedVersion.id, queryRunner.manager);
            }

            await queryRunner.commitTransaction();
            return savedVersion;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async findByArticle(articleId: number): Promise<ArticleVersionEntity[]> {
        // Verify article exists
        const article = await this.articleRepository.findOne({ where: { id: articleId } });
        if (!article) {
            throw new NotFoundException("Article not found");
        }

        return await this.versionRepository.find({
            where: { articleId },
            order: { versionNumber: "DESC" },
        });
    }

    async findOne(articleId: number, versionId: number): Promise<ArticleVersionEntity> {
        const version = await this.versionRepository.findOne({
            where: { id: versionId, articleId },
            relations: ["article"],
        });

        if (!version) {
            throw new NotFoundException("Version not found");
        }

        return version;
    }

    async update(versionId: number, updateVersionDto: UpdateVersionDto): Promise<ArticleVersionEntity> {
        const version = await this.versionRepository.findOne({
            where: { id: versionId },
            relations: ["article", "article.category"],
        });

        if (!version) {
            throw new NotFoundException("Version not found");
        }

        // 限制：已发布的版本不能修改内容
        if (version.status === "published") {
            throw new BadRequestException("已发布的版本不能修改内容，请创建新版本");
        }

        // 只有草稿版本可以修改
        if (version.status !== "draft") {
            throw new BadRequestException("只有草稿版本可以修改内容");
        }

        // Validate cover images if being updated
        if (updateVersionDto.coverImages) {
            await this.validateCoverImages(updateVersionDto.coverImages, version.article.category);
        }

        await this.versionRepository.update(versionId, updateVersionDto);
        return await this.versionRepository.findOne({ where: { id: versionId } });
    }

    async remove(versionId: number): Promise<void> {
        const version = await this.versionRepository.findOne({
            where: { id: versionId },
            relations: ["article"],
        });

        if (!version) {
            throw new NotFoundException("Version not found");
        }

        // Safety checks
        if (version.isCurrent) {
            throw new BadRequestException("Cannot delete current version");
        }

        if (version.status === "published" && version.article.publishedVersionId === versionId) {
            throw new BadRequestException("Cannot delete published version");
        }

        await this.versionRepository.delete(versionId);
    }

    async revertToVersion(articleId: number, versionId: number, userId: string): Promise<ArticleVersionEntity> {
        const oldVersion = await this.findOne(articleId, versionId);

        // Create new version based on old version
        const createVersionDto: CreateVersionDto = {
            title: oldVersion.title,
            summary: oldVersion.summary,
            content: oldVersion.content,
            coverImages: oldVersion.coverImages,
            sortWeight: oldVersion.sortWeight,
            seoTitle: oldVersion.seoTitle,
            seoDescription: oldVersion.seoDescription,
            seoKeywords: oldVersion.seoKeywords,
            status: "draft", // Always create as draft when reverting
        };

        return await this.create(articleId, createVersionDto, userId);
    }

    // Helper methods for core business logic

    private async getNextVersionNumber(articleId: number, manager: any): Promise<number> {
        const latestVersion = await manager.findOne(ArticleVersionEntity, {
            where: { articleId },
            order: { versionNumber: "DESC" },
        });

        return latestVersion ? latestVersion.versionNumber + 1 : 1;
    }

    private async validateCoverImages(coverImages: string[], category: CategoryEntity): Promise<void> {
        if (!coverImages || coverImages.length === 0) {
            return;
        }

        const config = category?.config || {};
        const maxCoverImages = config.maxCoverImages || 5; // Default limit

        if (coverImages.length > maxCoverImages) {
            throw new BadRequestException(
                `Cover images exceed limit of ${maxCoverImages} for category ${category.name}`,
            );
        }
    }

    private async enforceVersionLimit(articleId: number, category: CategoryEntity, manager: any): Promise<void> {
        const config = category?.config || {};
        const maxVersions = config.maxVersions || 10; // Default limit

        const versionCount = await manager.count(ArticleVersionEntity, {
            where: { articleId },
        });

        if (versionCount >= maxVersions) {
            // Find oldest versions to delete (excluding published and current versions)
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
                const idsToDelete = versionsToDelete.map((v) => v.id);
                await manager.delete(ArticleVersionEntity, idsToDelete);
            }
        }
    }

    private async updateCurrentVersion(articleId: number, versionId: number, manager: any): Promise<void> {
        // Reset current flag for all versions of this article
        await manager.update(ArticleVersionEntity, { articleId }, { isCurrent: false });

        // Set new current version
        await manager.update(ArticleVersionEntity, { id: versionId }, { isCurrent: true });

        // Update article's current version reference
        await manager.update(ArticleEntity, { id: articleId }, { currentVersionId: versionId });
    }

    async setCurrentVersion(articleId: number, versionId: number): Promise<void> {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const version = await queryRunner.manager.findOne(ArticleVersionEntity, {
                where: { id: versionId, articleId },
            });

            if (!version) {
                throw new NotFoundException("Version not found");
            }

            await this.updateCurrentVersion(articleId, versionId, queryRunner.manager);
            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async compareVersions(articleId: number, versionId1: number, versionId2: number): Promise<VersionComparison> {
        const [version1, version2] = await Promise.all([
            this.findOne(articleId, versionId1),
            this.findOne(articleId, versionId2),
        ]);

        return this.versionDiffService.compareVersions(version1, version2);
    }

    async canDeleteVersion(versionId: number): Promise<{ canDelete: boolean; reason?: string }> {
        const version = await this.versionRepository.findOne({
            where: { id: versionId },
            relations: ["article"],
        });

        if (!version) {
            return { canDelete: false, reason: "Version not found" };
        }

        if (version.isCurrent) {
            return { canDelete: false, reason: "Cannot delete current version" };
        }

        if (version.status === "published" && version.article.publishedVersionId === versionId) {
            return { canDelete: false, reason: "Cannot delete published version" };
        }

        return { canDelete: true };
    }

    async getVersionStats(articleId: number): Promise<any> {
        const versions = await this.findByArticle(articleId);

        const stats = {
            totalVersions: versions.length,
            draftVersions: versions.filter((v) => v.status === "draft").length,
            publishedVersions: versions.filter((v) => v.status === "published").length,
            archivedVersions: versions.filter((v) => v.status === "archived").length,
            currentVersion: versions.find((v) => v.isCurrent),
            latestVersion: versions[0], // Already sorted by version number DESC
            oldestVersion: versions[versions.length - 1],
        };

        return stats;
    }

    async bulkDeleteDraftVersions(articleId: number): Promise<{ deletedCount: number }> {
        const draftVersions = await this.versionRepository.find({
            where: {
                articleId,
                status: "draft",
                isCurrent: false,
            },
        });

        if (draftVersions.length === 0) {
            return { deletedCount: 0 };
        }

        const idsToDelete = draftVersions.map((v) => v.id);
        await this.versionRepository.delete(idsToDelete);

        return { deletedCount: draftVersions.length };
    }
}

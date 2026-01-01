import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Connection } from "typeorm";
import { ArticleEntity } from "../entities/article.entity";
import { ArticleVersionEntity } from "../../article-version/entities/article-version.entity";
import { ArticleOperationLogService } from "./article-operation-log.service";

@Injectable()
export class ArticleSchedulerService {
    private readonly logger = new Logger(ArticleSchedulerService.name);

    constructor(
        @InjectRepository(ArticleEntity)
        private readonly articleRepository: Repository<ArticleEntity>,
        @InjectRepository(ArticleVersionEntity)
        private readonly versionRepository: Repository<ArticleVersionEntity>,
        private readonly connection: Connection,
        private readonly operationLogService: ArticleOperationLogService,
    ) {}

    /**
     * Check for scheduled articles every minute and publish them if the time has come
     * Runs at the start of every minute
     */
    @Cron(CronExpression.EVERY_MINUTE)
    async checkScheduledArticles(): Promise<void> {
        try {
            const now = new Date();

            // Find all articles that are scheduled to be published
            const scheduledArticles = await this.articleRepository
                .createQueryBuilder("article")
                .leftJoinAndSelect("article.currentVersion", "currentVersion")
                .where("article.status = :status", { status: "draft" })
                .andWhere("article.scheduledAt IS NOT NULL")
                .andWhere("article.scheduledAt <= :now", { now })
                .getMany();

            if (scheduledArticles.length === 0) {
                return;
            }

            this.logger.log(`Found ${scheduledArticles.length} article(s) scheduled for publishing`);

            // Process each scheduled article
            for (const article of scheduledArticles) {
                try {
                    await this.publishScheduledArticle(article);
                    this.logger.log(`Successfully published scheduled article: ${article.slug} (ID: ${article.id})`);
                } catch (error) {
                    this.logger.error(
                        `Failed to publish scheduled article ${article.id}: ${error.message}`,
                        error.stack,
                    );
                    // Continue with other articles even if one fails
                }
            }
        } catch (error) {
            this.logger.error(`Error in scheduled article check: ${error.message}`, error.stack);
        }
    }

    /**
     * Publish a scheduled article
     */
    private async publishScheduledArticle(article: ArticleEntity): Promise<void> {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const beforeData = {
                status: article.status,
                scheduledAt: article.scheduledAt,
                publishedAt: article.publishedAt,
            };

            // Update article status and published time
            const publishedAt = new Date();
            await queryRunner.manager.update(ArticleEntity, article.id, {
                status: "published",
                publishedAt,
                publishedVersionId: article.currentVersionId,
                scheduledAt: null, // Clear scheduled time after publishing
            });

            // Update current version status to published
            await queryRunner.manager.update(
                ArticleVersionEntity,
                { id: article.currentVersionId },
                { status: "published" },
            );

            const afterData = {
                status: "published",
                scheduledAt: null,
                publishedAt,
            };

            // Log the automatic publishing operation
            await this.operationLogService.createLog({
                articleId: article.id,
                operationType: "auto_publish",
                description: `自动发布预定文章，原定时间: ${article.scheduledAt?.toISOString()}`,
                beforeData,
                afterData,
                userId: article.userId, // Use article creator as the user
                status: "success",
            });

            await queryRunner.commitTransaction();

            this.logger.log(`Published scheduled article: ${article.slug} (ID: ${article.id})`);
        } catch (error) {
            await queryRunner.rollbackTransaction();

            // Log the failed automatic publishing operation
            await this.operationLogService.createLog({
                articleId: article.id,
                operationType: "auto_publish",
                description: `自动发布预定文章失败，原定时间: ${article.scheduledAt?.toISOString()}`,
                userId: article.userId,
                status: "failed",
                errorMessage: error.message,
            });

            this.logger.error(`Failed to publish scheduled article ${article.id}: ${error.message}`, error.stack);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}

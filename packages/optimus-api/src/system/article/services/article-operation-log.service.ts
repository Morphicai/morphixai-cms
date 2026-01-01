import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ArticleOperationLogEntity } from "../entities/article-operation-log.entity";

export interface CreateOperationLogDto {
    articleId: number;
    operationType: string;
    description?: string;
    beforeData?: Record<string, any>;
    afterData?: Record<string, any>;
    userId: string;
    status?: string;
    errorMessage?: string;
}

@Injectable()
export class ArticleOperationLogService {
    private readonly logger = new Logger(ArticleOperationLogService.name);

    constructor(
        @InjectRepository(ArticleOperationLogEntity)
        private readonly operationLogRepository: Repository<ArticleOperationLogEntity>,
    ) {}

    /**
     * Create an operation log entry
     */
    async createLog(data: CreateOperationLogDto): Promise<ArticleOperationLogEntity> {
        try {
            const log = this.operationLogRepository.create({
                articleId: data.articleId,
                operationType: data.operationType,
                description: data.description,
                beforeData: data.beforeData,
                afterData: data.afterData,
                userId: data.userId,
                status: data.status || "success",
                errorMessage: data.errorMessage,
            });

            return await this.operationLogRepository.save(log);
        } catch (error) {
            this.logger.error(`Failed to create operation log: ${error.message}`, error.stack);
            // Don't throw error to avoid breaking the main operation
            return null;
        }
    }

    /**
     * Get operation logs for an article
     */
    async getArticleLogs(articleId: number, limit = 50): Promise<ArticleOperationLogEntity[]> {
        try {
            return await this.operationLogRepository.find({
                where: { articleId },
                order: { createDate: "DESC" },
                take: limit,
            });
        } catch (error) {
            this.logger.error(`Failed to get operation logs for article ${articleId}: ${error.message}`, error.stack);
            return [];
        }
    }

    /**
     * Get operation logs by type
     */
    async getLogsByType(articleId: number, operationType: string, limit = 50): Promise<ArticleOperationLogEntity[]> {
        try {
            return await this.operationLogRepository.find({
                where: { articleId, operationType },
                order: { createDate: "DESC" },
                take: limit,
            });
        } catch (error) {
            this.logger.error(
                `Failed to get operation logs for article ${articleId} with type ${operationType}: ${error.message}`,
                error.stack,
            );
            return [];
        }
    }
}

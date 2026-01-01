import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleModule } from "@nestjs/schedule";
import { ArticleService } from "./article.service";
import { ArticleController } from "./article.controller";
import { PublicArticleController } from "./public-article.controller";
import { ArticleEntity } from "./entities/article.entity";
import { ArticleVersionEntity } from "../article-version/entities/article-version.entity";
import { CategoryEntity } from "../category/entities/category.entity";
import { ArticleOperationLogEntity } from "./entities/article-operation-log.entity";
import { UserModule } from "../user/user.module";
import { ArticleSchedulerService } from "./services/article-scheduler.service";
import { ArticleOperationLogService } from "./services/article-operation-log.service";
import { ArticleValidationService } from "./services/article-validation.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([ArticleEntity, ArticleVersionEntity, CategoryEntity, ArticleOperationLogEntity]),
        ScheduleModule.forRoot(),
        UserModule, // Import UserModule to resolve JwtAuthGuard dependencies
    ],
    controllers: [ArticleController, PublicArticleController],
    providers: [ArticleService, ArticleSchedulerService, ArticleOperationLogService, ArticleValidationService],
    exports: [ArticleService, ArticleOperationLogService, ArticleValidationService],
})
export class ArticleModule {}

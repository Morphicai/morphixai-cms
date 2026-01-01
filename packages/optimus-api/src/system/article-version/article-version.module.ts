import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ArticleVersionService } from "./article-version.service";
import { ArticleVersionController } from "./article-version.controller";
import { ArticleVersionEntity } from "./entities/article-version.entity";
import { ArticleEntity } from "../article/entities/article.entity";
import { CategoryEntity } from "../category/entities/category.entity";
import { VersionDiffService } from "./services/version-diff.service";
import { UserModule } from "../user/user.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([ArticleVersionEntity, ArticleEntity, CategoryEntity]),
        UserModule, // Import UserModule to resolve JwtAuthGuard dependencies
    ],
    controllers: [ArticleVersionController],
    providers: [ArticleVersionService, VersionDiffService],
    exports: [ArticleVersionService],
})
export class ArticleVersionModule {}

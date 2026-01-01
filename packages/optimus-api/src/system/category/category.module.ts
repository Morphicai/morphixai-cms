import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CategoryService } from "./category.service";
import { CategoryController } from "./category.controller";
import { CategoryEntity } from "./entities/category.entity";
import { UserModule } from "../user/user.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([CategoryEntity]),
        UserModule, // Import UserModule to resolve JwtAuthGuard dependencies
    ],
    controllers: [CategoryController],
    providers: [CategoryService],
    exports: [CategoryService],
})
export class CategoryModule {}

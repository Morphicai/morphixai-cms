import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SetupController } from "./setup.controller";
import { SetupService } from "./setup.service";
import { DatabaseInitializerModule } from "../../shared/database/database-initializer.module";
import { InitializationModule } from "../../shared/guards/initialization.module";
import { UserEntity } from "../user/user.entity";
import { RoleEntity } from "../role/entities/role.entity";
import { UserRoleEntity } from "../user/user-role.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([UserEntity, RoleEntity, UserRoleEntity]),
        DatabaseInitializerModule,
        InitializationModule, // 导入初始化守卫模块以使用 InitializationGuard
    ],
    controllers: [SetupController],
    providers: [SetupService],
    exports: [SetupService],
})
export class SetupModule {}

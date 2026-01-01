import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "../auth/auth.module";
import { RoleModule } from "../role/role.module";

import { BaseController } from "./base.controller";
import { UserEntity } from "./user.entity";
import { UserService } from "./user.service";
import { BaseService } from "./base.service";
import { UserController } from "./user.controller";
import { UserRoleEntity } from "./user-role.entity";
import { RoleEntity } from "../role/entities/role.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([UserEntity, UserRoleEntity, RoleEntity]),
        forwardRef(() => AuthModule),
        forwardRef(() => RoleModule),
    ],
    providers: [BaseService, UserService],
    controllers: [BaseController, UserController],
    exports: [BaseService, UserService],
})
export class UserModule {}

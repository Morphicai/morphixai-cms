import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UserRoleEntity } from "../user/user-role.entity";

import { RoleController } from "./role.controller";
import { RoleService } from "./role.service";
import { RoleEntity } from "./entities/role.entity";
import { RoleMenuEntity } from "./entities/role-menu.entity";
import { RoleLeaderEntity } from "./entities/role-leader.entity";

@Module({
    imports: [TypeOrmModule.forFeature([RoleEntity, RoleMenuEntity, UserRoleEntity, RoleLeaderEntity])],
    providers: [RoleService],
    controllers: [RoleController],
    exports: [RoleService],
})
export class RoleModule {}

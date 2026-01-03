import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, getManager, Transaction, EntityManager, TransactionManager, getConnection } from "typeorm";
import { plainToClass } from "class-transformer";

import { AppHttpCode } from "../../shared/enums/code.enum";
import { UserType } from "../../shared/enums/user.enum";
import { ResultData } from "../../shared/utils/result";

import { UserRoleEntity } from "../user/user-role.entity";
import { UserEntity } from "../user/user.entity";
import { RoleLeaderEntity } from "./entities/role-leader.entity";
import { RoleEntity } from "./entities/role.entity";
import { RoleMenuEntity } from "./entities/role-menu.entity";

import { CreateRoleDto } from "./dto/create-role.dto";
import { CreateRoleLeadersDto } from "./dto/create-role-leaders.dto";
import { RemoveRoleLeadersDto } from "./dto/remove-role-leaders.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { FindRoleListDto } from "./dto/find-role-list.dto";

@Injectable()
export class RoleService {
    constructor(
        @InjectRepository(RoleEntity)
        private readonly roleRepo: Repository<RoleEntity>,
        @InjectRepository(RoleLeaderEntity)
        private readonly roleLeaderRepo: Repository<RoleLeaderEntity>,
        @InjectRepository(RoleMenuEntity)
        private readonly roleMenuRepo: Repository<RoleMenuEntity>,
        @InjectRepository(UserRoleEntity)
        private readonly userRoleRepo: Repository<UserRoleEntity>,
    ) {}

    async create(dto: CreateRoleDto, user: UserEntity): Promise<ResultData> {
        const role = plainToClass(RoleEntity, dto);
        const res = await getManager().transaction(async (transactionalEntityManager) => {
            const result = await transactionalEntityManager.save<RoleEntity>(plainToClass(RoleEntity, role));
            if (result) {
                const roleMenus = plainToClass(
                    RoleMenuEntity,
                    dto.menuCodes.map((permissionCode) => {
                        return { permissionCode, roleId: result.id };
                    }),
                );
                await transactionalEntityManager.save<RoleMenuEntity>(roleMenus);
                if (user.type === UserType.ORDINARY_USER) {
                    // 如果是 一般用户，则需要将 他创建的角色绑定他自身， 超管用户因为可以查看所有角色，则不需要绑定
                    const userRole = { userId: user.id, roleId: result.id };
                    await transactionalEntityManager.save<UserRoleEntity>(plainToClass(UserRoleEntity, userRole));
                }
            }
            return result;
        });
        if (!res) {
            return ResultData.fail(AppHttpCode.SERVICE_ERROR, "角色创建失败，请稍后重试");
        }
        return ResultData.ok(res);
    }

    async update(dto: UpdateRoleDto): Promise<ResultData> {
        const currentRole = await this.roleRepo.findOne({ id: dto.id });
        if (!currentRole) {
            return ResultData.fail(AppHttpCode.ROLE_NOT_FOUND, "当前角色不存在或已被删除");
        }
        const { affected } = await getManager().transaction(async (transactionalEntityManager) => {
            if (dto.menuCodes) {
                await transactionalEntityManager.delete(RoleMenuEntity, {
                    roleId: dto.id,
                });
                await transactionalEntityManager.save(
                    RoleMenuEntity,
                    plainToClass(
                        RoleMenuEntity,
                        dto.menuCodes?.map((permissionCode) => {
                            return { permissionCode, roleId: dto.id };
                        }),
                    ),
                );
            }

            const newRole = Object.assign({}, currentRole);
            if (dto.name) {
                newRole.name = dto.name;
            }
            if (dto.remark) {
                newRole.remark = dto.remark;
            }

            const result = await transactionalEntityManager.update<RoleEntity>(
                RoleEntity,
                dto.id,
                plainToClass(RoleEntity, newRole),
            );

            return result;
        });
        if (!affected) return ResultData.fail(AppHttpCode.SERVICE_ERROR, "当前角色更新失败，请稍后尝试");
        return ResultData.ok();
    }

    async delete(id: string): Promise<ResultData> {
        const existing = await this.roleRepo.findOne({ id });
        if (!existing) {
            return ResultData.fail(AppHttpCode.ROLE_NOT_FOUND, "当前角色不存在或已被删除");
        }
        const existingBindUser = await this.userRoleRepo.findOne({
            where: { roleId: id },
        });
        if (existingBindUser) {
            return ResultData.fail(AppHttpCode.ROLE_NOT_DEL, "当前角色还有绑定的用户，需要解除关联后删除");
        }
        const { affected } = await getManager().transaction(async (transactionalEntityManager) => {
            // 删除 role - menu 关系
            await transactionalEntityManager.delete(RoleMenuEntity, {
                roleId: id,
            });
            // 删除 user - role 关系
            // await transactionalEntityManager.delete(UserRoleEntity, { roleId: id })
            const result = await transactionalEntityManager.delete<RoleEntity>(RoleEntity, id);
            return result;
        });
        if (!affected) {
            return ResultData.fail(AppHttpCode.SERVICE_ERROR, "删除失败，请稍后重试");
        }

        return ResultData.ok({});
    }

    public async findRoleIdsByUserId(id: number): Promise<number[]> {
        const roles = await this.userRoleRepo.find({ userId: id });
        return roles.map((role: UserRoleEntity) => Number(role.roleId));
    }

    async findOnePerm(id: string): Promise<ResultData> {
        const roleMenu = await this.roleMenuRepo.find({
            select: ["permissionCode"],
            where: { roleId: id },
        });
        return ResultData.ok(roleMenu.map((v) => v.permissionCode));
    }

    async findList(type: UserType, userId: string, search: FindRoleListDto): Promise<ResultData> {
        const { page, size, name } = search;
        let connection = getConnection().createQueryBuilder("op_sys_role", "sr");

        if (type === UserType.SUPER_ADMIN) {
            connection = connection
                .leftJoinAndSelect("op_sys_role_leader", "srl", "srl.role_id = sr.id")
                .leftJoinAndMapMany("sr.leaders", "op_sys_user", "su", "su.id = srl.leader_id")
                .orderBy("sr.id", "DESC");
        } else {
            connection = connection
                .leftJoinAndSelect("op_sys_user_role", "sur", "sur.role_id = sr.id")
                .leftJoinAndSelect("op_sys_role_leader", "srl", "srl.role_id = sr.id")
                .leftJoinAndMapMany("sr.leaders", "op_sys_user", "su", "su.id = srl.leader_id")
                .where("sur.user_id = :userId", { userId });
        }

        // 有 RoleId 的情况
        if (name) {
            connection = connection.andWhere("sr.id= :roleId", { roleId: name });
        }

        // 有分页的情况下
        if (size) {
            connection = connection.skip(size * (page ?? 0)).take(size);
        }

        const [list, total] = await connection.getManyAndCount();

        return ResultData.ok({
            list,
            total,
        });
    }

    /**
     * 查询负责人对应的部门
     * @param dto
     */
    async findRoleByLeader(userId: string): Promise<string[]> {
        const leaders = await this.roleLeaderRepo.find({ where: { leaderId: userId } });
        return leaders?.map((role) => role.roleId);
    }

    /**
     * 根据 Role Id 获取该角色下所有负责人
     * @param dto
     */
    async findAllLeadersByRoleId(roleId: string): Promise<ResultData> {
        const currentRole = await this.roleRepo.findOne({ id: roleId });
        if (!currentRole) {
            return ResultData.fail(AppHttpCode.ROLE_NOT_FOUND, "当前角色不存在或已被删除");
        }
        const leaders = await this.roleLeaderRepo.find({ roleId });
        return ResultData.ok(leaders);
    }

    /**
     * 为角色设置负责人
     * @param dto
     */
    async createRoleLeaders(dto: CreateRoleLeadersDto): Promise<ResultData> {
        const currentRole = await this.roleRepo.findOne({ id: dto.roleId });
        if (!currentRole) {
            return ResultData.fail(AppHttpCode.ROLE_NOT_FOUND, "当前角色不存在或已被删除");
        }

        try {
            const result = await getManager().transaction(async (manager) => {
                const leaders = dto.leaders.map((userId) => {
                    const leaderIns = new RoleLeaderEntity();
                    leaderIns.roleId = dto.roleId;
                    leaderIns.leaderId = userId;
                    return manager.insert(RoleLeaderEntity, leaderIns);
                });
                return Promise.all(leaders);
            });

            if (result.length) {
                return ResultData.ok({});
            }
            return ResultData.fail(AppHttpCode.SERVICE_ERROR, "保存失败");
        } catch (error) {
            return ResultData.fail(AppHttpCode.PARAM_INVALID, "设置失败，请检查数据是不重复或其他异常");
        }
    }

    /**
     * 移除角色负责人
     * @param dto
     */
    @Transaction()
    async removeRoleLeaders(
        dto: RemoveRoleLeadersDto,
        @TransactionManager() manager?: EntityManager,
    ): Promise<ResultData> {
        const currentRole = await this.roleRepo.findOne({ id: dto.roleId });
        if (!currentRole) {
            return ResultData.fail(AppHttpCode.ROLE_NOT_FOUND, "当前角色不存在或已被删除");
        }
        const leaders = dto.leaders.map((userId) => {
            return manager.delete(RoleLeaderEntity, { leaderId: userId });
        });
        const result = await Promise.all(leaders);
        if (result.length) {
            return ResultData.ok({});
        }
        return ResultData.fail(AppHttpCode.SERVICE_ERROR, "移除失败");
    }
}

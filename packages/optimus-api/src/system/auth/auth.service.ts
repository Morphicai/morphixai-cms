import { Inject, Injectable } from "@nestjs/common";

import { UserService } from "../user/user.service";
import { RoleService } from "../role/role.service";
import { PermService } from "../perm/perm.service";

@Injectable()
export class AuthService {
    constructor(
        @Inject(UserService)
        private readonly userService: UserService,
        @Inject(RoleService)
        private readonly roleService: RoleService,
        @Inject(PermService)
        private readonly permService: PermService,
    ) {}

    async validateUser(payload: { id: string }): Promise<any> {
        const [user, roleIds, leaderRoleIds] = await Promise.all([
            this.userService.findOneById(payload.id),
            this.roleService.findRoleIdsByUserId(+payload.id),
            this.roleService.findRoleByLeader(payload.id),
        ]);

        // Get permission codes for the user
        const permissionCodes = await this.permService.findUserPermissionCodes(payload.id, user.type);

        return {
            ...user,
            roleIds,
            leaderRoleIds,
            perms: permissionCodes,
        };
    }
}

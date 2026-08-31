import { forwardRef, Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";

import { UserModule } from "../user/user.module";
import { RoleModule } from "../role/role.module";
import { PermModule } from "../perm/perm.module";
import { ClientUserModule } from "../../business/client-user/client-user.module";
import { ServiceOpsModule } from "../service-ops/service-ops.module";

import { AuthService } from "./auth.service";
import { AuthStrategy } from "./auth.strategy";
import { AuthIntrospectController } from "./auth-introspect.controller";
import { ServiceTokenService } from "./service-token.service";

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: "jwt" }),
        forwardRef(() => UserModule), // 模块间循环依赖处理
        forwardRef(() => RoleModule),
        forwardRef(() => PermModule),
        ClientUserModule,
        ServiceOpsModule,
    ],
    controllers: [AuthIntrospectController],
    providers: [AuthService, AuthStrategy, ServiceTokenService],
    exports: [PassportModule, AuthService, ServiceTokenService],
})
export class AuthModule {}

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
import { ServiceGrantGuard } from "../../shared/guards/service-grant.guard";

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
    // ServiceGrantGuard 挂在这里而非全局:它只对声明了 @RequireGrant 的接口生效,
    // 全局注册会让每个请求都白跑一次 reflector 查找。需要用它的模块 import AuthModule 即可
    providers: [AuthService, AuthStrategy, ServiceTokenService, ServiceGrantGuard],
    exports: [PassportModule, AuthService, ServiceTokenService, ServiceGrantGuard],
})
export class AuthModule {}

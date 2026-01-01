import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ValidationService } from "./services/validation.service";
import { CaslAbilityFactory } from "./casl/casl-ability.factory";
import { CASL_OPTIONS } from "./casl/casl.constants";

/**
 * 共享模块
 * 提供全局共享的服务
 */
@Global()
@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (config: ConfigService) => ({
                secret: config.get("jwt.secretkey"),
                signOptions: {
                    expiresIn: config.get("jwt.expiresin"),
                },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [
        ValidationService,
        {
            provide: CASL_OPTIONS,
            useValue: {
                // 简化的 CASL 配置
                admin: (ability, user) => {
                    ability.can('manage', 'all');
                },
                everyone: (ability, user) => {
                    // 基础权限配置
                    ability.can('read', 'all');
                }
            },
        },
        CaslAbilityFactory,
    ],
    exports: [ValidationService, JwtModule, CaslAbilityFactory],
})
export class SharedModule {}

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ClientUserController } from "./client-user.controller";
import { ClientUserService } from "./client-user.service";
import { ClientUserEntity } from "./entities/client-user.entity";
import { ClientUserExternalAccountEntity } from "./entities/client-user-external-account.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([ClientUserEntity, ClientUserExternalAccountEntity]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get('CLIENT_USER_JWT_SECRET', 'default-client-jwt-secret'),
                signOptions: {
                    expiresIn: configService.get('CLIENT_USER_JWT_EXPIRES_IN', '2h'),
                },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [ClientUserController],
    providers: [ClientUserService],
    exports: [ClientUserService], // 确保其他模块可以注入
})
export class ClientUserModule {}

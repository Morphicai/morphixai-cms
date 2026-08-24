import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { HealthController } from "./health.controller";
import { IntrospectAuthGuard } from "./shared/guards/introspect-auth.guard";
import { PartnerModule } from "./business/partner/partner.module";
import { PointsEngineModule } from "./business/points-engine/points-engine.module";
import { ExternalTaskModule } from "./business/external-task/external-task.module";

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService): TypeOrmModuleOptions => ({
                type: "mysql",
                host: config.get<string>("DATABASE_HOST") || "localhost",
                port: parseInt(config.get<string>("DATABASE_PORT") || "3306", 10),
                username: config.get<string>("DATABASE_USERNAME") || "root",
                password: config.get<string>("DATABASE_PASSWORD"),
                database: config.get<string>("DATABASE_NAME") || "optimus",
                // 和 optimus-api 指向同一个库,但绝不在这里建/改表——迁进来的实体
                // 靠 optimus-api 侧已有的迁移脚本(如 op_biz_task_completion_log)
                entities: [`${__dirname}/**/*.entity{.ts,.js}`],
                synchronize: false,
                keepConnectionAlive: true,
                connectTimeout: 60000,
                retryAttempts: 3,
                retryDelay: 3000,
                extra: {
                    // 容器化 MySQL 走宿主机端口转发(localhost:3306)时闲置连接会被转发层
                    // 静默掐断,见 optimus-api app.module.ts 同款注释与 pool-keepalive.service.ts
                    enableKeepAlive: true,
                    keepAliveInitialDelay: 10000,
                    connectionLimit: 10,
                },
            }),
        }),
        PartnerModule,
        PointsEngineModule,
        ExternalTaskModule,
    ],
    controllers: [HealthController],
    providers: [{ provide: APP_GUARD, useClass: IntrospectAuthGuard }],
})
export class AppModule {}

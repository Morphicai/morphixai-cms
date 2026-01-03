import { Module, Logger } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { SentryModule } from "@sentry/nestjs/setup";
import * as Sentry from "@sentry/nestjs";

import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";

import configuration from "./shared/config";
import { SentryTypeOrmLogger } from "./shared/database/sentry-typeorm-logger";

import { SharedModule } from "./shared/shared.module";
import { GameWemadeModule } from "./shared/libs/gamewemade/gamewemade.module";
import { OperationLogModule } from "./shared/modules/operation-log.module";
import { OperationLogInterceptor } from "./shared/interceptors/operation-log.interceptor";
import { UnifiedAuthGuard } from "./shared/guards/unified-auth.guard";
import { InitializationGuard } from "./shared/guards/initialization.guard";
import { InitializationModule } from "./shared/guards/initialization.module";
import { GlobalExceptionFilter } from "./shared/filters/global-exception.filter";
import { HealthController } from "./health.controller";
import { DatabaseInitializerModule } from "./shared/database/database-initializer.module";
import { DatabaseStartupService } from "./shared/database/database-startup.service";

import { UserModule } from "./system/user/user.module";
import { AuthModule } from "./system/auth/auth.module";
import { RoleModule } from "./system/role/role.module";
import { PermModule } from "./system/perm/perm.module";
import { OssModule } from "./system/oss/oss.module";
import { DocumentModule } from "./system/document/document.module";
import { ArticleModule } from "./system/article/article.module";
import { CategoryModule } from "./system/category/category.module";
import { ArticleVersionModule } from "./system/article-version/article-version.module";
import { WSModule } from "./system/ws/ws.module";
import { CaslDemoModule } from "./system/casl-demo/casl-demo.module";
import { ScheduleModule } from "./system/schedule/schedule.module";

import { ContactModule } from "./business/contact/contact.module";
import { OrderModule } from "./business/order/order.module";
import { AppointmentModule } from "./business/appointment/appointment.module";
import { RewardClaimRecordModule } from "./business/reward-claim-record/reward-claim-record.module";
import { DatabaseBackupModule } from "./system/database-backup/database-backup.module";
import { DeployWebhookModule } from "./system/deploy-webhook/deploy-webhook.module";
import { DictionaryModule } from "./system/dictionary/dictionary.module";
import { ShortLinkModule } from "./system/short-link/short-link.module";
import { PartnerModule } from "./business/partner/partner.module";
import { PointsEngineModule } from "./business/points-engine/points-engine.module";
import { ExternalTaskModule } from "./business/external-task/external-task.module";
import { ClientUserModule } from "./business/client-user/client-user.module";
import { SetupModule } from "./system/setup/setup.module";
import { join } from "path";

@Module({
    controllers: [HealthController],
    imports: [
        // Sentry 错误监控
        SentryModule.forRoot(),
        // 配置模块
        // 从当前项目目录加载环境变量文件
        ConfigModule.forRoot({
            cache: true,
            load: [configuration],
            isGlobal: true,
            envFilePath: (() => {
                const projectDir = join(__dirname, "..");
                const nodeEnv = process.env.NODE_ENV || "development";

                // 根据 NODE_ENV 动态加载对应的环境变量文件
                //
                // ⚠️ 重要：NestJS ConfigModule 使用 dotenv 加载文件
                // dotenv 的默认行为：按顺序加载，如果变量已存在则不会覆盖
                // 因此顺序应该是：本地覆盖配置 -> 环境特定配置 -> 基础配置（优先级从高到低）
                // 这样优先级最高的文件先加载，其变量会被保留，后面的文件不会覆盖它
                //
                // 参考：https://docs.nestjs.com/techniques/configuration
                const envFiles = [
                    join(projectDir, ".env.local"), // 本地覆盖配置（优先级最高，先加载）
                    join(projectDir, `.env.${nodeEnv}`), // 环境特定配置（如 .env.development, .env.e2e）
                    join(projectDir, ".env"), // 基础配置（优先级最低，最后加载）
                ];

                return envFiles;
            })(),
        }),
        // 数据库
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => {
                // ConfigModule 加载后，再次执行 DATABASE_* 到 DB_* 的映射
                // 确保环境变量映射正确（因为 ConfigModule 可能会重新加载环境变量）
                if (process.env.DATABASE_HOST && !process.env.DB_HOST) {
                    process.env.DB_HOST = process.env.DATABASE_HOST;
                }
                if (process.env.DATABASE_PORT && !process.env.DB_PORT) {
                    process.env.DB_PORT = process.env.DATABASE_PORT;
                }
                if (process.env.DATABASE_USERNAME && !process.env.DB_USERNAME) {
                    process.env.DB_USERNAME = process.env.DATABASE_USERNAME;
                }
                if (process.env.DATABASE_PASSWORD && !process.env.DB_PASSWORD) {
                    process.env.DB_PASSWORD = process.env.DATABASE_PASSWORD;
                }
                if (process.env.DATABASE_NAME && !process.env.DB_DATABASE) {
                    process.env.DB_DATABASE = process.env.DATABASE_NAME;
                }

                const dbConfig = config.get("db.mysql");
                const logger = new Logger("DatabaseConfig");

                // 打印数据库连接信息（隐藏密码）
                logger.log("=== 数据库连接配置 ===");
                logger.log(
                    `连接字符串: mysql://${dbConfig?.username || "未配置"}:***@${dbConfig?.host || "未配置"}:${
                        dbConfig?.port || "未配置"
                    }/${dbConfig?.database || "未配置"}`,
                );
                logger.log(`Host: ${dbConfig?.host || "未配置"}`);
                logger.log(`Port: ${dbConfig?.port || "未配置"}`);
                logger.log(`Database: ${dbConfig?.database || "未配置"}`);
                logger.log(`Username: ${dbConfig?.username || "未配置"}`);
                logger.log(`Password: ${dbConfig?.password ? "***已配置***" : "未配置"}`);
                logger.log(`Password Length: ${dbConfig?.password?.length || 0}`);
                logger.log(`Charset: ${dbConfig?.charset || dbConfig?.charser || "未配置"}`);
                logger.log(`Connect Timeout: ${dbConfig?.connectTimeout || 60000}ms`);
                logger.log(`Query Timeout: ${dbConfig?.timeout || 60000}ms`);
                logger.log(`Retry Attempts: ${dbConfig?.retryAttempts || 3}`);
                logger.log(`Retry Delay: ${dbConfig?.retryDelay || 3000}ms`);
                logger.log(`Keep Connection Alive: ${dbConfig?.keepConnectionAlive !== false}`);
                logger.log(`NODE_ENV: ${process.env.NODE_ENV || "未设置"}`);
                logger.log("--- 环境变量检查 ---");
                logger.log(
                    `DB_HOST (env): ${process.env.DB_HOST || "未设置"} ${
                        process.env.DATABASE_HOST ? `(从 DATABASE_HOST 映射)` : ""
                    }`,
                );
                logger.log(
                    `DB_USERNAME (env): ${process.env.DB_USERNAME || "未设置"} ${
                        process.env.DATABASE_USERNAME ? `(从 DATABASE_USERNAME 映射)` : ""
                    }`,
                );
                logger.log(
                    `DB_PASSWORD (env): ${process.env.DB_PASSWORD ? "***已设置***" : "未设置"} ${
                        process.env.DATABASE_PASSWORD ? `(从 DATABASE_PASSWORD 映射)` : ""
                    }`,
                );
                logger.log(
                    `DB_DATABASE (env): ${process.env.DB_DATABASE || "未设置"} ${
                        process.env.DATABASE_NAME ? `(从 DATABASE_NAME 映射)` : ""
                    }`,
                );
                logger.log(
                    `DB_PORT (env): ${process.env.DB_PORT || "未设置"} ${
                        process.env.DATABASE_PORT ? `(从 DATABASE_PORT 映射)` : ""
                    }`,
                );
                logger.log(`DB_CHARSET (env): ${process.env.DB_CHARSET || "未设置"}`);
                logger.log("====================");

                return {
                    type: "mysql",
                    entities: [`${__dirname}/**/*.entity{.ts,.js}`],
                    keepConnectionAlive: true,
                    connectTimeout: 60000, // 60秒连接超时
                    // acquireTimeout 不是 MySQL2 的有效配置选项，已移除
                    timeout: 60000, // 60秒查询超时
                    retryAttempts: 3, // 减少重试次数到 3 次
                    retryDelay: 3000, // 每次重试间隔 3 秒
                    logger: new SentryTypeOrmLogger(), // 使用自定义 Logger 捕获错误
                    ...dbConfig,
                } as TypeOrmModuleOptions;
            },
        }),

        // 数据库初始化模块
        DatabaseInitializerModule,

        // 初始化守卫模块（必须在其他模块之前导入）
        InitializationModule,

        // 共享模块
        SharedModule,

        // 系统基础模块
        GameWemadeModule,
        OperationLogModule,
        UserModule,
        AuthModule,
        RoleModule,
        PermModule,
        OssModule,
        DocumentModule,
        // 文章管理模块
        ArticleModule,
        CategoryModule,
        ArticleVersionModule,
        // 业务功能模块
        ContactModule,
        OrderModule,
        AppointmentModule,
        RewardClaimRecordModule,
        CaslDemoModule,
        // WebSocket Gateway
        WSModule,
        // 定时任务
        ScheduleModule,
        // 数据库备份模块
        DatabaseBackupModule,
        // 部署 Webhook 模块
        DeployWebhookModule,
        // 字典管理模块
        DictionaryModule,
        // 短链管理模块
        ShortLinkModule,
        // 合伙人计划模块
        PartnerModule,
        // 积分引擎模块
        PointsEngineModule,
        // 外部任务模块
        ExternalTaskModule,
        // C端用户模块
        ClientUserModule,
        // 系统安装模块
        SetupModule,
    ],
    // app module 守卫，统一认证守卫依赖多个服务，而这些服务没有设置全局模块，
    // 所以统一守卫不能在 main.ts 设置全局守卫
    providers: [
        DatabaseStartupService,
        // 初始化守卫 - 优先级最高，在所有其他守卫之前执行
        // 确保系统未初始化时，只有初始化接口可以访问
        {
            provide: APP_GUARD,
            useClass: InitializationGuard,
        },
        // 统一认证守卫 - 在初始化守卫之后执行
        {
            provide: APP_GUARD,
            useClass: UnifiedAuthGuard,
        },
        {
            provide: APP_FILTER,
            useClass: GlobalExceptionFilter,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: OperationLogInterceptor,
        },
    ],
})
export class AppModule {}

import { Module, OnModuleInit, Logger } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleModule } from "@nestjs/schedule";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { OssController } from "./oss.controller";
import { FileProxyController } from "./file-proxy.controller";
import { OssService } from "./oss.service";
import { OssEntity } from "./oss.entity";
import { FileMetadataService } from "./file-metadata.service";
import { StorageFactory } from "./factory/storage.factory";
import { StorageConfigService } from "./storage-config.service";
import { StorageExceptionFilter } from "./filters/storage-exception.filter";
import { FileProxyExceptionFilter } from "./filters/file-proxy-exception.filter";
import { StorageLoggingInterceptor, StoragePerformanceInterceptor } from "./interceptors/storage-logging.interceptor";
import { FileProxyLoggingInterceptor, FileProxyStatsInterceptor } from "./interceptors/file-proxy-logging.interceptor";
import { TemporaryUrlService, StorageProviderResolver } from "./services";
import { FileProxyLoggerService } from "./services/file-proxy-logger.service";
import { FileCacheService } from "./services/file-cache.service";
import { ProxyUrlService } from "./utils/proxy-url.utils";
import { OssProxyUrlUtils } from "./utils/oss-proxy-url.utils";

@Module({
    imports: [
        TypeOrmModule.forFeature([OssEntity]),
        ScheduleModule.forRoot(), // 启用定时任务支持
    ],
    providers: [
        OssService,
        FileMetadataService,
        StorageFactory,
        StorageConfigService,
        TemporaryUrlService,
        StorageProviderResolver,
        FileProxyLoggerService,
        FileCacheService,
        ProxyUrlService,

        // 全局异常过滤器（仅对此模块生效）
        {
            provide: APP_FILTER,
            useClass: StorageExceptionFilter,
        },
        {
            provide: APP_FILTER,
            useClass: FileProxyExceptionFilter,
        },
        // 存储相关拦截器（仅对 OssController 生效）
        StorageLoggingInterceptor,
        StoragePerformanceInterceptor,
        // 文件代理拦截器（仅对 FileProxyController 生效）
        FileProxyLoggingInterceptor,
        FileProxyStatsInterceptor,
    ],
    controllers: [OssController, FileProxyController],
    exports: [
        FileMetadataService,
        StorageFactory,
        StorageConfigService,
        TemporaryUrlService,
        StorageProviderResolver,
        FileProxyLoggerService,
        FileCacheService,
        ProxyUrlService,
    ], // 导出以供其他模块使用
})
export class OssModule implements OnModuleInit {
    private readonly logger = new Logger(OssModule.name);

    onModuleInit() {
        // 模块初始化时检查环境变量
        this.logger.log("初始化 OSS 模块，检查环境变量配置...");

        // 直接检查 process.env
        const directEnvValue = process.env.REACT_APP_FILE_API_PREFIX;
        this.logger.log(`直接读取 process.env.REACT_APP_FILE_API_PREFIX: ${directEnvValue || "(未设置)"}`);
        this.logger.log(
            `process.env 所有 REACT_APP 开头的变量: ${JSON.stringify(
                Object.keys(process.env).filter((k) => k.startsWith("REACT_APP")),
            )}`,
        );

        // 初始化工具类
        OssProxyUrlUtils.initialize();
        const envStatus = OssProxyUrlUtils.checkEnvironmentVariable();
        this.logger.log(`环境变量检查结果: ${JSON.stringify(envStatus, null, 2)}`);
    }
}

import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Connection } from "typeorm";
import { InjectConnection } from "@nestjs/typeorm";
import * as Sentry from "@sentry/nestjs";
import { DatabaseInitializerService } from "./database-initializer.service";

@Injectable()
export class DatabaseStartupService implements OnModuleInit {
    private readonly logger = new Logger(DatabaseStartupService.name);

    constructor(
        @InjectConnection() private readonly connection: Connection,
        private readonly databaseInitializer: DatabaseInitializerService,
    ) {}

    async onModuleInit(): Promise<void> {
        // 暂时禁用数据库启动服务，因为种子数据有问题
        return;
    }
}

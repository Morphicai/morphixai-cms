import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PoolKeepaliveService } from "./pool-keepalive.service";
import { DatabaseInitializerService } from "./database-initializer.service";

@Module({
    imports: [ConfigModule],
    providers: [DatabaseInitializerService, PoolKeepaliveService],
    exports: [DatabaseInitializerService],
})
export class DatabaseInitializerModule {}

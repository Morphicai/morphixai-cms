import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseInitializerService } from "./database-initializer.service";

@Module({
    imports: [ConfigModule],
    providers: [DatabaseInitializerService],
    exports: [DatabaseInitializerService],
})
export class DatabaseInitializerModule {}

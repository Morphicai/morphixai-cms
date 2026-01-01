import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleModule } from "@nestjs/schedule";
import { OssModule } from "../oss/oss.module";
import { UserModule } from "../user/user.module";
import { DatabaseBackupService } from "./database-backup.service";
import { BackupSchedulerService } from "./backup-scheduler.service";
import { DatabaseBackupController } from "./database-backup.controller";
import { BackupRecordEntity } from "./entities/backup-record.entity";

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([BackupRecordEntity]),
        ScheduleModule.forRoot(),
        OssModule,
        UserModule,
    ],
    providers: [DatabaseBackupService, BackupSchedulerService],
    controllers: [DatabaseBackupController],
    exports: [DatabaseBackupService],
})
export class DatabaseBackupModule {}

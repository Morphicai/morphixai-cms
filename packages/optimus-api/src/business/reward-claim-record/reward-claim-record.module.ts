import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RewardClaimRecordController } from "./reward-claim-record.controller";
import { RewardClaimRecordService } from "./reward-claim-record.service";
import { RewardClaimRecordEntity } from "./entities/reward-claim-record.entity";
import { ActivityModule } from "../activity/activity.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([RewardClaimRecordEntity]),
        ActivityModule, // 导入 ActivityModule 以使用 ActivityService
    ],
    controllers: [RewardClaimRecordController],
    providers: [RewardClaimRecordService],
    exports: [RewardClaimRecordService],
})
export class RewardClaimRecordModule {}

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RewardClaimRecordController } from "./reward-claim-record.controller";
import { RewardClaimRecordService } from "./reward-claim-record.service";
import { RewardClaimRecordEntity } from "./entities/reward-claim-record.entity";
import { ActivityService } from "./services/activity.service";

@Module({
    imports: [TypeOrmModule.forFeature([RewardClaimRecordEntity])],
    controllers: [RewardClaimRecordController],
    providers: [RewardClaimRecordService, ActivityService],
    exports: [RewardClaimRecordService],
})
export class RewardClaimRecordModule {}

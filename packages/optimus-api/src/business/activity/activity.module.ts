import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ActivityController } from "./activity.controller";
import { ActivityService } from "./activity.service";
import { ActivityEntity } from "./entities/activity.entity";

@Module({
    imports: [TypeOrmModule.forFeature([ActivityEntity])],
    controllers: [ActivityController],
    providers: [ActivityService],
    exports: [ActivityService],
})
export class ActivityModule {}


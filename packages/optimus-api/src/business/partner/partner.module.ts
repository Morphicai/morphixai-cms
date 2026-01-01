import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { PartnerController } from "./partner.controller";
import { PartnerAdminController } from "./controllers/partner-admin.controller";
import { PartnerService } from "./partner.service";
import { HierarchyService } from "./hierarchy.service";
import { ChannelService } from "./channel.service";
import { StatisticsService } from "./statistics.service";
import { PartnerProfileEntity } from "./entities/partner-profile.entity";
import { PartnerHierarchyEntity } from "./entities/partner-hierarchy.entity";
import { PartnerChannelEntity } from "./entities/partner-channel.entity";
import { AdminOperationLogEntity } from "./entities/admin-operation-log.entity";
import { TaskCompletionLogEntity } from "../points-engine/entities/task-completion-log.entity";
import { UserModule } from "../../system/user/user.module";
import { ShortLinkModule } from "../../system/short-link/short-link.module";
import { PointsEngineModule } from "../points-engine/points-engine.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            PartnerProfileEntity,
            PartnerHierarchyEntity,
            PartnerChannelEntity,
            AdminOperationLogEntity,
            TaskCompletionLogEntity, // 添加 TaskCompletionLogEntity 以供 StatisticsService 使用
        ]),
        EventEmitterModule.forRoot(),
        UserModule,
        ShortLinkModule, // 导入以使用 ShortLinkService
        forwardRef(() => PointsEngineModule), // 使用 forwardRef 解决循环依赖
    ],
    controllers: [PartnerAdminController, PartnerController], // Admin 路由更具体，应该先注册
    providers: [PartnerService, HierarchyService, ChannelService, StatisticsService],
    exports: [PartnerService, HierarchyService, ChannelService, StatisticsService],
})
export class PartnerModule {}

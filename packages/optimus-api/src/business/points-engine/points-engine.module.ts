import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { TaskCompletionLogEntity } from "./entities/task-completion-log.entity";
import { PointsController } from "./controllers/points.controller";
import { PointsService } from "./services/points.service";
import { PointRuleService } from "./services/point-rule.service";
import { PointsCacheService } from "./services/points-cache.service";
import { TaskEngineService } from "./services/task-engine.service";
import { RegisterTaskHandler } from "./handlers/register-task.handler";
import { InviteTaskHandler } from "./handlers/invite-task.handler";
import { GameActionTaskHandler } from "./handlers/game-action-task.handler";
import { ExternalTaskHandler } from "./handlers/external-task.handler";
import { PartnerModule } from "../partner/partner.module";
import { UserModule } from "../../system/user/user.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([TaskCompletionLogEntity]),
        EventEmitterModule.forRoot(),
        forwardRef(() => PartnerModule),
        UserModule,
    ],
    controllers: [PointsController],
    providers: [
        PointsService,
        PointRuleService,
        PointsCacheService,
        TaskEngineService,
        RegisterTaskHandler,
        InviteTaskHandler,
        GameActionTaskHandler,
        ExternalTaskHandler,
    ],
    exports: [PointsService, TaskEngineService, PointsCacheService],
})
export class PointsEngineModule {
    constructor(
        private readonly taskEngineService: TaskEngineService,
        private readonly registerTaskHandler: RegisterTaskHandler,
        private readonly inviteTaskHandler: InviteTaskHandler,
        private readonly gameActionTaskHandler: GameActionTaskHandler,
        private readonly externalTaskHandler: ExternalTaskHandler,
    ) {
        // 注册任务处理器
        this.taskEngineService.registerHandler(this.registerTaskHandler);
        this.taskEngineService.registerHandler(this.inviteTaskHandler);
        this.taskEngineService.registerHandler(this.gameActionTaskHandler);
        this.taskEngineService.registerHandler(this.externalTaskHandler);
    }
}

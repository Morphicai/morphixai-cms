import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ExternalTaskSubmissionEntity } from "./entities/external-task-submission.entity";
import { ExternalTaskService } from "./services/external-task.service";
import { ExternalTaskController } from "./controllers/external-task.controller";
import { ExternalTaskAdminController } from "./controllers/external-task-admin.controller";
import { PointsEngineModule } from "../points-engine/points-engine.module";
import { PartnerModule } from "../partner/partner.module";

// OSS 存储不随迁移复制(见 design.md 3.5 节),ExternalTaskController 改成
// HTTP 调 optimus-api 的 POST /files/client-upload,不再需要 OssModule
@Module({
    imports: [
        TypeOrmModule.forFeature([ExternalTaskSubmissionEntity]),
        PointsEngineModule,
        PartnerModule,
    ],
    controllers: [ExternalTaskController, ExternalTaskAdminController],
    providers: [ExternalTaskService],
    exports: [ExternalTaskService],
})
export class ExternalTaskModule {}

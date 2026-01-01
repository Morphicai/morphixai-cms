import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ExternalTaskSubmissionEntity } from "./entities/external-task-submission.entity";
import { ExternalTaskService } from "./services/external-task.service";
import { ExternalTaskController } from "./controllers/external-task.controller";
import { ExternalTaskAdminController } from "./controllers/external-task-admin.controller";
import { PointsEngineModule } from "../points-engine/points-engine.module";
import { PartnerModule } from "../partner/partner.module";
import { OssModule } from "../../system/oss/oss.module";
import { UserModule } from "../../system/user/user.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([ExternalTaskSubmissionEntity]),
        PointsEngineModule,
        PartnerModule,
        OssModule,
        UserModule,
    ],
    controllers: [ExternalTaskController, ExternalTaskAdminController],
    providers: [ExternalTaskService],
    exports: [ExternalTaskService],
})
export class ExternalTaskModule {}

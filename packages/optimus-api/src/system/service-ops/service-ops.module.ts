import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DictionaryEntity } from "../dictionary/entities/dictionary.entity";
import { ServiceEventEntity } from "./entities/service-event.entity";
import { ServiceEventService } from "./service-event.service";
import { ServiceProbeService } from "./service-probe.service";
import { ServiceOpsController } from "./service-ops.controller";

/** 服务治理:注册清单存 services-registry 集合,这里只管探测、事件与接入面 */
@Module({
    imports: [TypeOrmModule.forFeature([ServiceEventEntity, DictionaryEntity])],
    controllers: [ServiceOpsController],
    providers: [ServiceEventService, ServiceProbeService],
})
export class ServiceOpsModule {}

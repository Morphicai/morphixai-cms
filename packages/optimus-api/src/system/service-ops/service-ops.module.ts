import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DictionaryEntity } from "../dictionary/entities/dictionary.entity";
import { ServiceEventEntity } from "./entities/service-event.entity";
import { ServiceEventService } from "./service-event.service";
import { ServiceProbeService } from "./service-probe.service";
import { ServiceRegistryService } from "./service-registry.service";
import { ServiceOpsController } from "./service-ops.controller";

/** 服务治理:目录(services-registry 集合)是唯一事实源,这里管接入面、探测、事件 */
@Module({
    imports: [TypeOrmModule.forFeature([ServiceEventEntity, DictionaryEntity])],
    controllers: [ServiceOpsController],
    providers: [ServiceEventService, ServiceProbeService, ServiceRegistryService],
})
export class ServiceOpsModule {}

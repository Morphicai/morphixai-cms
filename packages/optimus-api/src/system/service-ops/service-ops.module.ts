import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ServiceEventEntity } from "./entities/service-event.entity";
import { ServiceRegistryEntity } from "./service-registry.entity";
import { ServiceEventService } from "./service-event.service";
import { ServiceProbeService } from "./service-probe.service";
import { ServiceRegistryService } from "./service-registry.service";
import { ServiceOpsController } from "./service-ops.controller";
import { PublicZoneRoutesController } from "./public-zone-routes.controller";
import { PublicApiRoutesController } from "./public-api-routes.controller";

/** 服务治理:目录(op_sys_service_registry 专表)是唯一事实源,这里管接入面、探测、事件 */
@Module({
    imports: [TypeOrmModule.forFeature([ServiceEventEntity, ServiceRegistryEntity])],
    controllers: [ServiceOpsController, PublicZoneRoutesController, PublicApiRoutesController],
    providers: [ServiceEventService, ServiceProbeService, ServiceRegistryService],
})
export class ServiceOpsModule {}

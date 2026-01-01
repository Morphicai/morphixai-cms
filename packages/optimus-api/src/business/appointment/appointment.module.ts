import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AppointmentController } from "./appointment.controller";
import { PublicAppointmentController } from "./public-appointment.controller";
import { AppointmentService } from "./appointment.service";
import { AppointmentEntity } from "./entities/appointment.entity";

@Module({
    imports: [TypeOrmModule.forFeature([AppointmentEntity])],
    controllers: [AppointmentController, PublicAppointmentController],
    providers: [AppointmentService],
    exports: [AppointmentService],
})
export class AppointmentModule {}

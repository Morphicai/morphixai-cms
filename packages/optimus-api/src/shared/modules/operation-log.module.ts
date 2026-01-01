import { Module, Global, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OperationLogEntity } from "../entities/operation-log.entity";
import { OperationLogService } from "../services/operation-log.service";
import { OperationLogInterceptor } from "../interceptors/operation-log.interceptor";
import { OperationLogController } from "../controllers/operation-log.controller";
import { UserModule } from "../../system/user/user.module";

/**
 * 操作日志模块
 * 使用 @Global 装饰器，使其在整个应用中可用
 */
@Global()
@Module({
    imports: [TypeOrmModule.forFeature([OperationLogEntity]), forwardRef(() => UserModule)],
    controllers: [OperationLogController],
    providers: [OperationLogService, OperationLogInterceptor],
    exports: [OperationLogService, OperationLogInterceptor],
})
export class OperationLogModule {}

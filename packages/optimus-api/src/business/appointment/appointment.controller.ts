import { Controller, Get, Post, Query, Body, UseInterceptors, Res, Req, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiExtraModels } from "@nestjs/swagger";

import { AppointmentService } from "./appointment.service";
import { AppointmentEntity } from "./entities/appointment.entity";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { QueryAppointmentDto, AppointmentListResponseDto } from "./dto/query-appointment.dto";
import { QueryAppointmentStatusDto, AppointmentStatusResponseDto } from "./dto/query-appointment-status.dto";

import { ResultData } from "../../shared/utils/result";
import { ApiResult } from "../../shared/decorators/api-result.decorator";
import { OperationLog } from "../../shared/decorators/operation-log.decorator";
import { OperationLogInterceptor } from "../../shared/interceptors/operation-log.interceptor";
import { ClientUserAuth } from "../../shared/decorators/auth-mode.decorator";

@ApiTags("预约记录相关")
@ApiBearerAuth()
@ApiExtraModels(ResultData, AppointmentEntity, AppointmentListResponseDto, AppointmentStatusResponseDto)
@Controller("biz/appointment")
@UseInterceptors(OperationLogInterceptor)
export class AppointmentController {
    constructor(private readonly appointmentService: AppointmentService) {}

    @Post("/create")
    @ClientUserAuth() // 使用统一的客户端用户认证，支持 GameWemade 签名
    @ApiOperation({ summary: "创建预约记录（需要客户端用户认证）" })
    @ApiResult(AppointmentEntity)
    @OperationLog({
        module: "appointment",
        action: "create",
        description: "创建预约记录",
        recordResponse: false,
    })
    async create(@Body() createDto: CreateAppointmentDto, @Req() req: any): Promise<ResultData> {
        // 用户信息已经通过统一守卫验证
        const user = (req as any).clientUser;
        const uid = user?.userId;
        return await this.appointmentService.create(createDto, uid);
    }

    @Get("/list")
    @ApiOperation({ summary: "查询预约记录列表" })
    @ApiResult(AppointmentListResponseDto)
    async list(@Query() queryDto: QueryAppointmentDto): Promise<ResultData> {
        return await this.appointmentService.list(queryDto);
    }

    @Get("/export")
    @ApiOperation({ summary: "导出预约记录为 Excel" })
    @OperationLog({
        module: "appointment",
        action: "export",
        description: "导出预约记录",
        recordResponse: false,
    })
    async export(@Query() queryDto: QueryAppointmentDto, @Res() res: Response): Promise<void> {
        try {
            const buffer = await this.appointmentService.exportToExcel(queryDto);
            const fileName = `预约记录_${new Date().toISOString().split("T")[0]}.xlsx`;

            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
            res.setHeader("Content-Length", buffer.length.toString());

            res.send(buffer);
        } catch (error) {
            if (!res.headersSent) {
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                    code: HttpStatus.INTERNAL_SERVER_ERROR,
                    msg: `导出失败: ${error.message}`,
                });
            }
        }
    }

    @Get("/status")
    @ClientUserAuth()
    @ApiOperation({ summary: "根据UID或手机号查询预约状态（需要客户端用户认证）" })
    @ApiResult(AppointmentStatusResponseDto)
    async getStatus(@Query() queryDto: QueryAppointmentStatusDto): Promise<ResultData> {
        return await this.appointmentService.getAppointmentStatus(queryDto);
    }
}

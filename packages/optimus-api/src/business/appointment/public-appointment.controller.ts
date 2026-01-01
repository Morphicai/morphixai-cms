import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AppointmentEntity } from "./entities/appointment.entity";
import { AppointmentStatsDto, AppointmentStageStatsDto, AppointmentChannelStatsDto } from "./dto/appointment-stats.dto";
import { ResultData } from "../../shared/utils/result";
import { AllowAnonymous } from "../../shared/decorators/allow-anonymous.decorator";

/**
 * 预约数据公开查询接口
 * 类似文章的公开接口，无需认证即可访问
 */
@ApiTags("预约数据（公开接口）")
@Controller("public/appointment")
@AllowAnonymous()
export class PublicAppointmentController {
    constructor(
        @InjectRepository(AppointmentEntity)
        private readonly appointmentRepo: Repository<AppointmentEntity>,
    ) {}

    @Get("stats")
    @ApiOperation({ summary: "获取预约总数统计（公开接口）" })
    @ApiResponse({ status: 200, description: "获取预约统计成功", type: AppointmentStatsDto })
    async getAppointmentStats(): Promise<ResultData> {
        const total = await this.appointmentRepo.count();

        const stats: AppointmentStatsDto = {
            total,
        };

        return ResultData.ok(stats, "获取预约统计成功");
    }

    @Get("stats/stage")
    @ApiOperation({ summary: "获取各阶段预约统计（公开接口）" })
    @ApiResponse({ status: 200, description: "获取阶段预约统计成功", type: [AppointmentStageStatsDto] })
    async getStageStats(): Promise<ResultData> {
        const result = await this.appointmentRepo
            .createQueryBuilder("appointment")
            .select("appointment.stage", "stage")
            .addSelect("COUNT(*)", "count")
            .groupBy("appointment.stage")
            .orderBy("count", "DESC")
            .getRawMany();

        const stats: AppointmentStageStatsDto[] = result.map((item) => ({
            stage: item.stage,
            count: parseInt(item.count, 10),
        }));

        return ResultData.ok(stats, "获取阶段预约统计成功");
    }

    @Get("stats/channel")
    @ApiOperation({ summary: "获取各渠道预约统计（公开接口）" })
    @ApiResponse({ status: 200, description: "获取渠道预约统计成功", type: [AppointmentChannelStatsDto] })
    async getChannelStats(): Promise<ResultData> {
        const result = await this.appointmentRepo
            .createQueryBuilder("appointment")
            .select("appointment.channel", "channel")
            .addSelect("COUNT(*)", "count")
            .groupBy("appointment.channel")
            .orderBy("count", "DESC")
            .getRawMany();

        const stats: AppointmentChannelStatsDto[] = result.map((item) => ({
            channel: item.channel,
            count: parseInt(item.count, 10),
        }));

        return ResultData.ok(stats, "获取渠道预约统计成功");
    }

    @Get("stats/detail")
    @ApiOperation({ summary: "获取详细预约统计（按阶段和渠道）" })
    @ApiQuery({ name: "stage", required: false, description: "阶段筛选" })
    @ApiQuery({ name: "channel", required: false, description: "渠道筛选" })
    @ApiResponse({ status: 200, description: "获取详细预约统计成功" })
    async getDetailStats(@Query("stage") stage?: string, @Query("channel") channel?: string): Promise<ResultData> {
        const queryBuilder = this.appointmentRepo.createQueryBuilder("appointment");

        if (stage) {
            queryBuilder.andWhere("appointment.stage = :stage", { stage });
        }

        if (channel) {
            queryBuilder.andWhere("appointment.channel = :channel", { channel });
        }

        const total = await queryBuilder.getCount();

        return ResultData.ok({ total, stage, channel }, "获取详细预约统计成功");
    }
}

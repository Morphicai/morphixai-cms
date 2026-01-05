import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { instanceToPlain } from "class-transformer";
import xlsx from "node-xlsx";

import { ResultData } from "../../shared/utils/result";
import { AppHttpCode } from "../../shared/enums/code.enum";
import { AppointmentEntity } from "./entities/appointment.entity";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { QueryAppointmentDto, AppointmentListResponseDto, AppointmentInfoDto } from "./dto/query-appointment.dto";
import { QueryAppointmentStatusDto, AppointmentStatusResponseDto } from "./dto/query-appointment-status.dto";

/**
 * 预约记录服务
 */
@Injectable()
export class AppointmentService {
    private readonly logger = new Logger(AppointmentService.name);

    constructor(
        @InjectRepository(AppointmentEntity)
        private readonly appointmentRepo: Repository<AppointmentEntity>,
    ) {}

    /**
     * 创建预约记录
     * @param createDto 创建预约记录DTO
     * @param uidFromGuard 从客户端用户认证守卫中获取的 UID
     * @returns 创建结果
     */
    async create(createDto: CreateAppointmentDto, uidFromGuard?: string): Promise<ResultData> {
        try {
            // 优先使用守卫中的 uid，如果没有则使用 DTO 中的 uid
            const uid = uidFromGuard || createDto.uid;

            // 检查手机号是否已存在
            const existingAppointment = await this.appointmentRepo.findOne({
                where: { phone: createDto.phone },
            });

            if (existingAppointment) {
                this.logger.log(`手机号已存在，直接返回成功：手机号=${createDto.phone}, uid=${uid}`);
                return ResultData.ok(instanceToPlain(existingAppointment), "预约成功");
            }

            const appointment = this.appointmentRepo.create({
                ...createDto,
                uid, // 使用从守卫中获取的 uid
                appointmentTime: new Date(createDto.appointmentTime),
            });

            const saved = await this.appointmentRepo.save(appointment);

            this.logger.log(`创建预约记录成功：ID=${saved.id}, 手机号=${saved.phone}, uid=${uid}`);

            return ResultData.ok(instanceToPlain(saved), "预约成功");
        } catch (error) {
            this.logger.error(`创建预约记录失败: ${error.message}`, error.stack);
            return ResultData.fail(AppHttpCode.SERVICE_ERROR, `预约失败: ${error.message}`);
        }
    }

    /**
     * 查询预约记录列表
     * @param queryDto 查询参数
     * @returns 预约记录列表
     */
    async list(queryDto: QueryAppointmentDto): Promise<ResultData> {
        const { page = 1, pageSize = 10, phone, stage, channel, sortField, sortOrder } = queryDto;

        const queryBuilder = this.appointmentRepo.createQueryBuilder("appointment");

        // 按手机号搜索
        if (phone) {
            queryBuilder.andWhere("appointment.phone LIKE :phone", { phone: `%${phone}%` });
        }

        // 按阶段搜索
        if (stage) {
            queryBuilder.andWhere("appointment.stage = :stage", { stage });
        }

        // 按渠道搜索
        if (channel) {
            queryBuilder.andWhere("appointment.channel = :channel", { channel });
        }

        // 分页
        const skip = (page - 1) * pageSize;
        queryBuilder.skip(skip).take(pageSize);

        // 排序
        if (sortField && sortOrder) {
            const order = sortOrder === "ascend" ? "ASC" : "DESC";
            queryBuilder.orderBy(`appointment.${sortField}`, order);
        } else {
            // 默认按创建时间倒序
            queryBuilder.orderBy("appointment.createDate", "DESC");
        }

        const [items, total] = await queryBuilder.getManyAndCount();

        const response: AppointmentListResponseDto = {
            items: items.map((item) => instanceToPlain(item) as AppointmentInfoDto),
            total,
            page,
            pageSize,
        };

        return ResultData.ok(response);
    }

    /**
     * 导出预约记录为 Excel
     * @param queryDto 查询参数
     * @returns Excel 文件 Buffer
     */
    async exportToExcel(queryDto: QueryAppointmentDto): Promise<Buffer> {
        const { phone, stage, channel } = queryDto;

        const queryBuilder = this.appointmentRepo.createQueryBuilder("appointment");

        // 应用筛选条件
        if (phone) {
            queryBuilder.andWhere("appointment.phone LIKE :phone", { phone: `%${phone}%` });
        }

        if (stage) {
            queryBuilder.andWhere("appointment.stage = :stage", { stage });
        }

        if (channel) {
            queryBuilder.andWhere("appointment.channel = :channel", { channel });
        }

        // 按创建时间倒序
        queryBuilder.orderBy("appointment.createDate", "DESC");

        const items = await queryBuilder.getMany();

        // 构建 Excel 数据
        const excelData = [
            // 表头
            ["ID", "手机号", "阶段", "渠道", "预约时间", "额外字段1", "创建时间"],
            // 数据行
            ...items.map((item) => [
                item.id,
                item.phone,
                item.stage,
                item.channel,
                item.appointmentTime.toISOString(),
                item.extraField1 || "",
                item.createDate.toISOString(),
            ]),
        ];

        // 创建工作表
        const worksheet = [
            {
                name: "预约记录",
                data: excelData,
            },
        ];

        // 生成 Excel 文件
        const arrayBuffer = xlsx.build(worksheet);
        return Buffer.from(arrayBuffer);
    }

    /**
     * 根据手机号或UID查询预约状态
     * @param queryDto 查询参数
     * @returns 预约状态信息
     */
    async getAppointmentStatus(queryDto: QueryAppointmentStatusDto): Promise<ResultData> {
        try {
            const { phone, uid } = queryDto;

            // 至少需要提供一个查询条件
            if (!phone && !uid) {
                return ResultData.fail(AppHttpCode.PARAM_INVALID, "请提供手机号或UID");
            }

            let appointment: AppointmentEntity | undefined;

            // 优先通过UID查询，其次通过手机号查询
            if (uid) {
                appointment = await this.appointmentRepo.findOne({
                    where: { uid },
                });
                this.logger.log(`通过UID查询预约状态：uid=${uid}, 结果=${!!appointment}`);
            }

            if (!appointment && phone) {
                appointment = await this.appointmentRepo.findOne({
                    where: { phone },
                });
                this.logger.log(`通过手机号查询预约状态：phone=${phone}, 结果=${!!appointment}`);
            }

            // 构建响应
            const response: AppointmentStatusResponseDto = {
                hasAppointment: !!appointment,
                appointment: appointment
                    ? {
                          id: appointment.id,
                          phone: appointment.phone,
                          uid: appointment.uid,
                          stage: appointment.stage,
                          channel: appointment.channel,
                          appointmentTime: appointment.appointmentTime,
                          extraField1: appointment.extraField1,
                          createDate: appointment.createDate,
                      }
                    : undefined,
            };

            return ResultData.ok(response);
        } catch (error) {
            this.logger.error(`查询预约状态失败: ${error.message}`, error.stack);
            return ResultData.fail(AppHttpCode.SERVICE_ERROR, `查询失败: ${error.message}`);
        }
    }
}

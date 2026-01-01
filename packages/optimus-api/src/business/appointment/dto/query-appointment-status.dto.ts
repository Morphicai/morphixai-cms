import { IsString, IsOptional } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

/**
 * 查询预约状态请求 DTO
 */
export class QueryAppointmentStatusDto {
    @ApiPropertyOptional({ description: "手机号", example: "13800138000" })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ description: "用户UID", example: "uid_123456" })
    @IsOptional()
    @IsString()
    uid?: string;
}

/**
 * 预约状态响应 DTO
 */
export class AppointmentStatusResponseDto {
    @ApiPropertyOptional({ description: "是否已预约" })
    hasAppointment: boolean;

    @ApiPropertyOptional({ description: "预约信息" })
    appointment?: {
        id: number;
        phone: string;
        uid?: string;
        stage: string;
        channel: string;
        appointmentTime: Date;
        extraField1?: string;
        createDate: Date;
    };
}

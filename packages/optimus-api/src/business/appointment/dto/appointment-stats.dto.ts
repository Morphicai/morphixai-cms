import { ApiProperty } from "@nestjs/swagger";

/**
 * 预约总数统计响应DTO
 */
export class AppointmentStatsDto {
    @ApiProperty({ description: "预约总数", example: 15680 })
    total: number;
}

/**
 * 阶段预约统计DTO
 */
export class AppointmentStageStatsDto {
    @ApiProperty({ description: "阶段名称", example: "pre-register" })
    stage: string;

    @ApiProperty({ description: "该阶段预约数", example: 8500 })
    count: number;
}

/**
 * 渠道预约统计DTO
 */
export class AppointmentChannelStatsDto {
    @ApiProperty({ description: "渠道名称", example: "official" })
    channel: string;

    @ApiProperty({ description: "该渠道预约数", example: 12000 })
    count: number;
}

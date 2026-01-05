import { IsString, IsNotEmpty, IsOptional, IsDateString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * 创建预约记录请求 DTO
 * 注意：uid 会自动从客户端用户认证守卫中获取，无需在请求体中传递
 */
export class CreateAppointmentDto {
    @ApiProperty({ description: "手机号", example: "13800138000" })
    @IsString()
    @IsNotEmpty({ message: "手机号不能为空" })
    phone: string;

    @ApiPropertyOptional({ description: "用户UID（可选，优先使用请求头中的uid）", example: "uid_123456" })
    @IsOptional()
    @IsString()
    uid?: string;

    @ApiProperty({ description: "阶段", example: "测试阶段" })
    @IsString()
    @IsNotEmpty({ message: "阶段不能为空" })
    stage: string;

    @ApiProperty({ description: "渠道", example: "官网" })
    @IsString()
    @IsNotEmpty({ message: "渠道不能为空" })
    channel: string;

    @ApiProperty({ description: "预约时间", example: "2024-01-01T10:00:00Z" })
    @IsDateString({}, { message: "预约时间格式不正确" })
    @IsNotEmpty({ message: "预约时间不能为空" })
    appointmentTime: string;

    @ApiPropertyOptional({ description: "额外字段1", example: "备注信息" })
    @IsOptional()
    @IsString()
    extraField1?: string;
}
